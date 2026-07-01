import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BrainCircuit, Activity, Lock, PieChart as PieChartIcon, Layers } from 'lucide-react';
import { io } from 'socket.io-client';
import { axiosClient } from '../services/axiosClient';
import { useAuthStore } from '../store/authStore';
import { Typewriter } from '../component/ui/TypeWriter';
import { NotificationBanner } from '../component/ui/NotificationBanner';
import { PortfolioAreaChart, type ChartPoint } from '../component/ui/PortfolioAreaChart';
import ReactECharts from 'echarts-for-react';
import { getSocketUrl } from '../services/socketUrl';

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
  const [aiInsightIsNew, setAiInsightIsNew] = useState(false);
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
    } catch { showNotification('Could not connect to Stripe.', 'error'); }
    finally { setLoadingPayment(false); }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const summaryRes = await axiosClient.get('/portfolio/summary');
        const summaryData: Holding[] = summaryRes.data?.data || [];
        setHoldings(summaryData);

        if (summaryData.length === 0) { setHistoryData([]); return; }

        const klinePromises = summaryData.map((h) =>
          axiosClient
            .get(`/market/klines?symbol=${h.symbol}USDT&interval=1d&limit=7`)
            .then(res => ({ symbol: h.symbol, data: res.data.data as any[][] }))
            .catch(() => ({ symbol: h.symbol, data: [] as any[][] }))
        );
        const klinesResults = await Promise.all(klinePromises);

        const priceMap: Record<string, number> = {};
        try {
          const priceRes = await axiosClient.get('/market/tickers');
          if (priceRes.data?.data) {
            priceRes.data.data.forEach((coin: any) => {
              priceMap[coin.symbol.replace('USDT', '')] = parseFloat(coin.lastPrice);
            });
          }
        } catch {  }

        klinesResults.forEach(kr => {
          if (!priceMap[kr.symbol] && kr.data && kr.data.length > 0) {
            const closePrice = parseFloat(kr.data[kr.data.length - 1][4]);
            if (closePrice > 0) priceMap[kr.symbol] = closePrice;
          }
        });
        setLivePrices(priceMap);

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
          if (timestamp && totalValue > 0) chartPoints.push({ time: timestamp, value: totalValue });
        }

        setHistoryData(chartPoints);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAiInsight = async () => {
      if (user?.tier !== 'PRO') {
        setIsPro(false);
        setLoadingAi(false);
        return;
      }
      try {
        const response = await axiosClient.get('/ai/insight');
        if (response.data?.success) {
          setIsPro(true);
          setAiInsight(response.data.insight as string);
          setAiInsightIsNew(true);
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

  useEffect(() => {
    const socket = io(getSocketUrl());
    socket.on('MARKET_LIVE_DATA', (liveData: { symbol: string; price: string }[]) => {
      setLivePrices(prev => {
        const next = { ...prev };
        let changed = false;
        liveData.forEach(coin => {
          const sym = coin.symbol.replace('USDT', '');
          const newPrice = parseFloat(coin.price);
          if (prev[sym] !== newPrice) { next[sym] = newPrice; changed = true; }
        });
        return changed ? next : prev;
      });
    });
    return () => { socket.disconnect(); };
  }, []);

  const totalInvested = holdings.reduce((acc, h) => acc + h.amount * h.avgPrice, 0);
  const totalNetWorth = holdings.reduce((acc, h) => acc + h.amount * (livePrices[h.symbol] || h.avgPrice), 0);
  const totalPnL = totalNetWorth - totalInvested;
  const isTotalProfit = totalPnL >= 0;
  const totalReturnPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const performers = holdings
    .filter(h => h.avgPrice > 0)
    .map(h => ({
      symbol: h.symbol,
      pnlPct: ((livePrices[h.symbol] || h.avgPrice) - h.avgPrice) / h.avgPrice * 100,
    }))
    .sort((a, b) => b.pnlPct - a.pnlPct);
  const bestPerformer = performers[0] ?? null;

  const formatCurrency = (val: number) =>
    val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const PIE_COLORS = ['#00F0FF', '#00FF9D', '#FF3366', '#FFB800', '#9D00FF', '#FFFFFF'];

  const allocationData = holdings
    .map(h => ({ name: h.symbol, value: Number(h.amount) * Number(h.avgPrice) }))
    .filter(d => d.value > 0 && isFinite(d.value))
    .sort((a, b) => b.value - a.value);
  const allocationTotal = allocationData.reduce((acc, d) => acc + d.value, 0);

  const getPieOption = () => {
    const data = allocationData.map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] },
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        padding: 0,
        extraCssText: 'box-shadow:none;',
        formatter: (params: any) => {
          const pct = allocationTotal > 0
            ? ((params.value / allocationTotal) * 100).toFixed(1)
            : '0.0';
          return `
            <div style="background:#0B0E14;border:1px solid #374151;border-radius:12px;padding:10px 14px;min-width:160px;box-shadow:0 8px 32px rgba(0,0,0,0.9);">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1F2937;">
                <div style="width:10px;height:10px;border-radius:50%;background:${params.color};box-shadow:0 0 8px ${params.color};flex-shrink:0;"></div>
                <span style="color:#fff;font-weight:700;font-size:13px;">${params.name}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:4px;">
                <span style="color:#6B7280;font-size:11px;font-family:monospace;">Allocation</span>
                <span style="color:${params.color};font-weight:700;font-size:11px;font-family:monospace;">${pct}%</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:24px;">
                <span style="color:#6B7280;font-size:11px;font-family:monospace;">Value</span>
                <span style="color:#fff;font-size:11px;font-family:monospace;">${params.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
            </div>
          `;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['52%', '82%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 8,
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,240,255,0.4)',
            },
          },
          data: data.length > 0
            ? data
            : [{ value: 1, name: '', itemStyle: { color: '#1F2937' } }],
        },
      ],
    };
  };

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

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-neon-panel border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2">Total Invested</p>
          <p className="text-white text-xl font-bold font-mono">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="bg-neon-panel border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2">Total Return</p>
          <p className={`text-xl font-bold font-mono ${totalReturnPct >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
            {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
          </p>
        </div>
        <div className="bg-neon-panel border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2">Best Performer</p>
          {bestPerformer ? (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-white font-bold text-lg">{bestPerformer.symbol}</span>
              <span className={`font-mono text-sm font-bold ${bestPerformer.pnlPct >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {bestPerformer.pnlPct >= 0 ? '+' : ''}{bestPerformer.pnlPct.toFixed(2)}%
              </span>
            </div>
          ) : (
            <p className="text-gray-500 font-mono text-lg">—</p>
          )}
        </div>
        <div className="bg-neon-panel border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2">Positions</p>
          <p className="text-white text-xl font-bold font-mono">{holdings.length}</p>
          <p className="text-gray-500 text-[10px] mt-1 font-mono">{holdings.length === 1 ? 'active asset' : 'active assets'}</p>
        </div>
      </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:items-stretch">

                <div className="xl:col-span-2 flex flex-col gap-6">

                    <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-neon-cyan" size={20} />
              <h3 className="text-white font-bold tracking-widest text-sm uppercase">Net Worth Performance (7D)</h3>
            </div>
            <div className="w-full">
              {historyData.length > 0 ? (
                <PortfolioAreaChart data={historyData} height={260} />
              ) : (
                <div className="flex h-[260px] items-center justify-center text-gray-500 font-mono text-sm border border-dashed border-gray-800 rounded-xl">
                  [ ADD YOUR FIRST TRANSACTION TO TRACK NET WORTH ]
                </div>
              )}
            </div>
          </div>

                    <div className="flex-1 bg-gradient-to-br from-[#151924] to-[#0A0D12] border border-neon-cyan/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.05)] flex flex-col min-h-[280px]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
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
                      : 'Waiting for data anomalies...'}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6">
                  <Lock className="text-neon-cyan mb-3" size={32} />
                  <h4 className="text-white font-bold text-sm mb-2">Premium Feature Locked</h4>
                  <p className="text-gray-400 text-xs mb-6 font-mono leading-relaxed">Unlock POMAFINA AI Oracle. Get personalized portfolio analysis.</p>
                  <button
                    onClick={handleUpgrade}
                    disabled={loadingPayment}
                    className="w-full py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] transition-all disabled:opacity-50"
                  >
                    {loadingPayment ? 'INITIALIZING SECURE LINK...' : 'UPGRADE TO PRO ($15/mo)'}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

                <div className="flex flex-col gap-6">

                    <div className="animate-in fade-in slide-in-from-top-4 bg-neon-panel border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="text-neon-cyan" size={18} />
              <h3 className="text-white font-bold tracking-widest text-xs uppercase">Asset Allocation</h3>
            </div>

            {allocationData.length > 0 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-full" style={{ height: 220 }}>
                  <ReactECharts
                    option={getPieOption()}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-gray-600 text-[9px] font-mono tracking-widest uppercase">TOTAL</p>
                      <p className="text-white font-bold text-sm leading-tight">{formatCurrency(allocationTotal)}</p>
                    </div>
                  </div>
                </div>

                                <div className="w-full space-y-1.5">
                  {allocationData.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg cursor-default transition-colors hover:bg-gray-900/60"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-white text-xs font-bold">{entry.name}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-gray-500">
                        {((entry.value / allocationTotal) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <PieChartIcon className="text-gray-700" size={36} />
                <p className="text-gray-500 font-mono text-xs text-center leading-relaxed">
                  No allocation data.<br />Add assets to your portfolio.
                </p>
              </div>
            )}
          </div>

                    <div className="flex-1 bg-neon-panel border border-gray-800 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="text-neon-cyan" size={18} />
              <h3 className="text-white font-bold tracking-widest text-xs uppercase">Holdings</h3>
            </div>
            {holdings.length > 0 ? (
              <div className="space-y-2 flex-1">
                {holdings.map((h) => {
                  const currentPrice = livePrices[h.symbol] || h.avgPrice;
                  const value = h.amount * currentPrice;
                  const pnlPct = ((currentPrice - h.avgPrice) / h.avgPrice) * 100;
                  const isProfit = pnlPct >= 0;
                  const displayAmt = h.amount % 1 === 0
                    ? h.amount.toString()
                    : h.amount.toFixed(4);
                  return (
                    <div
                      key={h.symbol}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-900/40 hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-700/50"
                    >
                      <div>
                        <p className="text-white font-bold text-sm">{h.symbol}</p>
                        <p className="text-gray-500 font-mono text-[10px]">{displayAmt} units</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono text-sm font-bold">{formatCurrency(value)}</p>
                        <p className={`font-mono text-[10px] font-bold ${isProfit ? 'text-neon-green' : 'text-neon-red'}`}>
                          {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
                <Layers className="text-gray-700" size={32} />
                <p className="text-gray-500 font-mono text-xs text-center leading-relaxed">
                  No holdings yet.<br />Add assets to your portfolio.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
