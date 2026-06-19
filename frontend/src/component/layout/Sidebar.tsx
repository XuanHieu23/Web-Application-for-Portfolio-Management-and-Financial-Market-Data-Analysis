import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PieChart, Newspaper, Settings, Zap, LineChart } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/home' },
  { name: 'Portfolio', icon: PieChart, href: '/portfolio' },
  { name: 'Transaction History', icon: Newspaper, href: '/history' },
  { name: 'Markets', icon: LineChart, href: '/markets' },
];

export const Sidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/home') return location.pathname === '/home';
    return location.pathname.startsWith(href);
  };

  const isSettingsActive = location.pathname === '/settings';

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        h-screen border-r border-gray-800 bg-neon-panel backdrop-blur-md flex flex-col z-50
        transition-[width] duration-300 ease-in-out shrink-0
        ${isHovered ? 'w-64 shadow-[10px_0_30px_-10px_rgba(0,240,255,0.15)]' : 'w-20'}
      `}
    >
            <div className={`
        h-16 flex items-center border-b border-gray-800 transition-all duration-300
        ${isHovered ? 'px-6 justify-start' : 'px-0 justify-center'}
      `}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-cyan to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] shrink-0">
            <Zap size={24} className="text-white" fill="white" />
          </div>
          <span className={`
            text-white font-bold text-xl tracking-wider whitespace-nowrap overflow-hidden transition-all duration-300
            ${isHovered ? 'w-auto opacity-100' : 'w-0 opacity-0'}
          `}>
            POMAFINA
          </span>
        </div>
      </div>

            <nav className="flex-1 py-6 flex flex-col gap-3 px-3 overflow-x-hidden">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`
                group flex items-center p-3 rounded-xl transition-all duration-300
                ${isHovered ? 'justify-start space-x-4' : 'justify-center'}
                ${active
                  ? 'bg-cyan-950/40 border border-neon-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                  : 'border border-transparent hover:bg-gray-800/50 hover:border-gray-700'
                }
              `}
              title={!isHovered ? item.name : ''}
            >
              <div className="relative shrink-0">
                <item.icon
                  size={22}
                  className={`transition-colors duration-300 ${active ? 'text-neon-cyan' : 'text-gray-400 group-hover:text-gray-200'}`}
                />
              </div>
              <div className={`
                whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
                ${isHovered ? 'w-40 opacity-100' : 'w-0 opacity-0'}
              `}>
                <span className={`font-medium ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

            <div className="p-3 border-t border-gray-800 mt-auto">
        <Link
          to="/settings"
          title={!isHovered ? 'Settings' : ''}
          className={`
            group w-full flex items-center p-3 rounded-xl transition-all duration-300
            ${isHovered ? 'justify-start space-x-4' : 'justify-center'}
            ${isSettingsActive
              ? 'bg-cyan-950/40 border border-neon-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
              : 'border border-transparent hover:bg-gray-800/50 hover:border-gray-700'
            }
          `}
        >
          <Settings
            size={22}
            className={`shrink-0 transition-colors duration-300 ${isSettingsActive ? 'text-neon-cyan' : 'text-gray-400 group-hover:text-gray-200'}`}
          />
          <div className={`
            whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
            ${isHovered ? 'w-40 opacity-100' : 'w-0 opacity-0'}
          `}>
            <span className={`font-medium ${isSettingsActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
              Settings
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
};
