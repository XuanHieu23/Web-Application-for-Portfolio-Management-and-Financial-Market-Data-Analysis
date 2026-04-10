import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BrainCircuit, Activity, Lock } from 'lucide-react';
import { axiosClient } from '../services/axiosClient';

interface Holding {
  symbol: string;
  amount: number;
  avgPrice: number;
}

export const Dashboard: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoadingPayment(true);
      // Gọi API đến Backend để xin link thanh toán Stripe
      const response = await axiosClient.post('/payment/create-checkout-session');
      
      if (response.data && response.data.url) {
        // Phóng trình duyệt của user sang trang quẹt thẻ của Stripe
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Lỗi khởi tạo thanh toán:', error);
      alert('Không thể kết nối đến Stripe. Hãy kiểm tra lại Backend và Terminal.');
    } finally {
      setLoadingPayment(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const summaryRes = await axiosClient.get('/portfolio/summary');
        const summaryData = summaryRes.data.data || summaryRes.data;
        if (Array.isArray(summaryData)) setHoldings(summaryData);

        const priceRes = await fetch('http://localhost:5000/api/market/tickers');
        const priceData = await priceRes.json();
        const priceMap: Record<string, number> = {};
        if (priceData && priceData.data) {
          priceData.data.forEach((coin: any) => {
            priceMap[coin.symbol.replace('USDT', '')] = parseFloat(coin.lastPrice);
          });
          setLivePrices(priceMap);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalInvested = holdings.reduce((acc, h) => acc + (h.amount * h.avgPrice), 0);
  const totalNetWorth = holdings.reduce((acc, h) => acc + (h.amount * (livePrices[h.symbol] || h.avgPrice)), 0);
  const totalPnL = totalNetWorth - totalInvested;
  const isTotalProfit = totalPnL >= 0;
  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex items-center justify-center h-full text-neon-cyan font-mono animate-pulse">SYNCING TERMINAL...</div>;

  return (
    <div className="space-y-6">
      {/* MACRO SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-gray-500 font-bold tracking-widest text-xs mb-2 uppercase">TERMINAL OVERVIEW</p>
          <div className="flex items-end gap-4">
            <h1 className="text-5xl font-extrabold text-white tracking-tight">${formatCurrency(totalNetWorth)}</h1>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg mb-2 text-sm font-bold border ${isTotalProfit ? 'bg-green-950/40 border-neon-green/30 text-neon-green' : 'bg-red-950/40 border-neon-red/30 text-neon-red'}`}>
              {isTotalProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isTotalProfit ? '+' : ''}{formatCurrency(totalPnL)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN: PERFORMANCE CHART */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 h-[400px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Activity className="text-neon-cyan" size={20} />
                <h3 className="text-white font-bold tracking-widest text-sm uppercase">Net Worth Performance</h3>
              </div>
              <div className="flex gap-2">
                {['1W', '1M', '3M', '1Y'].map(time => (
                  <button key={time} className="px-3 py-1 bg-gray-900 border border-gray-700 text-gray-400 text-xs font-bold rounded hover:text-white transition-colors">{time}</button>
                ))}
              </div>
            </div>
            {/* SVG Line Chart Placeholder - Chuẩn bị cho Tuần 6 Charting */}
            <div className="flex-1 border border-gray-800/50 rounded-xl flex flex-col items-center justify-center bg-gradient-to-t from-neon-cyan/5 to-transparent relative">
              <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,100 L0,50 Q25,80 50,40 T100,20 L100,100 Z" fill="url(#grad)" />
                <path d="M0,50 Q25,80 50,40 T100,20" fill="none" stroke="#00F0FF" strokeWidth="1" />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#00F0FF" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-neon-cyan/70 font-mono text-sm z-10">[ POMAFINA LINE CHART RENDERING AREA ]</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: POMAFINA AI ORACLE */}
        {/* RIGHT COLUMN: POMAFINA AI ORACLE (PAYWALL) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#151924] to-[#0A0D12] border border-neon-cyan/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.05)] h-[400px] flex flex-col">
            <div className="absolute top-0 right-0 w-40 h-40 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-neon-cyan animate-pulse" size={24} />
                <h3 className="text-white font-extrabold tracking-widest text-sm uppercase">AI Oracle</h3>
              </div>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded font-bold border border-gray-700">FREE TIER</span>
            </div>

            {/* VÙNG BỊ LÀM MỜ VÌ CHƯA TRẢ TIỀN */}
            <div className="flex-1 bg-[#0B0E14] border border-gray-800 rounded-xl p-4 relative z-10 overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6">
                <Lock className="text-neon-cyan mb-3" size={32} />
                <h4 className="text-white font-bold text-sm mb-2">Premium Feature Locked</h4>
                <p className="text-gray-400 text-xs mb-6 font-mono leading-relaxed">
                  Unlock POMAFINA AI Oracle. Get personalized portfolio analysis powered by Groq and FinBERT market sentiment.
                </p>
                
                {/* NÚT GỌI API THANH TOÁN */}
                <button 
                  onClick={handleUpgrade}
                  disabled={loadingPayment}
                  className="w-full py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingPayment ? 'INITIALIZING SECURE LINK...' : 'UPGRADE TO PRO ($15/mo)'}
                </button>
              </div>

              {/* Dữ liệu giả lập mờ mờ ở dưới */}
              <div className="opacity-30 space-y-4 w-full text-left">
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                <div className="h-4 bg-gray-800 rounded w-full"></div>
                <div className="h-4 bg-gray-800 rounded w-5/6"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};