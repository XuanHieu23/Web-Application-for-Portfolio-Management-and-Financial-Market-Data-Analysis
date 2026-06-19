import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { axiosClient } from '../services/axiosClient';
import { useAuthStore } from '../store/authStore';

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    const syncTier = async () => {
      try {
        const res = await axiosClient.get('/auth/me');
        if (res.data?.success && res.data.user?.tier === 'PRO') {

          updateUser({
            tier: 'PRO',
            username: res.data.user.username,
            email: res.data.user.email,
            avatar: res.data.user.avatar,
          });
          setSyncing(false);
          return;
        }
      } catch {  }

      attempts++;
      if (attempts < MAX_ATTEMPTS) {

        setTimeout(syncTier, 2000);
      } else {

        setSyncing(false);
      }
    };

    const timer = setTimeout(syncTier, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-neon-panel border border-neon-green/30 rounded-2xl p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,255,157,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-neon-green/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-950/50 rounded-full flex items-center justify-center mb-6 border border-neon-green/50">
            <CheckCircle className="text-neon-green w-10 h-10" />
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Payment Successful!</h1>
          <p className="text-gray-400 font-mono text-sm mb-8 leading-relaxed">
            Welcome to <span className="text-neon-cyan font-bold">POMAFINA PRO</span>. Your transaction has been verified and your account is now upgraded.
          </p>

          {syncing ? (
            <div className="w-full py-3 bg-gray-800 text-gray-400 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              SYNCING YOUR ACCOUNT...
            </div>
          ) : (
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] transition-all flex items-center justify-center gap-2 group"
            >
              ENTER PRO DASHBOARD
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
