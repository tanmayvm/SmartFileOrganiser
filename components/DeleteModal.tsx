
import React from 'react';
import { Asset } from '../types';

interface DeleteModalProps {
  asset: Asset | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ asset, onClose, onConfirm }) => {
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-bg-card border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 overflow-hidden">
        {/* Destructive Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20 shadow-2xl shadow-red-500/5">
            <span className="material-symbols-outlined text-3xl font-bold">delete_forever</span>
          </div>
          
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Confirm Delete</h3>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-8 leading-relaxed max-w-[200px]">
            This action will permanently remove <span className="text-white">"{asset.name}"</span> from your storage.
          </p>

          <div className="w-full space-y-3">
            <button 
              onClick={onConfirm}
              className="w-full py-4 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all"
            >
              Delete Asset
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:bg-white/10 transition-all"
            >
              Nevermind
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
