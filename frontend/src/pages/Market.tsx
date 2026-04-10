import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Zap, TrendingUp, Shield, Rocket } from 'lucide-react';
import { io } from 'socket.io-client';
import { CandlestickChart } from '../component/ui/CandlestickChart'; 

interface CoinData {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
}

// Hàm khởi tạo data ảo cho biểu đồ khi mới load
const initializeSparkline = (currentPrice: number) => {
  return Array.from({ length: 15 }).fill(currentPrice) as number[];
};

// COMPONENT SVG SIÊU TỐC ĐỘ 
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; 
  const width = 120;
  const height = 40;
  const padding = 4;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible drop-shadow-md">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const Markets: React.FC = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  
  const [sparklineHistory, setSparklineHistory] = useState<Record<string, number[]>>({});
  const coinsRef = useRef<CoinData[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    // 1. KÉO DỮ LIỆU TỪ BACKEND
    fetch('http://localhost:5000/api/market/tickers')
      .then(async (res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((resData) => {
        if (!isMounted) return;
        setCoins(resData.data);
        coinsRef.current = resData.data;

        const initHistory: Record<string, number[]> = {};
        resData.data.forEach((c: CoinData) => {
          initHistory[c.symbol] = initializeSparkline(parseFloat(c.lastPrice));
        });
        setSparklineHistory(initHistory);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi khởi tạo Market:', err);
        if (isMounted) setLoading(false);
      });

    // 2. KẾT NỐI WEBSOCKET
    const socket = io('http://localhost:5000'); 

    socket.on('MARKET_LIVE_DATA', (liveData: any[]) => {
      if (coinsRef.current.length === 0) return; 

      setCoins((prevCoins) => {
        const newCoins = [...prevCoins];
        let hasChanges = false;

        setSparklineHistory((prevHistory) => {
          const newHistory = { ...prevHistory };

          liveData.forEach((liveCoin) => {
            const coinIndex = newCoins.findIndex(c => c.symbol === liveCoin.symbol);
            if (coinIndex !== -1) {
              const livePriceNum = parseFloat(liveCoin.price);
              
              if (newCoins[coinIndex].lastPrice !== liveCoin.price) {
                newCoins[coinIndex].lastPrice = liveCoin.price;
                hasChanges = true;
              }

              if (newHistory[liveCoin.symbol]) {
                newHistory[liveCoin.symbol].push(livePriceNum);
                if (newHistory[liveCoin.symbol].length > 15) {
                  newHistory[liveCoin.symbol].shift(); 
                }
              }
            }
          });
          return newHistory;
        });

        return hasChanges ? newCoins : prevCoins;
      });
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    return num < 1 ? num.toFixed(4) : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (val: string) => {
    const num = parseFloat(val);
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toLocaleString();
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 relative">
      
      {/* POPUP BIỂU ĐỒ NẾN */}
      {selectedSymbol && (
        <CandlestickChart symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />
      )}

      {/* ==========================================
          CỘT TRÁI: BẢNG DỮ LIỆU & TÍN HIỆU
          ========================================== */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Market Screener</h1>
            <p className="text-gray-400 text-sm">Real-time intelligence across 2,400+ digital assets.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border border-neon-cyan/50 text-neon-cyan rounded-lg text-sm font-medium hover:bg-cyan-900/40 transition-colors">
              <TrendingUp size={16} /> Top Gainers
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:border-gray-500 transition-colors">
              <Shield size={16} /> DeFi
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:border-gray-500 transition-colors">
              <Rocket size={16} /> L1 Assets
            </button>
          </div>
        </div>

        {/* Bảng giá */}
        <div className="bg-neon-panel border border-gray-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-5">Asset</th>
                <th className="p-5 text-right">Price</th>
                <th className="p-5 text-right">24h Change</th>
                <th className="p-5 text-right hidden sm:table-cell">Volume (24h)</th>
                <th className="p-5 text-center">Trend (Real-time)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-neon-cyan animate-pulse font-mono">Connecting to global nodes...</td>
                </tr>
              ) : (
                coins.map((coin) => {
                  const change = parseFloat(coin.priceChangePercent);
                  const isPositive = change >= 0;
                  const coinName = coin.symbol.replace('USDT', '');
                  
                  const historyData = sparklineHistory[coin.symbol] || initializeSparkline(parseFloat(coin.lastPrice));
                  const strokeColor = isPositive ? '#00FF9D' : '#FF3366';

                  return (
                    <tr 
                      key={coin.symbol} 
                      onClick={() => setSelectedSymbol(coin.symbol)}
                      className="hover:bg-gray-800/40 transition-colors group cursor-pointer"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#1A1D24] flex items-center justify-center font-bold text-gray-300 border border-gray-700 group-hover:border-neon-cyan/50 transition-colors shadow-inner">
                            {coinName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm tracking-wide group-hover:text-neon-cyan transition-colors">{coinName}</p>
                            <p className="text-gray-500 text-xs font-mono">{coinName}/USDT</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-right font-mono text-white font-medium">
                        ${formatCurrency(coin.lastPrice)}
                      </td>
                      <td className="p-5 text-right">
                        <div className={`inline-flex items-center justify-end gap-1 font-mono text-sm font-medium ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
                          {isPositive ? '+' : ''}{Math.abs(change).toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-5 text-right font-mono text-gray-400 hidden sm:table-cell">
                        ${formatVolume(coin.quoteVolume)}
                      </td>
                      <td className="p-5 flex justify-center items-center">
                        <Sparkline data={historyData} color={strokeColor} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Các thẻ tín hiệu thị trường (Trend Signal, Liquidations, Gas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-neon-panel border border-gray-800 p-5 rounded-2xl flex flex-col justify-between hover:border-gray-700 transition-colors">
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg"><Rocket size={20}/></div>
               <span className="text-[10px] font-bold px-2 py-1 bg-green-950/50 text-neon-green rounded border border-neon-green/20">BULLISH</span>
             </div>
             <div>
               <h4 className="text-white font-bold text-sm mb-1">Trend Signal</h4>
               <p className="text-gray-400 text-xs leading-relaxed">Momentum is building in Layer 2 solutions. Average 24h volume up 14.2%.</p>
             </div>
          </div>
          <div className="bg-neon-panel border border-gray-800 p-5 rounded-2xl flex flex-col justify-between hover:border-gray-700 transition-colors">
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-red-900/30 text-neon-red rounded-lg"><AlertTriangle size={20}/></div>
               <span className="text-[10px] font-bold px-2 py-1 bg-red-950/50 text-neon-red rounded border border-neon-red/20">HIGH RISK</span>
             </div>
             <div>
               <h4 className="text-white font-bold text-sm mb-1">Liquidations</h4>
               <p className="text-gray-400 text-xs leading-relaxed">$142M in shorts liquidated in the last 4 hours. Volatility expected.</p>
             </div>
          </div>
          <div className="bg-neon-panel border border-gray-800 p-5 rounded-2xl flex flex-col justify-between hover:border-gray-700 transition-colors">
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-cyan-900/30 text-neon-cyan rounded-lg"><Zap size={20}/></div>
               <span className="text-[10px] font-bold px-2 py-1 bg-gray-800 text-gray-300 rounded border border-gray-700">STABLE</span>
             </div>
             <div>
               <h4 className="text-white font-bold text-sm mb-1">Gas Tracker</h4>
               <p className="text-gray-400 text-xs leading-relaxed">Ethereum network gas is currently 24 Gwei. Optimized for swaps.</p>
             </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          CỘT PHẢI: MARKET OVERVIEW (SIDEBAR)
          ========================================== */}
      <div className="w-full xl:w-80 space-y-6 shrink-0">
        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6">
          <h3 className="text-neon-cyan font-bold text-sm tracking-widest uppercase mb-6">Market Overview</h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">Global Cap</p>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-bold text-white tracking-tight">$2.48T</p>
                <p className="text-neon-green text-sm font-mono">+1.2%</p>
              </div>
            </div>
            
            <div className="w-full h-[1px] bg-gray-800"></div>

            <div>
              <p className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">BTC Dominance</p>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-bold text-white tracking-tight">52.4%</p>
                <p className="text-neon-red text-sm font-mono">-0.4%</p>
              </div>
            </div>

            <div className="w-full h-[1px] bg-gray-800"></div>

            <div className="pt-2">
               <p className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider text-center">Fear & Greed Index</p>
               <div className="relative w-48 h-24 mx-auto overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[200%] rounded-full border-[12px] border-gray-800 border-t-neon-green border-r-neon-green rotate-[-45deg]"></div>
                  <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end pb-2">
                    <span className="text-3xl font-bold text-white">74</span>
                    <span className="text-[10px] text-neon-green font-bold tracking-widest">GREED</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#151924] to-[#0A0D12] border border-gray-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-neon-cyan/10 blur-[40px] rounded-full group-hover:bg-neon-cyan/20 transition-all duration-500"></div>
          <h4 className="text-white font-bold text-lg mb-2 relative z-10">POMAFINA <span className="text-neon-cyan">PRO</span></h4>
          <p className="text-gray-400 text-xs leading-relaxed mb-6 relative z-10">
            Unlock institutional-grade order flow analytics and MEV protection.
          </p>
          <button className="w-full py-3 bg-gray-900 border border-gray-700 text-white rounded-lg text-sm font-bold hover:border-neon-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all relative z-10">
            UPGRADE TERMINAL
          </button>
        </div>
      </div>

    </div>
  );
};