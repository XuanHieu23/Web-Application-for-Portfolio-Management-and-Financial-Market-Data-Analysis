import React from 'react';
import { CandlestickChart } from '../component/ui/CandlestickChart';
import { TrendingUp, Activity, BarChart3, ShieldAlert } from 'lucide-react';

export const Dashboard: React.FC = () => {
  // Dữ liệu giả lập cho 4 thẻ (mock data)
  const marketStats = [
    { title: 'Total Market Cap', value: '$2.51T', change: '+2.7%', isUp: true, icon: BarChart3 },
    { title: '24h Volume', value: '$127.4B', change: '+15.8%', isUp: true, icon: Activity },
    { title: 'BTC Dominance', value: '52.4%', change: '+0.0%', isUp: true, icon: TrendingUp },
    { title: 'Fear & Greed', value: '68 (Greed)', change: '~+3.1%', isUp: true, icon: ShieldAlert },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 4 Thẻ Chỉ số */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-neon-panel backdrop-blur-md border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <Icon className="text-neon-cyan" size={20} />
                <span className={`text-sm font-medium ${stat.isUp ? 'text-neon-green' : 'text-neon-red'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-white text-2xl font-bold tracking-wide">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Biểu đồ trung tâm */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CandlestickChart />
        </div>
        <div className="bg-neon-panel backdrop-blur-md border border-gray-800 rounded-xl p-5">
           <h3 className="text-white font-semibold mb-4">Live Order Book (Sắp ra mắt)</h3>
           <div className="flex items-center justify-center h-64 text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg">
             Đang chờ kết nối WebSocket...
           </div>
        </div>
      </div>
    </div>
  );
};