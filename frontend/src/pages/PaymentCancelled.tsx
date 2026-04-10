import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, RefreshCcw } from 'lucide-react';

export const PaymentCancelled: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-neon-panel border border-neon-red/30 rounded-2xl p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(255,51,102,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-neon-red/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-950/50 rounded-full flex items-center justify-center mb-6 border border-neon-red/50">
            <XCircle className="text-neon-red w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Payment Cancelled</h1>
          <p className="text-gray-400 font-mono text-sm mb-8 leading-relaxed">
            Your transaction was cancelled or declined. No charges were made. Your account remains on the FREE tier.
          </p>

          <button 
            onClick={() => navigate('/home')}
            className="w-full py-3 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition-all border border-gray-600 flex items-center justify-center gap-2"
          >
            <RefreshCcw size={16} /> RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
};