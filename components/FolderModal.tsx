
import React, { useState, useEffect, useRef } from 'react';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const FolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [folderName, setFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-bg-card border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined font-bold">create_new_folder</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">New Board</h3>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Structure your workspace</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-gray-500 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3 block px-1">Collection Name</label>
            <input 
              ref={inputRef}
              type="text" 
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Summer Visuals"
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-white placeholder-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!folderName.trim()}
              className="flex-1 py-4 rounded-2xl bg-primary text-bg-main text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderModal;
