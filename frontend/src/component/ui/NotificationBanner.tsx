import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

export const NotificationBanner: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  // Tự động đóng sau 3 giây
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-green-950/90 border-neon-green text-neon-green shadow-[0_0_15px_rgba(0,255,157,0.2)]',
    error: 'bg-red-950/90 border-neon-red text-neon-red shadow-[0_0_15px_rgba(255,51,102,0.2)]',
    warning: 'bg-yellow-950/90 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]',
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-bounce-in">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border backdrop-blur-md transition-all ${styles[type]}`}>
        {icons[type]}
        <span className="font-medium text-sm tracking-wide">{message}</span>
        <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity">
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
};