import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Search, User, LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MarketTicker } from '../ui/MarketTicker';
import { useAuthStore } from '../../store/authStore';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex h-screen bg-neon-bg text-white font-sans overflow-hidden">

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-neon-panel/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
          <div className="relative w-64 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search Bitcoin, Ethereum..."
              className="w-full bg-gray-900/50 border border-gray-700 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-2 text-neon-green text-sm px-3 py-1 bg-green-950/30 rounded-full border border-neon-green/30">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
              Live
            </div>

            {/* Avatar + Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 group"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover border-2 border-neon-cyan/50 shadow-[0_0_10px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-neon-cyan to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_10px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform select-none">
                    {initials}
                  </div>
                )}
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-52 bg-[#0F1218] border border-gray-700 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-white font-bold text-sm truncate">{user?.username}</p>
                    <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border ${
                      user?.tier === 'PRO'
                        ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                        : 'bg-gray-800 text-gray-500 border-gray-700'
                    }`}>
                      {user?.tier === 'PRO' ? '⚡ PRO' : 'FREE'}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/60 hover:text-white transition-colors"
                    >
                      <User size={15} className="text-gray-400" />
                      Profile
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-red-950/40 hover:text-red-400 transition-colors"
                    >
                      <LogOut size={15} className="text-gray-400 group-hover:text-red-400" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Market Ticker */}
        <div className="shrink-0 border-b border-gray-800">
          <MarketTicker />
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <Outlet />
        </div>

      </main>
    </div>
  );
};
