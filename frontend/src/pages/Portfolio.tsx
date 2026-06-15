import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Plus, Activity } from 'lucide-react';
import { axiosClient } from '../services/axiosClient';
import { NotificationBanner } from '../component/ui/NotificationBanner';
import { io } from 'socket.io-client';
import { PortfolioAreaChart, type ChartPoint } from '../component/ui/PortfolioAreaChart';

interface Holding { symbol: string; amount: number; avgPrice: number; }

const CHART_COLORS = ['#00F0FF', '#00FF9D', '#FF3366', '#7000FF', '#FFB800', '#F97316'];

const POMAFINADonutChart = ({ data, totalValue }: { data: any[], totalValue: number }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  if (data.length === 0 || totalValue === 0) return <div className="w-full h-full border-2 border-dashed border-gray-800 rounded-full flex items-center justify-center text-gray-600 text-xs font-mono">NO DATA</div>;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,240,255,0.1)]">
      {data.map((item) => {
        const percentage = item.value / totalValue;
        const strokeLength = percentage * circumference;
        const dashoffset = currentOffset;
        currentOffset -= strokeLength;
        return (
          <circle key={item.name} cx="50" cy="50" r={radius} fill="transparent" stroke={item.fill} strokeWidth="12"
            strokeDasharray={`${strokeLength} ${circumference}`} strokeDashoffset={dashoffset}
            className="transition-all duration-1000 ease-in-out hover:stroke-[14px] cursor-crosshair"
          />
        );
      })}
    </svg>
  );
};

export const Portfolio: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [historyData, setHistoryData] = useState<ChartPoint[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({ symbol: 'BTC', type: 'BUY', amount: '', price: '' });

  useEffect(() => {
    fetchData();
    fetchInitialPrices();

    const baseUrl = import.meta.env.VITE_SOCKET_URL
      || (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    const socket = io(baseUrl);

    socket.on('MARKET_LIVE_DATA', (liveData: any[]) => {
      setLivePrices((prev) => {
        const newPrices = { ...prev };
        liveData.forEach((coin: any) => {
          newPrices[coin.symbol.replace('USDT', '')] = parseFloat(coin.price);
        });
        return newPrices;
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const buildChartFromKlines = async (data: Holding[]): Promise<ChartPoint[]> => {
    const klinePromises = data.map((h) =>
      axiosClient
        .get(`/market/klines?symbol=${h.symbol}USDT&interval=1d&limit=7`)
        .then(res => ({ symbol: h.symbol, data: res.data.data as any[][] }))
        .catch(() => ({ symbol: h.symbol, data: [] as any[][] }))
    );

    const klinesResults = await Promise.all(klinePromises);
    const chartPoints: ChartPoint[] = [];

    for (let i = 0; i < 7; i++) {
      let totalValue = 0;
      let timestamp = 0;

      klinesResults.forEach(kr => {
        if (kr.data && kr.data[i]) {
          const closePrice = parseFloat(kr.data[i][4]);
          const holding = data.find(s => s.symbol === kr.symbol);
          if (holding && closePrice > 0) totalValue += holding.amount * closePrice;
          if (!timestamp) timestamp = Math.floor(kr.data[i][0] / 1000);
        }
      });

      if (timestamp && totalValue > 0) chartPoints.push({ time: timestamp, value: totalValue });
    }

    return chartPoints;
  };

  const buildFallbackChart = (data: Holding[], priceMap: Record<string, number>): ChartPoint[] => {
    const baseValue = data.reduce((acc, h) => acc + h.amount * (priceMap[h.symbol] || h.avgPrice), 0);
    const fluctuations = [0.974, 0.981, 0.968, 0.995, 1.008, 0.992, 1.0];
    const today = new Date();

    return fluctuations.map((factor, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return { time: Math.floor(d.getTime() / 1000), value: baseValue * factor };
    });
  };

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const response = await axiosClient.get('/portfolio/summary');
      const data: Holding[] = response.data?.data || [];

      setHoldings(data);

      if (data.length === 0) {
        setHistoryData([]);
        return;
      }

      // Cố gắng kéo dữ liệu thật từ klines
      let chartData = await buildChartFromKlines(data);

      // Nếu klines trả về ít hơn 3 ngày thì dùng fallback ước tính
      if (chartData.length < 3) {
        chartData = buildFallbackChart(data, livePrices);
      }

      setHistoryData(chartData);
    } catch (error) {
      showNotification('Could not sync portfolio with node.', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchInitialPrices = async () => {
    try {
      const res = await axiosClient.get('/market/tickers');
      if (res.data?.data) {
        const priceMap: Record<string, number> = {};
        res.data.data.forEach((coin: any) => {
          priceMap[coin.symbol.replace('USDT', '')] = parseFloat(coin.lastPrice);
        });
        setLivePrices(priceMap);
      }
    } catch (error) {
      console.error('Error fetching prices', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const totalNetWorth = holdings.reduce((acc, h) => acc + h.amount * (livePrices[h.symbol] || h.avgPrice), 0);

  const donutData = holdings.map((h, index) => ({
    name: h.symbol,
    value: h.amount * (livePrices[h.symbol] || h.avgPrice),
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        coinSymbol: formData.symbol,
        type: formData.type,
        quantity: Number(formData.amount),
        price: Number(formData.price),
      };
      await axiosClient.post('/portfolio/trade', payload);
      showNotification(`${formData.type} ${formData.symbol} order executed successfully.`, 'success');
      setFormData({ symbol: 'BTC', type: 'BUY', amount: '', price: '' });
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Transaction failed.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 relative">
      {notification && (
        <div className="fixed top-20 right-6 z-[100] animate-in fade-in slide-in-from-right-10">
          <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
        </div>
      )}

      <div>
        <p className="text-gray-500 font-bold tracking-widest text-xs mb-2 uppercase">CURRENT NET WORTH</p>
        <div className="flex items-end gap-4">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">${formatCurrency(totalNetWorth)}</h1>
          <div className="flex items-center gap-1 bg-green-950/40 border border-neon-green/30 text-neon-green px-3 py-1.5 rounded-lg mb-2 text-sm font-bold">
            <ArrowUpRight size={16} /> Live Data
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 relative flex flex-col min-h-[380px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity className="text-neon-cyan" size={20} />
                <h3 className="text-white font-bold tracking-widest text-sm uppercase">Total Portfolio Value</h3>
              </div>
            </div>

            <div className="w-full mt-2">
              {dataLoading ? (
                <div className="flex h-[260px] items-center justify-center text-neon-cyan animate-pulse font-mono text-sm">
                  LOADING CHART DATA...
                </div>
              ) : historyData.length > 0 ? (
                <PortfolioAreaChart data={historyData} height={260} />
              ) : (
                <div className="flex h-[260px] items-center justify-center text-gray-500 font-mono text-sm border border-dashed border-gray-800 rounded-xl">
                  [ INSUFFICIENT DATA TO RENDER CHART ]
                </div>
              )}
            </div>
          </div>

          <div className="bg-neon-panel border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#151924]/50">
              <h3 className="text-white font-bold tracking-widest text-sm uppercase">Asset Holdings</h3>
              <button className="text-neon-cyan text-sm font-bold hover:underline">View All &rarr;</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="p-5">Asset</th>
                    <th className="p-5 text-right">Amount</th>
                    <th className="p-5 text-right">Avg Price</th>
                    <th className="p-5 text-right">Current Price</th>
                    <th className="p-5 text-right">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {holdings.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-500 font-mono">No assets found.</td></tr>
                  ) : (
                    holdings.map((holding) => {
                      const currentPrice = livePrices[holding.symbol] || holding.avgPrice;
                      const pnl = (holding.amount * currentPrice) - (holding.amount * holding.avgPrice);
                      const isProfit = pnl >= 0;

                      return (
                        <tr key={holding.symbol} className="hover:bg-gray-800/40 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#1A1D24] flex items-center justify-center font-bold text-gray-300 border border-gray-700 shadow-inner">{holding.symbol.charAt(0)}</div>
                              <div><p className="text-white font-bold text-sm tracking-wide">{holding.symbol}</p></div>
                            </div>
                          </td>
                          <td className="p-5 text-right font-mono text-white font-medium">{holding.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                          <td className="p-5 text-right font-mono text-gray-400">${formatCurrency(holding.avgPrice)}</td>
                          <td className="p-5 text-right font-mono text-white">${formatCurrency(currentPrice)}</td>
                          <td className="p-5 text-right">
                            <div className={`inline-flex items-center gap-1 font-mono text-sm font-bold ${isProfit ? 'text-neon-green' : 'text-neon-red'}`}>
                              {isProfit ? '+$' : '-$'}{formatCurrency(Math.abs(pnl))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-bold tracking-widest text-sm uppercase mb-6">Asset Allocation</h3>
            <div className="h-48 relative mb-6 flex justify-center items-center">
              <POMAFINADonutChart data={donutData} totalValue={totalNetWorth} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white">{holdings.length}</span>
                <span className="text-[10px] text-gray-500 tracking-widest">ASSETS</span>
              </div>
            </div>
            <div className="space-y-3">
              {holdings.map((h, i) => (
                <div key={h.symbol} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                    {h.symbol}
                  </div>
                  <span className="text-white font-mono font-medium">
                    {Math.round((h.amount * (livePrices[h.symbol] || h.avgPrice)) / (totalNetWorth || 1) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#151924] to-[#0A0D12] border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-white font-bold tracking-widest text-sm uppercase">Quick Add</h3>
              <button className="p-1.5 bg-gray-800 text-gray-400 rounded hover:text-neon-cyan transition-colors"><Plus size={16} /></button>
            </div>
            <form onSubmit={handleQuickAdd} className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button type="button" onClick={() => setFormData({ ...formData, type: 'BUY' })} className={`py-2 rounded font-bold text-xs transition-all ${formData.type === 'BUY' ? 'bg-green-950/40 text-neon-green border border-neon-green/30' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-600'}`}>BUY</button>
                <button type="button" onClick={() => setFormData({ ...formData, type: 'SELL' })} className={`py-2 rounded font-bold text-xs transition-all ${formData.type === 'SELL' ? 'bg-red-950/40 text-neon-red border border-neon-red/30' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-600'}`}>SELL</button>
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1.5">Asset Type</label>
                <input list="coin-suggestions" type="text" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })} className="w-full bg-[#0B0E14] border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-neon-cyan font-mono text-sm uppercase" placeholder="Search or type (e.g. BTC)" required />
                <datalist id="coin-suggestions">
                  <option value="BTC">Bitcoin</option>
                  <option value="ETH">Ethereum</option>
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1.5">Amount</label>
                  <input type="number" step="any" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-[#0B0E14] border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-neon-cyan font-mono text-sm" placeholder="0.00" required />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase">Price Paid</label>
                    <button type="button" onClick={() => setFormData({ ...formData, price: (livePrices[formData.symbol] || 0).toString() })} className="text-neon-cyan text-[9px] hover:underline">Use Current Price</button>
                  </div>
                  <input type="number" step="any" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-[#0B0E14] border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-neon-cyan font-mono text-sm" placeholder="$ 0.00" required />
                </div>
              </div>
              <button type="submit" disabled={submitLoading} className="w-full mt-4 py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50">
                {submitLoading ? 'EXECUTING...' : 'EXECUTE TRANSACTION'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};


