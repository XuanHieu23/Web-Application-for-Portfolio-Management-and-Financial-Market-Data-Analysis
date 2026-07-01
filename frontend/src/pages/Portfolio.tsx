import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Plus, Activity, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { axiosClient } from '../services/axiosClient';
import { getSocketUrl } from '../services/socketUrl';
import { NotificationBanner } from '../component/ui/NotificationBanner';
import { io } from 'socket.io-client';

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Asset symbol is required'),
  type: z.enum(['BUY', 'SELL']),
  amount: z.string().min(1, 'Amount is required').refine(v => parseFloat(v) > 0, { message: 'Amount must be greater than 0' }),
  price: z.string().min(1, 'Price is required').refine(v => parseFloat(v) > 0, { message: 'Price must be greater than 0' }),
});

type TradeData = z.infer<typeof tradeSchema>;

interface Holding { symbol: string; amount: number; avgPrice: number; }

interface Transaction {
  _id: string;
  coinSymbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
}

export const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TradeData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: { symbol: 'BTC', type: 'BUY' },
  });

  const watchedType = watch('type');
  const watchedSymbol = watch('symbol');

  useEffect(() => {
    fetchData();
    fetchInitialPrices();

    const socket = io(getSocketUrl());

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

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        axiosClient.get('/portfolio/summary'),
        axiosClient.get('/portfolio/transactions'),
      ]);
      setHoldings(summaryRes.data?.data || []);
      const txData = Array.isArray(txRes.data?.data) ? txRes.data.data : [];
      setRecentTx(txData.slice(0, 5));
    } catch {
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
    } catch {}
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTrade = async (data: TradeData) => {
    setSubmitLoading(true);
    try {
      await axiosClient.post('/portfolio/trade', {
        coinSymbol: data.symbol,
        type: data.type,
        quantity: parseFloat(data.amount),
        price: parseFloat(data.price),
      });
      showNotification(`${data.type} ${data.symbol} executed successfully.`, 'success');
      reset({ symbol: 'BTC', type: 'BUY' });
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Transaction failed.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalNetWorth = holdings.reduce((acc, h) => acc + h.amount * (livePrices[h.symbol] || h.avgPrice), 0);
  const totalInvested = holdings.reduce((acc, h) => acc + h.amount * h.avgPrice, 0);
  const totalPnL = totalNetWorth - totalInvested;

  const fmt = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6 relative pb-10">
      {notification && (
        <div className="fixed top-20 right-6 z-[100] animate-in fade-in slide-in-from-right-10">
          <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
        </div>
      )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-gray-500 font-bold tracking-widest text-xs mb-2 uppercase">Wallet Balance</p>
          <div className="flex items-end gap-4">
            <h1 className="text-5xl font-extrabold text-white tracking-tight">${fmt(totalNetWorth)}</h1>
            <div className="flex items-center gap-1 bg-green-950/40 border border-neon-green/30 text-neon-green px-3 py-1.5 rounded-lg mb-2 text-sm font-bold">
              <ArrowUpRight size={16} /> Live
            </div>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Invested</p>
            <p className="text-white font-mono font-bold text-sm">${fmt(totalInvested)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Unrealized P&L</p>
            <p className={`font-mono font-bold text-sm ${totalPnL >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {totalPnL >= 0 ? '+' : '-'}${fmt(Math.abs(totalPnL))}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Positions</p>
            <p className="text-white font-mono font-bold text-sm">{holdings.length}</p>
          </div>
        </div>
      </div>

            <div className="bg-neon-panel border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-[#151924]/50">
          <div className="flex items-center gap-2">
            <Activity className="text-neon-cyan" size={18} />
            <h3 className="text-white font-bold tracking-widest text-sm uppercase">Asset Holdings</h3>
          </div>
          <span className="text-gray-500 font-mono text-xs">
            {holdings.length} position{holdings.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-5">Asset</th>
                <th className="p-5 text-right">Amount</th>
                <th className="p-5 text-right">Avg Price</th>
                <th className="p-5 text-right">Current Price</th>
                <th className="p-5 text-right hidden md:table-cell">Market Value</th>
                <th className="p-5 text-right hidden lg:table-cell">Weight</th>
                <th className="p-5 text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {dataLoading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-neon-cyan animate-pulse font-mono text-sm">
                    SYNCING WALLET...
                  </td>
                </tr>
              ) : holdings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500 font-mono text-sm">
                    No assets found. Execute your first trade below.
                  </td>
                </tr>
              ) : (
                holdings.map((holding) => {
                  const currentPrice = livePrices[holding.symbol] || holding.avgPrice;
                  const marketValue = holding.amount * currentPrice;
                  const pnl = marketValue - holding.amount * holding.avgPrice;
                  const pnlPct = holding.avgPrice > 0
                    ? (pnl / (holding.amount * holding.avgPrice)) * 100
                    : 0;
                  const weight = totalNetWorth > 0 ? (marketValue / totalNetWorth) * 100 : 0;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={holding.symbol} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#1A1D24] flex items-center justify-center font-bold text-gray-300 border border-gray-700 shadow-inner">
                            {holding.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm tracking-wide">{holding.symbol}</p>
                            <p className="text-gray-500 text-xs font-mono">{holding.symbol}/USDT</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-right font-mono text-white font-medium">
                        {holding.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>
                      <td className="p-5 text-right font-mono text-gray-400">${fmt(holding.avgPrice)}</td>
                      <td className="p-5 text-right font-mono text-white">${fmt(currentPrice)}</td>
                      <td className="p-5 text-right font-mono text-white hidden md:table-cell">
                        ${fmt(marketValue)}
                      </td>
                      <td className="p-5 text-right hidden lg:table-cell">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-white font-mono text-sm">{weight.toFixed(1)}%</span>
                          <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-neon-cyan rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(weight, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <div className={`font-mono text-sm font-bold ${isProfit ? 'text-neon-green' : 'text-neon-red'}`}>
                          <div>{isProfit ? '+$' : '-$'}{fmt(Math.abs(pnl))}</div>
                          <div className="text-xs opacity-75 mt-0.5">
                            {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                          </div>
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <div className="bg-gradient-to-br from-[#151924] to-[#0A0D12] border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Plus className="text-neon-cyan" size={18} />
            <h3 className="text-white font-bold tracking-widest text-sm uppercase">Execute Trade</h3>
          </div>
          <form onSubmit={handleSubmit(handleTrade)} className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('type', 'BUY')}
                className={`py-2.5 rounded-lg font-bold text-xs transition-all ${watchedType === 'BUY' ? 'bg-green-950/40 text-neon-green border border-neon-green/30' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-600'}`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'SELL')}
                className={`py-2.5 rounded-lg font-bold text-xs transition-all ${watchedType === 'SELL' ? 'bg-red-950/40 text-neon-red border border-neon-red/30' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-600'}`}
              >
                SELL
              </button>
            </div>
            <div>
              <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1.5">Asset</label>
              <input
                {...register('symbol')}
                list="coin-suggestions"
                type="text"
                onChange={(e) => setValue('symbol', e.target.value.toUpperCase(), { shouldValidate: true })}
                className={`w-full bg-[#0B0E14] border text-white rounded-lg px-3 py-2.5 focus:outline-none font-mono text-sm uppercase ${errors.symbol ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                placeholder="BTC, ETH..."
              />
              <datalist id="coin-suggestions">
                <option value="BTC">Bitcoin</option>
                <option value="ETH">Ethereum</option>
              </datalist>
              {errors.symbol && <p className="text-neon-red text-[10px] mt-1">{errors.symbol.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1.5">Amount</label>
                <input
                  {...register('amount')}
                  type="number"
                  step="any"
                  className={`w-full bg-[#0B0E14] border text-white rounded-lg px-3 py-2.5 focus:outline-none font-mono text-sm ${errors.amount ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                  placeholder="0.00"
                />
                {errors.amount && <p className="text-neon-red text-[10px] mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase">Price</label>
                  <button
                    type="button"
                    onClick={() => { const lp = livePrices[watchedSymbol]; if (lp) setValue('price', String(lp), { shouldValidate: true }); }}
                    className="text-neon-cyan text-[9px] hover:underline"
                  >
                    Use Live
                  </button>
                </div>
                <input
                  {...register('price')}
                  type="number"
                  step="any"
                  className={`w-full bg-[#0B0E14] border text-white rounded-lg px-3 py-2.5 focus:outline-none font-mono text-sm ${errors.price ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                  placeholder="$0.00"
                />
                {errors.price && <p className="text-neon-red text-[10px] mt-1">{errors.price.message}</p>}
              </div>
            </div>
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full mt-2 py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
            >
              {submitLoading ? 'EXECUTING...' : 'EXECUTE TRANSACTION'}
            </button>
          </form>
        </div>

                <div className="xl:col-span-2 bg-neon-panel border border-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Clock className="text-neon-cyan" size={18} />
              <h3 className="text-white font-bold tracking-widest text-sm uppercase">Recent Transactions</h3>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-neon-cyan text-xs font-bold hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {dataLoading ? (
              <p className="text-neon-cyan animate-pulse font-mono text-sm text-center py-8">LOADING...</p>
            ) : recentTx.length === 0 ? (
              <p className="text-gray-500 font-mono text-sm text-center py-8">No transactions yet.</p>
            ) : (
              recentTx.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'BUY' ? 'bg-green-950/50 text-neon-green' : 'bg-red-950/50 text-neon-red'}`}>
                      {tx.type === 'BUY' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">
                        {tx.type} <span className="font-mono">{tx.coinSymbol}</span>
                      </p>
                      <p className="text-gray-500 text-xs font-mono">{fmtDate(tx.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-mono text-sm font-bold">
                      {tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tx.coinSymbol}
                    </p>
                    <p className="text-gray-500 font-mono text-xs">@ ${fmt(tx.price)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
