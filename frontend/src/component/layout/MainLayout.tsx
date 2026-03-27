import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, PieChart, Newspaper, Settings, Bell, Search } from 'lucide-react';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-neon-bg text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-gray-800 bg-neon-panel backdrop-blur-md flex flex-col transition-all">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800">
          <span className="text-neon-cyan font-bold text-xl tracking-wider hidden lg:block">NEON EX</span>
          <span className="text-neon-cyan font-bold text-xl lg:hidden">NX</span>
        </div>
        <nav className="flex-1 py-6 flex flex-col gap-4 px-4">
          <Link to="/" className="flex items-center gap-4 px-2 py-3 text-neon-cyan bg-cyan-950/30 rounded-lg border border-neon-cyan/30">
            <LayoutDashboard size={20} />
            <span className="hidden lg:block font-medium">Dashboard</span>
          </Link>
          <Link to="/portfolio" className="flex items-center gap-4 px-2 py-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
            <PieChart size={20} />
            <span className="hidden lg:block font-medium">Portfolio</span>
          </Link>
          <Link to="/news" className="flex items-center gap-4 px-2 py-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
            <Newspaper size={20} />
            <span className="hidden lg:block font-medium">AI Insights</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button className="flex items-center gap-4 px-2 py-3 text-gray-400 hover:text-white w-full rounded-lg transition-colors">
            <Settings size={20} />
            <span className="hidden lg:block font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-neon-panel backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="relative w-64 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search Bitcoin, Ethereum..." 
              className="w-full bg-gray-900/50 border border-gray-700 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-neon-cyan transition-colors"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-neon-green text-sm px-3 py-1 bg-green-950/30 rounded-full border border-neon-green/30">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
              Live
            </div>
            <button className="text-gray-400 hover:text-white relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-neon-red rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon-cyan to-blue-600 flex items-center justify-center font-bold text-sm">
              H
            </div>
          </div>
        </header>

        {/* Nội dung trang sẽ được render vào đây */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};