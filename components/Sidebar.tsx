
import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-20 h-full flex flex-col items-center py-10 border-r border-white/5 bg-bg-sidebar">
      <div className="mb-14 text-primary">
        <span className="material-symbols-outlined text-4xl font-black drop-shadow-[0_0_15px_rgba(225,173,1,0.5)]">auto_fix_high</span>
      </div>
      
      <nav className="flex flex-col gap-8 w-full px-4">
        <a className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-bg-main shadow-[0_10px_20px_-5px_rgba(225,173,1,0.4)] transition-all hover:scale-110" href="#">
          <span className="material-symbols-outlined text-2xl font-black">grid_view</span>
        </a>
        <a className="flex items-center justify-center w-12 h-12 rounded-2xl text-gray-600 hover:text-white transition-all hover:bg-white/5" href="#">
          <span className="material-symbols-outlined text-2xl">category</span>
        </a>
        <a className="flex items-center justify-center w-12 h-12 rounded-2xl text-gray-600 hover:text-white transition-all hover:bg-white/5" href="#">
          <span className="material-symbols-outlined text-2xl">auto_awesome_motion</span>
        </a>
        <a className="flex items-center justify-center w-12 h-12 rounded-2xl text-gray-600 hover:text-white transition-all hover:bg-white/5" href="#">
          <span className="material-symbols-outlined text-2xl">palette</span>
        </a>
      </nav>
      
      <div className="mt-auto pb-6">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-all border border-white/5 hover:border-primary/30 group">
          <span className="text-gray-500 font-black text-xs group-hover:text-primary transition-colors">OS</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
