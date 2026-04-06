import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart2, Cpu } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans overflow-x-hidden selection:bg-neon-cyan selection:text-black">
      
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-cyan to-blue-600 flex items-center justify-center font-bold text-black">
            K
          </div>
          <span className="text-xl font-bold tracking-wider">KINETIC<span className="text-neon-cyan">.OBSIDIAN</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#markets" className="hover:text-white transition-colors">Markets</a>
          <a href="#pro" className="hover:text-neon-cyan transition-colors">Pro Oracle</a>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 rounded-lg font-bold text-sm bg-gray-900 border border-gray-700 hover:border-neon-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
        >
          Access Terminal
        </button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-neon-cyan/30 text-neon-cyan text-xs font-bold mb-8">
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></span>
          System v2.0 is Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Master Your Wealth <br/> 
          With <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-blue-500">AI Precision</span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          The ultimate Web3 terminal for portfolio management. Track assets, analyze market data, and get personalized insights from the Kinetic AI Oracle.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 rounded-lg font-bold text-black bg-neon-cyan hover:bg-[#00d0e0] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all"
          >
            Start Tracking Free
          </button>
          <button className="px-8 py-4 rounded-lg font-bold text-white bg-transparent border border-gray-700 hover:bg-gray-900 transition-all">
            View Live Markets
          </button>
        </div>

        {/* Fake 3D Mockup Container (Giả lập màn hình UI bay lơ lửng) */}
        <div className="mt-20 relative mx-auto max-w-5xl perspective-1000">
          <div className="w-full h-[400px] md:h-[600px] bg-neon-panel border border-gray-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B0E14] z-10 pointer-events-none"></div>
             {/* Bạn có thể chèn 1 ảnh chụp màn hình Dashboard thật vào đây sau */}
             <div className="flex items-center justify-center h-full text-gray-600 border-dashed border-2 border-gray-800 m-8 rounded-xl">
                [ 3D App Mockup Image Placeholder ]
             </div>
          </div>
        </div>
      </main>

      {/* Feature Cards */}
      <section id="features" className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl backdrop-blur-sm hover:border-gray-600 transition-colors">
          <BarChart2 className="text-neon-cyan mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
          <p className="text-gray-400 text-sm">Lightning-fast market data and interactive candlestick charts powered by WebSockets.</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl backdrop-blur-sm hover:border-gray-600 transition-colors">
          <Activity className="text-blue-500 mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">Portfolio Sync</h3>
          <p className="text-gray-400 text-sm">Log your trades securely and track your total net worth and Profit/Loss across all your assets.</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Cpu className="text-neon-cyan mb-4 relative z-10" size={32} />
          <h3 className="text-xl font-bold mb-2 relative z-10">AI Oracle <span className="text-[10px] bg-neon-cyan text-black px-2 py-0.5 rounded ml-2 align-middle">PRO</span></h3>
          <p className="text-gray-400 text-sm relative z-10">Dual-AI system analyzing macro sentiment and your specific portfolio for actionable advice.</p>
        </div>
      </section>

    </div>
  );
};