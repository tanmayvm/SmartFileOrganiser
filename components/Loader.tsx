
import React from 'react';

interface LoaderProps {
  progress: number;
}

const Loader: React.FC<LoaderProps> = ({ progress }) => {
  return (
    <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-lg flex items-center justify-center p-10">
      <div className="max-w-md w-full bg-bg-card border border-white/10 rounded-[2.5rem] p-12 flex flex-col items-center shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 blur-[80px] rounded-full"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/5 blur-[80px] rounded-full"></div>

        <div className="relative w-32 h-32 mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle 
              className="text-white/5" 
              strokeWidth="4" 
              stroke="currentColor" 
              fill="transparent" 
              r="45" 
              cx="50" 
              cy="50" 
            />
            <circle 
              className="text-primary transition-all duration-500 ease-in-out" 
              strokeWidth="6" 
              strokeDasharray={`${progress * 2.827}, 282.7`} 
              strokeLinecap="round" 
              stroke="currentColor" 
              fill="transparent" 
              r="45" 
              cx="50" 
              cy="50" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{Math.round(progress)}%</span>
          </div>
        </div>
        
        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Updating Storage</h3>
        <p className="text-gray-500 text-center text-sm font-medium leading-relaxed">
          Relocating asset binary data on your drive. <br/>
          <span className="text-primary/60 text-xs font-bold uppercase mt-2 block tracking-widest">Process in progress</span>
        </p>
      </div>
    </div>
  );
};

export default Loader;
