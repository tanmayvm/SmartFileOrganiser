
import React from 'react';
import { Asset, Folder } from '../types';

interface AssetGridProps {
  assets: Asset[];
  onMove: (asset: Asset, folder: Folder) => void;
  onDelete: (asset: Asset) => void;
}

const AssetGrid: React.FC<AssetGridProps> = ({ assets, onMove, onDelete }) => {
  return (
    <div className="masonry-grid">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} onDelete={() => onDelete(asset)} />
      ))}
      {assets.length === 0 && (
        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-lg bg-white/[0.01]">
          <p className="text-gray-700 font-black text-[10px] uppercase tracking-[0.3em]">Pool indexing complete</p>
        </div>
      )}
    </div>
  );
};

const AssetCard: React.FC<{ asset: Asset, onDelete: () => void }> = ({ asset, onDelete }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('assetId', asset.id);
    (window as any)._draggingAsset = asset;
    
    const dragIcon = document.createElement('div');
    dragIcon.className = "bg-primary text-bg-main px-3 py-1.5 rounded font-black text-[9px] uppercase fixed -top-40 shadow-xl border border-black/20";
    dragIcon.innerText = "MOVING ASSET";
    document.body.appendChild(dragIcon);
    e.dataTransfer.setDragImage(dragIcon, 10, 10);
    setTimeout(() => document.body.removeChild(dragIcon), 0);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      className="masonry-item group relative overflow-hidden rounded-lg bg-bg-card border border-white/5 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing shadow-lg"
    >
      {/* Delete Action Overlay */}
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-8 h-8 flex items-center justify-center bg-red-500/80 hover:bg-red-500 text-white rounded-lg shadow-xl backdrop-blur-md transition-all active:scale-90"
          title="Delete from drive"
        >
          <span className="material-symbols-outlined text-[18px] font-bold">delete_forever</span>
        </button>
      </div>

      {asset.type === 'image' ? (
        <img 
          className="w-full h-auto block transform group-hover:scale-[1.02] transition-transform duration-500" 
          src={asset.url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'} 
          alt={asset.name} 
          loading="lazy" 
        />
      ) : (
        <div className="relative">
          <video 
            className="w-full h-auto block"
            src={asset.url}
            muted
            loop
            preload="none"
            onMouseEnter={(e) => {
              if (e.currentTarget.src) {
                e.currentTarget.preload = "auto";
                e.currentTarget.play().catch(() => {});
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm p-1 rounded border border-white/10 pointer-events-none">
             <span className="material-symbols-outlined text-white text-[14px]">play_circle</span>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-300">
        <div className="absolute bottom-2 left-2.5 right-2.5">
          <p className="text-[10px] font-black text-white truncate drop-shadow-md">{asset.name}</p>
        </div>
      </div>
    </div>
  );
};

export default AssetGrid;
