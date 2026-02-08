
import React, { useEffect } from 'react';

export type NotificationType = 'error' | 'success' | 'info';

interface NotificationToastProps {
  message: string | null;
  type: NotificationType;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const icons = {
    error: 'error',
    success: 'check_circle',
    info: 'info'
  };

  const colors = {
    error: 'border-red-500 text-red-500 bg-red-500/5',
    success: 'border-primary text-primary bg-primary/5',
    info: 'border-blue-400 text-blue-400 bg-blue-400/5'
  };

  return (
    <div 
      onClick={onClose}
      className={`fixed bottom-8 right-8 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl border-l-4 bg-bg-card/90 backdrop-blur-xl shadow-2xl cursor-pointer animate-in slide-in-from-right-10 fade-in duration-300 ${colors[type]}`}
    >
      <span className="material-symbols-outlined font-bold text-2xl">
        {icons[type]}
      </span>
      <div className="flex flex-col">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-0.5">System Message</p>
        <p className="text-[12px] font-bold text-white tracking-wide">{message}</p>
      </div>
      <button className="ml-4 opacity-30 hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
};

export default NotificationToast;
