import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const NotificationBanner: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const isSuccess = type === 'success';

  return (
    <div className={`
      flex items-center gap-4 px-5 py-4 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[320px]
      ${isSuccess 
        ? 'bg-green-950/40 border-neon-green/50 text-neon-green shadow-neon-green/10' 
        : 'bg-red-950/40 border-neon-red/50 text-neon-red shadow-neon-red/10'
      }
    `}>
      {isSuccess ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      
      <div className="flex-1">
        <p className="text-xs font-bold tracking-widest uppercase mb-0.5">
          {isSuccess ? 'System.Success' : 'System.Error'}
        </p>
        <p className="text-sm font-medium text-white/90">{message}</p>
      </div>

      <button onClick={onClose} className="hover:opacity-70 transition-opacity">
        <X size={18} />
      </button>
    </div>
  );
};