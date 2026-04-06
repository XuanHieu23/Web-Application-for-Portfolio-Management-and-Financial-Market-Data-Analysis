import React from 'react';
import { Wallet, ShieldAlert, Activity, ArrowUpRight } from 'lucide-react';
// ĐÃ XÓA IMPORT CandlestickChart ĐỂ FIX LỖI

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 uppercase tracking-widest flex items-center gap-2">
          PORTFOLIO <span className="text-neon-cyan">ANALYTICS</span>
        </h1>
        <p className="text-gray-400 text-sm">Real-time surveillance of your liquidity nodes and collateral health.</p>
      </div>

      {/* Grid Top Stats (4 Thẻ thông số) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Total Net Worth */}
        <div className="bg-neon-panel border border-gray-800 p-5 rounded-2xl relative overflow-hidden group hover:border-neon-cyan/50 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/5 rounded-full blur-2xl group-hover:bg-neon-cyan/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">TOTAL_NET_WORTH.SYS</span>
            <Wallet size={16} className="text-neon-cyan" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">$1,482,904.22</h2>
            <div className="inline-flex items-center gap-1 text-neon-green text-xs font-mono font-bold">
              <ArrowUpRight size={14} /> +12.4% VS LAST 24H
            </div>
          </div>
        </div>

        {/* Thẻ 2: Active Positions */}
        <div className="bg-neon-panel border border-gray-800 p-5 rounded-2xl hover:border-gray-700 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">ACTIVE POSITIONS</span>
            <Activity size={16} className="text-neon-green" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">14</h2>
          <div className="flex gap-3 text-xs font-mono font-bold">
            <span className="text-neon-green">8 LONG</span>
            <span className="text-neon-red">6 SHORT</span>
          </div>
        </div>

        {/* Thẻ 3: Risk Score */}
        <div className="bg-neon-panel border border-neon-red/30 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neon-red/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">RISK SCORE</span>
            <ShieldAlert size={16} className="text-neon-red animate-pulse" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">78/100</h2>
            <div className="text-neon-red text-xs font-mono font-bold uppercase tracking-wider">
              HIGH RISK DETECTED
            </div>
          </div>
        </div>

        {/* Thẻ 4: Margin Ratio */}
        <div className="bg-neon-panel border border-gray-800 p-5 rounded-2xl hover:border-gray-700 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">MARGIN RATIO</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">2.4x</h2>
          <div className="text-gray-400 text-xs font-mono">
            Collateral: $620k
          </div>
        </div>
      </div>

      {/* Grid Content: Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation Placeholder (Sẽ vẽ bằng Recharts ở Tuần 5) */}
        <div className="lg:col-span-1 bg-neon-panel border border-gray-800 rounded-2xl p-6 min-h-[400px] flex flex-col">
          <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-6">ASSET_ALLOCATION</h3>
          <div className="flex-1 border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center text-gray-500 font-mono text-sm">
            [ Donut Chart Area ]
          </div>
        </div>

        {/* Active Registry Table Placeholder */}
        <div className="lg:col-span-2 bg-neon-panel border border-gray-800 rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold tracking-widest uppercase text-sm">ACTIVE_REGISTRY</h3>
            <button className="px-3 py-1 bg-gray-900 border border-gray-700 text-gray-400 text-xs font-bold rounded hover:text-white transition-colors">FILTER</button>
          </div>
          <div className="flex-1 border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center text-gray-500 font-mono text-sm">
            [ Portfolio Holdings Table ]
          </div>
        </div>
      </div>

    </div>
  );
};