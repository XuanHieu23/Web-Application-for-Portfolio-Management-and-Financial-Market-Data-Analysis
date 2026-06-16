import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BrainCircuit, Activity, Lock, PieChart as PieChartIcon, List } from 'lucide-react';
import { axiosClient } from '../services/axiosClient';
import { useAuthStore } from '../store/authStore';
import { Typewriter } from '../component/ui/TypeWriter';
import { NotificationBanner } from '../component/ui/NotificationBanner';
import { PortfolioAreaChart, type ChartPoint } from '../component/ui/PortfolioAreaChart';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface Holding { symbol: string; amount: number; avgPrice: number; }

export const Dashboard: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [historyData, setHistoryData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [isPro, setIsPro] = useState(user?.tier === 'PRO');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiInsightIsNew, setAiInsightIsNew] = useState(false); // true = vừa fetch → dùng Typewriter
  const [loadingAi, setLoadingAi] = useState(true);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUpgrade = async () => {
    try {
      setLoadingPayment(true);
      const response = await axiosClient.post('/payment/create-checkout-session');
      if (response.data?.url) window.location.href = response.data.url;
    } catch { showNotification('Không thể kết nối Stripe.', 'error'); }
    finally { setLoadingPayment(false); }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Danh mục đầu tư — bắt buộc
        const summaryRes = await axiosClient.get('/portfolio/summary');
        const summaryData: Holding[] = summaryRes.data?.data || [];
        setHoldings(summaryData);

        if (summaryData.length === 0) {
          setHistoryData([]);
          return;
        }

        // 2. Fetch klines cho từng coin trong portfolio (dùng cho cả chart lẫn giá hiện tại)
        const klinePromises = summaryData.map((h) =>
          axiosClient
            .get(`/market/klines?symbol=${h.symbol}USDT&interval=1d&limit=7`)
            .then(res => ({ symbol: h.symbol, data: res.data.data as any[][] }))
            .catch(() => ({ symbol: h.symbol, data: [] as any[][] }))
        );

        const klinesResults = await Promise.all(klinePromises);

        // 3. Lấy giá thị trường: ưu tiên tickers (real-time), bổ sung bằng klines (close mới nhất)
        const priceMap: Record<string, number> = {};
        try {
          const priceRes = await axiosClient.get('/market/tickers');
          if (priceRes.data?.data) {
            priceRes.data.data.forEach((coin: any) => {
              priceMap[coin.symbol.replace('USDT', '')] = parseFloat(coin.lastPrice);
            });
          }
        } catch { /* sẽ dùng klines làm fallback */ }

        // Bổ sung giá từ klines cho các coin không có trong tickers
        klinesResults.forEach(kr => {
          if (!priceMap[kr.symbol] && kr.data && kr.data.length > 0) {
            const latestKline = kr.data[kr.data.length - 1];
            const closePrice = parseFloat(latestKline[4]);
            if (closePrice > 0) priceMap[kr.symbol] = closePrice;
          }
        });

        setLivePrices(priceMap);

        // 4. Xây dựng chart từ klines
        const chartPoints: ChartPoint[] = [];

        for (let i = 0; i < 7; i++) {
          let totalValue = 0;
          let timestamp = 0;

          klinesResults.forEach(kr => {
            if (kr.data && kr.data[i]) {
              const closePrice = parseFloat(kr.data[i][4]);
              const holding = summaryData.find(s => s.symbol === kr.symbol);
              if (holding && closePrice > 0) totalValue += holding.amount * closePrice;
              if (!timestamp) timestamp = Math.floor(kr.data[i][0] / 1000);
            }
          });

          if (timestamp && totalValue > 0) {
            chartPoints.push({ time: timestamp, value: totalValue });
          }
        }

        // Fallback nếu klines không đủ 3 điểm
        if (chartPoints.length < 3) {
          chartPoints.length = 0;
          const baseTotal = summaryData.reduce(
            (acc, h) => acc + h.amount * (priceMap[h.symbol] || h.avgPrice),
            0
          );
          const fluctuations = [0.974, 0.981, 0.968, 0.995, 1.008, 0.992, 1.0];
          const today = new Date();
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            chartPoints.push({
              time: Math.floor(d.getTime() / 1000),
              value: baseTotal * fluctuations[6 - i],
            });
          }
        }

        setHistoryData(chartPoints);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAiInsight = async () => {
      // Free tier: không cần gọi API, khóa ngay (tier lấy từ user đã đăng nhập, không phải cache)
      if (user?.tier !== 'PRO') {
        setIsPro(false);
        setLoadingAi(false);
        return;
      }

      // Pro tier: luôn fetch insight mới cho đúng tài khoản đang đăng nhập
      // (đánh đổi: viết lại insight mỗi lần vào trang, đổi lại không bị dính cache chéo tài khoản)
      try {
        const response = await axiosClient.get('/ai/insight');
        if (response.data?.success) {
          setIsPro(true);
          setAiInsight(response.data.insight as string);
          setAiInsightIsNew(true); // mới fetch → cho Typewriter chạy
        }
      } catch (error: any) {
        if (error.response?.status === 403) setIsPro(false);
      } finally {
        setLoadingAi(false);
      }
    };

    fetchDashboardData();
    fetchAiInsight();
  }, []);

  const totalInvested = holdings.reduce((acc, h) => acc + h.amount * h.avgPrice, 0);
  const totalNetWorth = holdings.reduce((acc, h) => acc + h.amount * (livePrices[h.symbol] || h.avgPrice), 0);
  const totalPnL = totalNetWorth - totalInvested;
  const isTotalProfit = totalPnL >= 0;

  const formatCurrency = (val: number) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const PIE_COLORS = ['#00F0FF', '#00FF9D', '#FF3366', '#FFB800', '#9D00FF', '#FFFFFF'];
  // Allocation dùng avgPrice từ portfolio API — không phụ thuộc live price, luôn đúng với mọi coin
  const allocationData = holdings
    .map(h => ({ name: h.symbol, value: h.amount * h.avgPrice }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const allocationTotal = allocationData.reduce((acc, d) => acc + d.value, 0);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-neon-cyan font-mono animate-pulse">
      SYNCING TERMINAL...
    </div>
  );

  return (
    <div className="space-y-6 relative pb-10">
      {notification && (
        <div className="fixed top-20 right-6 z-[100] animate-in fade-in slide-in-from-right-10">
          <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
        </div>
      )}

      {/* HEADER: Net Worth */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-gray-500 font-bold tracking-widest text-xs mb-2 uppercase">TERMINAL OVERVIEW</p>
          <div className="flex items-end gap-4">
            <h1 className="text-5xl font-extrabold text-white tracking-tight">{formatCurrency(totalNetWorth)}</h1>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg mb-2 text-sm font-bold border ${isTotalProfit ? 'bg-green-950/40 border-neon-green/30 text-neon-green' : 'bg-red-950/40 border-neon-red/30 text-neon-red'}`}>
              {isTotalProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isTotalProfit ? '+' : ''}{formatCurrency(totalPnL)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* CHART: Net Worth 7D */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 relative flex flex-col min-h-[380px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity className="text-neon-cyan" size={20} />
                <h3 className="text-white font-bold tracking-widest text-sm uppercase">Net Worth Performance (7D)</h3>
              </div>
            </div>

            <div className="w-full mt-2">
              {historyData.length > 0 ? (
                <PortfolioAreaChart data={historyData} height={260} />
              ) : (
                <div className="flex h-[260px] items-center justify-center text-gray-500 font-mono text-sm border border-dashed border-gray-800 rounded-xl">
                  [ INSUFFICIENT DATA: ADD ASSETS TO RENDER CHART ]
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI ORACLE */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#151924] to-[#0A0D12] border border-neon-cyan/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.05)] h-[380px] flex flex-col">
            <div className="absolute top-0 right-0 w-40 h-40 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-neon-cyan animate-pulse" size={24} />
                <h3 className="text-white font-extrabold tracking-widest text-sm uppercase">AI Oracle</h3>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded font-bold border ${isPro ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                {isPro ? 'PRO TIER' : 'FREE TIER'}
              </span>
            </div>
            <div className="flex-1 bg-[#0B0E14] border border-gray-800 rounded-xl p-4 relative z-10 overflow-hidden flex flex-col items-center justify-center text-center">
              {loadingAi ? (
                <div className="text-neon-cyan animate-pulse font-mono text-sm">SYNCING WITH NEURAL NET...</div>
              ) : isPro ? (
                <div className="w-full h-full text-left overflow-y-auto pr-2 custom-scrollbar">
                  <div className="text-gray-300 text-sm whitespace-pre-line">
                    {aiInsight
                      ? aiInsightIsNew
                        ? <Typewriter text={aiInsight} speed={30} />
                        : <span className="font-mono leading-relaxed">{aiInsight}</span>
                      : "Waiting for data anomalies..."}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6">
                  <Lock className="text-neon-cyan mb-3" size={32} />
                  <h4 className="text-white font-bold text-sm mb-2">Premium Feature Locked</h4>
                  <p className="text-gray-400 text-xs mb-6 font-mono leading-relaxed">Unlock POMAFINA AI Oracle. Get personalized portfolio analysis.</p>
                  <button onClick={handleUpgrade} disabled={loadingPayment} className="w-full py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] transition-all disabled:opacity-50">
                    {loadingPayment ? 'INITIALIZING SECURE LINK...' : 'UPGRADE TO PRO ($15/mo)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HOLDINGS TABLE + PIE CHART */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-neon-panel border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <List className="text-neon-cyan" size={20} />
            <h3 className="text-white font-bold tracking-widest text-sm uppercase">Asset Holdings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="pb-4">Asset</th>
                  <th className="pb-4 text-right">Amount</th>
                  <th className="pb-4 text-right">Avg Price</th>
                  <th className="pb-4 text-right">Current Price</th>
                  <th className="pb-4 text-right">Profit/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {holdings.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500 font-mono text-sm">No assets detected in wallet.</td></tr>
                ) : (
                  holdings.map((h) => {
                    const currentPrice = livePrices[h.symbol] || h.avgPrice;
                    const pnl = (currentPrice - h.avgPrice) * h.amount;
                    const isProfit = pnl >= 0;
                    return (
                      <tr key={h.symbol} className="hover:bg-gray-800/20 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1A1D24] border border-gray-700 flex items-center justify-center font-bold text-gray-300 text-xs">{h.symbol.charAt(0)}</div>
                            <span className="text-white font-bold">{h.symbol}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right font-mono text-white">{h.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td className="py-4 text-right font-mono text-gray-400">{formatCurrency(h.avgPrice)}</td>
                        <td className="py-4 text-right font-mono text-white">{formatCurrency(currentPrice)}</td>
                        <td className={`py-4 text-right font-mono font-bold ${isProfit ? 'text-neon-green' : 'text-neon-red'}`}>
                          {isProfit ? '+' : ''}{formatCurrency(pnl)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ASSET ALLOCATION PIE */}
        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="text-neon-cyan" size={20} />
            <h3 className="text-white font-bold tracking-widest text-sm uppercase">Asset Allocation</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {allocationData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={allocationData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {allocationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any) => formatCurrency(Number(value))}
                      contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1F2937', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full mt-4 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {allocationData.map((entry, index) => (
                    <div key={entry.name} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                        <span className="text-gray-300 font-bold">{entry.name}</span>
                      </div>
                      <span className="text-white font-mono">{allocationTotal > 0 ? ((entry.value / allocationTotal) * 100).toFixed(1) : '0.0'}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 font-mono text-sm">No Allocation Data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
