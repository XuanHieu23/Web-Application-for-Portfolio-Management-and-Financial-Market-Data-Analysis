import React from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { Sidebar } from './Sidebar'; 
import { MarketTicker } from '../ui/MarketTicker'; // Import Ticker

export const MainLayout: React.FC = () => {
  return (
    // Khung tổng: Chia 2 cột ngang (Sidebar & Main)
    <div className="flex h-screen bg-neon-bg text-white font-sans overflow-hidden">
      
      {/* Cột trái: Sidebar */}
      <Sidebar />

      {/* Cột phải: Toàn bộ nội dung chính */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Header - Giữ nguyên giao diện xịn xò của bạn */}
        <header className="h-16 border-b border-gray-800 bg-neon-panel/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
          <div className="relative w-64 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search Bitcoin, Ethereum..." 
              className="w-full bg-gray-900/50 border border-gray-700 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-neon-green text-sm px-3 py-1 bg-green-950/30 rounded-full border border-neon-green/30">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
              Live
            </div>
            <button className="text-gray-400 hover:text-white relative transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-red border-2 border-neon-bg rounded-full"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-neon-cyan to-blue-600 flex items-center justify-center font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)] cursor-pointer hover:scale-105 transition-transform">
              H
            </div>
          </div>
        </header>

        {/* --- DẢI BĂNG GIÁ ĐẶT NGAY DƯỚI HEADER --- */}
        <div className="shrink-0 border-b border-gray-800">
          <MarketTicker />
        </div>

        {/* Khung chứa các trang con cuộn được (Dashboard, Portfolio...) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <Outlet />
        </div>

      </main>
    </div>
  );
};