
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Asset, Folder, FileSystemState } from './types';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AssetGrid from './components/AssetGrid';
import FolderPanel from './components/FolderPanel';
import Loader from './components/Loader';
import FolderModal from './components/FolderModal';
import DeleteModal from './components/DeleteModal';
import NotificationToast, { NotificationType } from './components/NotificationToast';

const INITIAL_LOAD_COUNT = 24; 
const SCROLL_LOAD_BATCH_SIZE = 12;
const DB_NAME = 'MediaManagerDB';
const STORE_NAME = 'handles';

// IndexedDB Helper for persistence
const getStoredHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get('root');
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};

const saveStoredHandle = async (handle: FileSystemDirectoryHandle) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(handle, 'root');
  };
};

// Utility to determine media type
const getMediaType = (fileName: string, mimeType?: string): 'image' | 'video' | null => {
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('video/')) return 'video';
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['mp4', 'webm', 'ogg', 'mov', 'mkv'].includes(ext || '')) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext || '')) return 'image';
  return null;
};

const App: React.FC = () => {
  const [state, setState] = useState<FileSystemState & { pendingHandles: Asset[], maxVisible: number, selectedFolderId: string | null, hasStoredHandle: boolean }>({
    assets: [],
    folders: [],
    isLoading: false,
    rootHandle: null,
    transferring: false,
    progress: 0,
    error: null,
    isNativeSupported: 'showDirectoryPicker' in window,
    isFallbackActive: false,
    pendingHandles: [],
    maxVisible: INITIAL_LOAD_COUNT,
    selectedFolderId: null,
    hasStoredHandle: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [isExternalDragging, setIsExternalDragging] = useState(false);
  const [notification, setNotification] = useState<{ message: string | null, type: NotificationType }>({
    message: null,
    type: 'info'
  });
  
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const notify = (message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
  };

  // Check for stored handle on mount
  useEffect(() => {
    getStoredHandle().then(handle => {
      if (handle) setState(prev => ({ ...prev, hasStoredHandle: true }));
    });
  }, []);

  // Infinite scroll logic
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      if (state.pendingHandles.length > 0 && state.assets.length >= state.maxVisible) {
        setState(prev => ({ ...prev, maxVisible: prev.maxVisible + SCROLL_LOAD_BATCH_SIZE }));
      }
    }
  }, [state.pendingHandles.length, state.assets.length, state.maxVisible]);

  // Helper to refresh files from a native directory handle
  const refreshFilesNative = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, isFallbackActive: false, maxVisible: INITIAL_LOAD_COUNT }));
    const discoveredFolders: Folder[] = [];
    const discoveredFiles: Asset[] = [];

    try {
      const permission = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        const status = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
        if (status !== 'granted') {
           setState(prev => ({ ...prev, isLoading: false, error: "Access denied. Please click 'Init Workspace' to grant permissions." }));
           return;
        }
      }

      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'file') {
          const type = getMediaType(entry.name);
          if (type) discoveredFiles.push({ id: entry.name, name: entry.name, type, url: '', handle: entry });
        } else if (entry.kind === 'directory') {
          const folderObj: Folder = { id: entry.name, name: entry.name, count: 0, handle: entry };
          discoveredFolders.push(folderObj);
          setState(prev => ({ ...prev, folders: [...discoveredFolders] }));
        }
      }

      setState(prev => ({ ...prev, isLoading: false, assets: [], pendingHandles: discoveredFiles, folders: [...discoveredFolders] }));

      discoveredFolders.forEach(async (folder) => {
        let count = 0;
        try {
          for await (const subEntry of (folder.handle as any).values()) { if (subEntry.kind === 'file') count++; }
          setState(prev => ({ ...prev, folders: prev.folders.map(f => f.id === folder.id ? { ...f, count } : f) }));
        } catch (e) {}
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') setState(prev => ({ ...prev, isLoading: false, error: error.message }));
    }
  }, []);

  const handleExternalFile = useCallback(async (file: File) => {
    if (!state.rootHandle) return;
    if (state.isFallbackActive) {
      notify("Saving is disabled in Fallback Mode.", 'error');
      return;
    }
    
    const type = getMediaType(file.name, file.type);
    if (!type) return;

    setState(prev => ({ ...prev, transferring: true, progress: 0 }));

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const ext = file.name.split('.').pop() || (type === 'image' ? 'png' : 'mp4');
    const fileName = `import_${timestamp}.${ext}`;

    try {
      const fileHandle = await state.rootHandle.getFileHandle(fileName, { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(file);
      setState(prev => ({ ...prev, progress: 50 }));
      await writable.close();
      setState(prev => ({ ...prev, transferring: false, progress: 100 }));
      notify(`Saved ${fileName}`, 'success');
      await refreshFilesNative(state.rootHandle);
    } catch (err: any) {
      console.error(err);
      notify("Failed to save asset: " + err.message, 'error');
      setState(prev => ({ ...prev, transferring: false }));
    }
  }, [state.rootHandle, state.isFallbackActive, refreshFilesNative]);

  const confirmDelete = async () => {
    if (!state.rootHandle || !assetToDelete) return;
    if (state.isFallbackActive) {
      notify("Deleting is disabled in Fallback Mode.", 'error');
      setAssetToDelete(null);
      return;
    }

    try {
      await state.rootHandle.removeEntry(assetToDelete.name);
      setState(prev => ({
        ...prev,
        assets: prev.assets.filter(a => a.id !== assetToDelete.id),
        pendingHandles: prev.pendingHandles.filter(a => a.id !== assetToDelete.id)
      }));
      if (assetToDelete.url) URL.revokeObjectURL(assetToDelete.url);
      setAssetToDelete(null);
      notify("Asset deleted permanently.", 'info');
    } catch (err: any) {
      notify("Delete failed: " + err.message, 'error');
      setAssetToDelete(null);
    }
  };

  const connectFolder = async () => {
    try {
      if (!(window as any).showDirectoryPicker) throw new Error("API_NOT_SUPPORTED");
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await saveStoredHandle(handle);
      setState(prev => ({ ...prev, rootHandle: handle, isFallbackActive: false, assets: [], folders: [], pendingHandles: [], maxVisible: INITIAL_LOAD_COUNT, selectedFolderId: null, hasStoredHandle: true }));
      await refreshFilesNative(handle);
      notify("Workspace connected successfully.", 'success');
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.warn("Native picker failed, switching to fallback:", error.message);
      setState(prev => ({ ...prev, error: "Sandbox restriction detected. Opening standard folder picker..." }));
      setTimeout(() => fallbackInputRef.current?.click(), 1000);
    }
  };

  const resumeWorkspace = async () => {
    const handle = await getStoredHandle();
    if (handle) {
      setState(prev => ({ ...prev, rootHandle: handle, isFallbackActive: false, assets: [], folders: [], pendingHandles: [], maxVisible: INITIAL_LOAD_COUNT }));
      await refreshFilesNative(handle);
      notify("Workspace resumed.", 'info');
    }
  };

  const handleCreateFolder = async (name: string) => {
    if (state.rootHandle && !state.isFallbackActive) {
      try {
        await state.rootHandle.getDirectoryHandle(name, { create: true });
        notify(`Created board "${name}"`, 'success');
        setTimeout(() => refreshFilesNative(state.rootHandle!), 100);
      } catch (e: any) { notify(e.message, 'error'); }
    }
  };

  const moveFile = async (asset: Asset, targetFolder: Folder) => {
    if (state.isFallbackActive) {
      notify("Moving files is disabled in Fallback Mode.", 'error');
      return;
    }
    setState(prev => ({ ...prev, transferring: true, progress: 0 }));
    try {
      if (asset.handle && targetFolder.handle) {
        if ((asset.handle as any).move) {
          await (asset.handle as any).move(targetFolder.handle);
        } else {
          const newH = await targetFolder.handle.getFileHandle(asset.name, { create: true });
          const w = await (newH as any).createWritable();
          await w.write(await asset.handle.getFile());
          await w.close();
          await state.rootHandle!.removeEntry(asset.name);
        }
      }
      setState(prev => ({
        ...prev, transferring: false, progress: 100,
        assets: prev.assets.filter(a => a.id !== asset.id),
        folders: prev.folders.map(f => f.id === targetFolder.id ? { ...f, count: f.count + 1 } : f)
      }));
      notify(`Moved to ${targetFolder.name}`, 'success');
    } catch (e: any) { 
      notify(e.message, 'error'); 
      setState(prev => ({ ...prev, transferring: false })); 
    }
  };

  // Background pool filler
  useEffect(() => {
    const fillPool = async () => {
      if (state.assets.length >= state.maxVisible || state.pendingHandles.length === 0 || state.isLoading) return;

      const nextBatchSize = Math.min(8, state.maxVisible - state.assets.length);
      const batchToProcess = state.pendingHandles.slice(0, nextBatchSize);
      const remainingHandles = state.pendingHandles.slice(nextBatchSize);

      const processedBatch = await Promise.all(batchToProcess.map(async item => {
        let url = '';
        try {
          if (item.handle) {
            const file = await item.handle.getFile();
            url = URL.createObjectURL(file);
          } else if (item.rawFile) {
            url = URL.createObjectURL(item.rawFile);
          }
        } catch (e) {
          console.error("Failed to generate URL for asset:", item.name, e);
        }
        return { ...item, url };
      }));

      setState(prev => ({ 
        ...prev, 
        assets: [...prev.assets, ...processedBatch], 
        pendingHandles: remainingHandles 
      }));
    };

    const schedule = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 100));
    const cancel = (window as any).cancelIdleCallback || ((id: any) => clearTimeout(id));
    
    const timeoutId = schedule(fillPool);
    return () => cancel(timeoutId);
  }, [state.assets.length, state.pendingHandles.length, state.isLoading, state.maxVisible]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('video') !== -1) {
          const file = items[i].getAsFile();
          if (file) handleExternalFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleExternalFile]);

  const filteredVisibleAssets = state.assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const isAnyConnection = !!state.rootHandle || state.isFallbackActive;
  const currentPath = state.rootHandle?.name || (state.isFallbackActive ? "Local Pool" : "No Source");

  return (
    <div className="flex h-screen w-screen bg-bg-main overflow-hidden select-none">
      <input 
        type="file" 
        className="hidden" 
        ref={fallbackInputRef} 
        {...({ webkitdirectory: "", directory: "" } as any)} 
        onChange={(e) => {
           const files = e.target.files;
           if (!files?.length) return;
           setState(prev => ({ ...prev, isLoading: true, isFallbackActive: true, assets: [], pendingHandles: [], folders: [] }));
           const allPending: Asset[] = Array.from(files).map(f => {
              const type = getMediaType(f.name, f.type);
              return type ? { id: Math.random().toString(36).substr(2, 9), name: f.name, type, url: '', rawFile: f } : null;
           }).filter(Boolean) as Asset[];
           setState(prev => ({ ...prev, isLoading: false, pendingHandles: allPending }));
           notify("Fallback read-only mode active.", 'info');
        }} 
      />
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header 
          searchQuery={searchQuery} onSearchChange={setSearchQuery} onConnect={connectFolder}
          onResume={state.hasStoredHandle && !isAnyConnection ? resumeWorkspace : undefined}
          isConnected={isAnyConnection} currentPath={currentPath}
        />
        <main 
          onDragOver={(e) => { e.preventDefault(); if (e.dataTransfer.types.includes('Files')) setIsExternalDragging(true); }}
          onDragLeave={() => setIsExternalDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsExternalDragging(false); const files = e.dataTransfer.files; if (files.length) Array.from(files).forEach(handleExternalFile); }}
          className={`flex-1 flex flex-col min-h-0 relative transition-colors duration-300 ${isExternalDragging ? 'bg-primary/5' : 'bg-[#0a0a0a]'}`}
        >
          {isExternalDragging && (
            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
              <div className="bg-primary/90 text-bg-main px-12 py-6 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-90">
                <span className="material-symbols-outlined text-6xl font-black">upload_file</span>
                <p className="text-xl font-black uppercase tracking-tighter">Save to {currentPath}</p>
              </div>
            </div>
          )}

          <div 
            ref={scrollContainerRef} 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 scroll-smooth"
          >
            {state.error && (
              <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-xl text-primary flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">error_outline</span>
                <p className="text-[10px] font-black uppercase tracking-widest">{state.error}</p>
              </div>
            )}

            {!isAnyConnection && !state.isLoading ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-white/[0.03] rounded-[2rem] flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                  <span className="material-symbols-outlined text-5xl text-primary/80">folder_zip</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight tracking-widest">Connect Workspace</h2>
                <p className="text-gray-500 mb-8 max-w-sm text-sm font-medium">Select a folder on your drive to begin managing assets with high-speed filesystem access.</p>
                <div className="flex gap-4">
                  <button onClick={connectFolder} className="bg-primary text-bg-main font-black py-4 px-10 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-2xl shadow-primary/20">Init Workspace</button>
                  {state.hasStoredHandle && <button onClick={resumeWorkspace} className="bg-white/5 text-primary border border-primary/20 font-black py-4 px-10 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-primary/10 transition-all">Resume Session</button>}
                </div>
              </div>
            ) : (
              <div className="max-w-[1800px] mx-auto w-full">
                <div className="mb-10 flex items-center justify-between py-4">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                    Workspace
                    <span className="bg-white/5 text-gray-500 text-[9px] py-1.5 px-3 rounded-full font-bold tracking-[0.2em]">
                      {state.assets.length + state.pendingHandles.length} ASSETS
                    </span>
                  </h2>
                  {state.isFallbackActive && (
                    <div className="bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                       <span className="material-symbols-outlined text-[14px] text-primary">warning</span>
                       <span className="text-[9px] font-black uppercase text-primary tracking-widest">Read-Only Mode</span>
                    </div>
                  )}
                </div>
                
                <AssetGrid assets={filteredVisibleAssets} onMove={moveFile} onDelete={(a) => setAssetToDelete(a)} />
                
                {(state.pendingHandles.length > 0 || state.isLoading) && (
                  <div className="py-20 flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.4em]">Indexing Volume...</span>
                  </div>
                )}

                {state.assets.length === 0 && !state.isLoading && state.pendingHandles.length === 0 && (
                  <div className="py-40 text-center opacity-20">
                     <span className="material-symbols-outlined text-6xl mb-6">folder_open</span>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">Directory is empty</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {state.transferring && <Loader progress={state.progress} />}
        </main>
      </div>
      <FolderPanel folders={state.folders} selectedId={state.selectedFolderId} onSelect={(id) => setState(prev => ({ ...prev, selectedFolderId: id }))} onMove={moveFile} onCreateFolder={() => setIsModalOpen(true)} isLoading={state.isLoading} />
      <FolderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateFolder} />
      <DeleteModal asset={assetToDelete} onClose={() => setAssetToDelete(null)} onConfirm={confirmDelete} />
      <NotificationToast 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification(n => ({ ...n, message: null }))} 
      />
    </div>
  );
};

export default App;
