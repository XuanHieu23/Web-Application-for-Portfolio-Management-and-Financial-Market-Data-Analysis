import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-neon-panel border border-neon-green/30 rounded-2xl p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,255,157,0.1)] relative overflow-hidden">
        {/* Hiệu ứng ánh sáng nền */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-neon-green/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-950/50 rounded-full flex items-center justify-center mb-6 border border-neon-green/50">
            <CheckCircle className="text-neon-green w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Payment Successful!</h1>
          <p className="text-gray-400 font-mono text-sm mb-8 leading-relaxed">
            Welcome to <span className="text-neon-cyan font-bold">POMAFINA PRO</span>. Your transaction has been verified and your account is now upgraded.
          </p>

          <button 
            onClick={() => navigate('/home')}
            className="w-full py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] transition-all flex items-center justify-center gap-2 group"
          >
            ENTER PRO DASHBOARD
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};