
import React, { useState } from 'react';
import { Folder, Asset } from '../types';

interface FolderPanelProps {
  folders: Folder[];
  onMove: (asset: Asset, folder: Folder) => void;
  onCreateFolder: () => void;
  isLoading?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const FolderPanel: React.FC<FolderPanelProps> = ({ 
  folders, 
  onMove, 
  onCreateFolder, 
  isLoading, 
  selectedId, 
  onSelect
}) => {
  return (
    <aside className="w-72 xl:w-80 flex-shrink-0 border-l border-white/5 bg-bg-sidebar flex flex-col h-full overflow-hidden z-30 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.5)]">
      <div className="p-8 border-b border-white/5 bg-bg-sidebar/50">
        <button 
          onClick={onCreateFolder}
          className="group w-full bg-primary text-bg-main font-black py-4 px-4 rounded-2xl border border-black/10 flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-[0.98] text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-90">add</span>
          New Collection
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-black/5">
          <div className="flex flex-col gap-2">
            {folders.map((folder) => (
              <FolderItem 
                key={folder.id} 
                folder={folder} 
                onMove={onMove} 
                isSelected={selectedId === folder.id}
                onSelect={() => onSelect(folder.id)}
              />
            ))}
            
            {folders.length === 0 && !isLoading && (
              <div className="py-24 text-center border-2 border-dashed border-white/[0.03] rounded-3xl bg-white/[0.01]">
                <span className="material-symbols-outlined text-gray-800 text-5xl mb-4 opacity-30">folder_off</span>
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-600">No Groups Found</p>
                <p className="text-[8px] text-gray-700 font-bold uppercase mt-2">Start by creating a board</p>
              </div>
            )}

            {folders.length === 0 && isLoading && (
              <div className="py-24 text-center">
                <div className="inline-block w-10 h-10 border-2 border-gray-800 border-t-gray-400 rounded-full animate-spin mb-6"></div>
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-600 animate-pulse">Scanning Drive...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 bg-black/40 border-t border-white/5 text-center flex flex-col gap-2 backdrop-blur-2xl">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Workspace Root</p>
        <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest opacity-40">
          Drop or Paste in center to save in root
        </p>
      </div>
    </aside>
  );
};

const FolderItem: React.FC<{ 
  folder: Folder, 
  onMove: (asset: Asset, folder: Folder) => void, 
  isSelected: boolean,
  onSelect: () => void 
}> = ({ folder, onMove, isSelected, onSelect }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsOver(true); };
  const handleDragLeave = () => { setIsOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const draggingAsset = (window as any)._draggingAsset as Asset;
    if (draggingAsset) { onMove(draggingAsset, folder); (window as any)._draggingAsset = null; }
  };

  return (
    <div 
      onClick={onSelect}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      className={`p-[0.6rem] rounded-xl border transition-all flex items-center gap-3 cursor-pointer group ${
        isOver 
          ? 'border-primary bg-primary/10 scale-[1.03] shadow-2xl shadow-primary/10' 
          : isSelected 
            ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5'
            : 'border-white/[0.03] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/10'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        (isOver || isSelected)
          ? 'bg-primary text-bg-main shadow-2xl shadow-primary/40 -rotate-3' 
          : 'bg-white/5 text-gray-600 group-hover:text-primary group-hover:bg-primary/5'
      }`}>
        <span className={`material-symbols-outlined text-xl ${(isOver || isSelected) ? 'fill-1' : ''}`}>
          {(isOver || isSelected) ? 'folder_open' : 'folder_copy'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[12px] font-black text-gray-100 truncate leading-none mb-1.5 uppercase tracking-wide">{folder.name}</h4>
        <div className="flex items-center gap-1.5">
           <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-primary/30'}`}></span>
           <p className={`text-[9px] font-bold tracking-widest uppercase ${isSelected ? 'text-primary/70' : 'text-gray-500'}`}>{folder.count} assets</p>
        </div>
      </div>
    </div>
  );
};

export default FolderPanel;
