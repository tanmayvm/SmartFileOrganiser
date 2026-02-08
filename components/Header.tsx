
import React from 'react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onConnect: () => void;
  onResume?: () => void;
  isConnected: boolean;
  currentPath: string;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, onConnect, onResume, isConnected, currentPath }) => {
  return (
    <header className="h-20 border-b border-white/5 flex flex-shrink-0 items-center px-6 lg:px-10 bg-bg-main/90 backdrop-blur-2xl z-20">
      <div className="flex items-center gap-6 mr-10 flex-shrink-0">
        <div className={`p-3 rounded-xl transition-all ${isConnected ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'bg-white/5 text-gray-700 border border-white/5'}`}>
          <span className="material-symbols-outlined text-xl font-bold">
            {isConnected ? 'account_tree' : 'cloud_off'}
          </span>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-1">Local Filesystem Access</p>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-primary animate-pulse' : 'bg-gray-800'}`}></span>
            <p className={`text-[11px] font-black font-mono tracking-tight flex items-center gap-1 ${isConnected ? 'text-gray-300' : 'text-gray-600'}`}>
              {isConnected ? (
                <>
                  <span className="opacity-40">/Volumes/</span>
                  <span className="text-white">{currentPath}</span>
                  <span className="opacity-40">/_root</span>
                </>
              ) : (
                'DISCONNECTED'
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 max-w-xl relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-lg">manage_search</span>
        <input 
          className="w-full bg-white/5 border-none rounded-2xl py-3 pl-12 pr-5 focus:ring-2 focus:ring-primary/20 text-xs font-bold transition-all text-white placeholder-gray-800" 
          placeholder="Query local pool..." 
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-4 ml-6">
        {onResume && (
          <button 
            onClick={onResume}
            className="flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest bg-white/5 text-primary border border-primary/20 rounded-2xl transition-all hover:bg-primary/10 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm font-bold">restore</span>
            Resume
          </button>
        )}
        <button 
          onClick={onConnect}
          className="flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest bg-primary text-bg-main rounded-2xl transition-all shadow-xl shadow-primary/10 hover:brightness-110 active:scale-95 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-sm font-bold">folder_managed</span>
          {isConnected ? 'Switch Root' : 'Select Folder'}
        </button>
      </div>
    </header>
  );
};

export default Header;
