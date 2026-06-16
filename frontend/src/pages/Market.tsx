import React, { useEffect, useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { io } from 'socket.io-client';
import { CandlestickChart } from '../component/ui/CandlestickChart'; 
import { axiosClient } from '../services/axiosClient';

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
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sparklineHistory, setSparklineHistory] = useState<Record<string, number[]>>({});
  const coinsRef = useRef<CoinData[]>([]);
  
  // State cho FinBERT AI
  const [sentiment, setSentiment] = useState({
    score: 50,
    status: 'NEUTRAL',
    loading: true
  });

  // State cho CoinGecko Global Data
  const [globalData, setGlobalData] = useState({
    marketCap: 0,
    marketCapChange: 0,
    btcDominance: 0,
    loading: true
  });

  useEffect(() => {
    let isMounted = true;
    
    // 1. KÉO DỮ LIỆU BẢNG GIÁ
    axiosClient.get('/market/tickers')
      .then((res) => {
        if (!isMounted) return;
        const resData = res.data;
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

    // 2. KẾT NỐI WEBSOCKET BINANCE
    const baseUrl = import.meta.env.VITE_SOCKET_URL
      || (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    const socket = io(baseUrl);

    socket.on('MARKET_LIVE_DATA', (liveData: any[]) => {
      if (coinsRef.current.length === 0) return;

      // Cập nhật coins và sparkline trong 2 setState riêng biệt — tránh React anti-pattern
      setCoins((prevCoins) => {
        let hasChanges = false;
        const newCoins = prevCoins.map(coin => {
          const live = liveData.find(l => l.symbol === coin.symbol);
          if (!live) return coin;
          const priceChanged = coin.lastPrice !== live.price;
          const changeChanged = live.priceChangePercent !== undefined && coin.priceChangePercent !== live.priceChangePercent;
          if (!priceChanged && !changeChanged) return coin;
          hasChanges = true;
          return {
            ...coin,
            lastPrice: live.price,
            priceChangePercent: live.priceChangePercent ?? coin.priceChangePercent,
          };
        });
        if (hasChanges) coinsRef.current = newCoins;
        return hasChanges ? newCoins : prevCoins;
      });

      setSparklineHistory((prevHistory) => {
        const newHistory = { ...prevHistory };
        liveData.forEach((liveCoin) => {
          if (newHistory[liveCoin.symbol]) {
            const arr = newHistory[liveCoin.symbol];
            newHistory[liveCoin.symbol] = [...arr.slice(-14), parseFloat(liveCoin.price)];
          }
        });
        return newHistory;
      });
    });

    // 3. KÉO DỮ LIỆU FINBERT AI
    const fetchSentiment = async () => {
      try {
        const res = await axiosClient.get('/ai/sentiment');
        if (res.data && res.data.success && isMounted) {
          setSentiment({
            score: res.data.data.fearAndGreedIndex,
            status: res.data.data.status,
            loading: false
          });
        }
      } catch (error) {
        if (isMounted) setSentiment({ score: 50, status: 'ERROR', loading: false });
      }
    };

    // 4. KÉO DỮ LIỆU VĨ MÔ TỪ BACKEND (Chuẩn kiến trúc Proxy)
    const fetchGlobalData = async () => {
      try {
        const res = await axiosClient.get('/market/global'); // Gọi Backend của mình
        if (res.data && res.data.success && isMounted) {
          setGlobalData({
            marketCap: res.data.data.marketCap,
            marketCapChange: res.data.data.marketCapChange,
            btcDominance: res.data.data.btcDominance,
            loading: false
          });
        }
      } catch (error) {
        console.error('Lỗi lấy dữ liệu Global:', error);
        if (isMounted) setGlobalData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSentiment();
    fetchGlobalData();

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

  // Format cho số nghìn tỷ (Trillions) của Vốn hóa toàn cầu
  const formatMarketCap = (val: number) => {
    if (val === 0) return '---';
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    return `$${val.toLocaleString()}`;
  };

  const filteredCoins = coins.filter(c =>
    c.symbol.replace('USDT', '').toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6 relative">
      
      {/* POPUP BIỂU ĐỒ NẾN */}
      {selectedSymbol && (
        <CandlestickChart symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />
      )}

      {/* ==========================================
          CỘT TRÁI: BẢNG DỮ LIỆU (Đã xóa các thẻ tín hiệu giả)
          ========================================== */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Market Screener</h1>
            <p className="text-gray-400 text-sm">Real-time intelligence across 2,400+ digital assets.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Bitcoin, Ethereum..."
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-neon-cyan transition-colors"
            />
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
              ) : filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 font-mono text-sm">No assets match "{searchQuery}"</td>
                </tr>
              ) : (
                filteredCoins.map((coin) => {
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
                {globalData.loading ? (
                  <p className="text-white font-mono text-sm animate-pulse">Syncing...</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-white tracking-tight">{formatMarketCap(globalData.marketCap)}</p>
                    <p className={`text-sm font-mono ${globalData.marketCapChange >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                      {globalData.marketCapChange >= 0 ? '+' : ''}{globalData.marketCapChange.toFixed(2)}%
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="w-full h-[1px] bg-gray-800"></div>

            <div>
              <p className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">BTC Dominance</p>
              <div className="flex justify-between items-end">
                {globalData.loading ? (
                  <p className="text-white font-mono text-sm animate-pulse">Syncing...</p>
                ) : (
                  <p className="text-2xl font-bold text-white tracking-tight">{globalData.btcDominance.toFixed(1)}%</p>
                )}
              </div>
            </div>

            <div className="w-full h-[1px] bg-gray-800"></div>

            {/* ĐỒNG HỒ TÂM LÝ THỊ TRƯỜNG AI */}
            <div className="pt-2">
               <p className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider text-center">Fear & Greed Index</p>
               
               {sentiment.loading ? (
                 <div className="text-center text-neon-cyan animate-pulse font-mono text-xs">ANALYZING NEWS...</div>
               ) : (
                 <div className="relative w-48 h-24 mx-auto overflow-hidden">
                    <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1F2937" strokeWidth="12" />
                      <path 
                        d="M 10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke={sentiment.score > 55 ? '#00FF9D' : sentiment.score < 45 ? '#FF3366' : '#00F0FF'} 
                        strokeWidth="12" 
                        strokeDasharray="125.6" 
                        strokeDashoffset={125.6 - (125.6 * sentiment.score) / 100} 
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    
                    <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end pb-1">
                      <span className="text-3xl font-bold text-white leading-none mb-1">{sentiment.score}</span>
                      <span className={`text-[10px] font-bold tracking-widest ${
                        sentiment.score > 55 ? 'text-neon-green' : sentiment.score < 45 ? 'text-neon-red' : 'text-neon-cyan'
                      }`}>
                        {sentiment.status}
                      </span>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* POMAFINA PRO CARD */}
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