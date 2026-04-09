import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { axiosClient } from '../services/axiosClient';

interface Transaction {
  _id: string;
  coinSymbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
}

interface Holding {
  symbol: string;
  amount: number;
  avgPrice: number;
}

export const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Lấy lịch sử giao dịch
        const txRes = await axiosClient.get('/transactions');
        const txData = txRes.data.data || txRes.data;
        if (Array.isArray(txData)) setTransactions(txData);

        // 2. Lấy giá Live hiện tại
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

  // Tái sử dụng thuật toán tính DCA chuẩn từ trang Portfolio
  const calculateHoldings = (): Holding[] => {
    const holdingsMap: Record<string, { amount: number; avgPrice: number }> = {};
    
    const sortedTxs = [...transactions].sort((a, b) => {
      return new Date(a.timestamp || (a as any).date).getTime() - new Date(b.timestamp || (b as any).date).getTime();
    });

    sortedTxs.forEach(t => {
      const sym = t.coinSymbol || (t as any).symbol; 
      const qty = t.quantity || (t as any).amount;
      
      if (!sym || !qty) return;
      if (!holdingsMap[sym]) holdingsMap[sym] = { amount: 0, avgPrice: 0 };
      
      if (t.type === 'BUY') {
        const oldTotalValue = holdingsMap[sym].amount * holdingsMap[sym].avgPrice;
        const newTotalValue = qty * t.price;
        const newTotalQty = holdingsMap[sym].amount + qty;
        holdingsMap[sym].avgPrice = (oldTotalValue + newTotalValue) / newTotalQty;
        holdingsMap[sym].amount = newTotalQty;
      } else if (t.type === 'SELL') {
        holdingsMap[sym].amount -= qty;
        if (holdingsMap[sym].amount <= 0) {
          holdingsMap[sym].amount = 0;
          holdingsMap[sym].avgPrice = 0;
        }
      }
    });

    return Object.keys(holdingsMap)
      .filter(symbol => holdingsMap[symbol].amount > 0)
      .map(symbol => ({
        symbol,
        amount: holdingsMap[symbol].amount,
        avgPrice: holdingsMap[symbol].avgPrice
      }));
  };

  const holdings = calculateHoldings();
  
  // Tính tổng quan tài khoản
  const totalInvested = holdings.reduce((acc, h) => acc + (h.amount * h.avgPrice), 0);
  const totalNetWorth = holdings.reduce((acc, h) => acc + (h.amount * (livePrices[h.symbol] || h.avgPrice)), 0);
  const totalPnL = totalNetWorth - totalInvested;
  const isTotalProfit = totalPnL >= 0;

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return <div className="flex items-center justify-center h-full text-neon-cyan font-mono animate-pulse">SYNCING DATA WITH NEURAL NET...</div>;
  }

  return (
    <div className="space-y-8">
      {/* HEADER: TỔNG QUAN TÀI SẢN */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-gray-500 font-bold tracking-widest text-xs mb-2 uppercase">DASHBOARD SUMMARY</p>
          <div className="flex items-end gap-4">
            <h1 className="text-5xl font-extrabold text-white tracking-tight">
              ${formatCurrency(totalNetWorth)}
            </h1>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg mb-2 text-sm font-bold border ${isTotalProfit ? 'bg-green-950/40 border-neon-green/30 text-neon-green' : 'bg-red-950/40 border-neon-red/30 text-neon-red'}`}>
              {isTotalProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isTotalProfit ? '+' : ''}{formatCurrency(totalPnL)}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE REGISTRY TABLE */}
      <div className="bg-neon-panel border border-gray-800 rounded-2xl overflow-hidden shadow-lg relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-blue-500 to-transparent opacity-50"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#151924]/50">
          <div className="flex items-center gap-3">
            <Activity className="text-neon-cyan" size={20} />
            <h3 className="text-white font-bold tracking-widest text-sm uppercase">Active Registry</h3>
          </div>
          <span className="text-xs font-mono text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
            {holdings.length} Assets Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-5">Asset</th>
                <th className="p-5 text-right">Holdings</th>
                <th className="p-5 text-right">Avg Cost</th>
                <th className="p-5 text-right">Market Price</th>
                <th className="p-5 text-right">Total Value</th>
                <th className="p-5 text-right">Unrealized PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-mono text-sm">
                    Registry is empty. Access Portfolio to initialize assets.
                  </td>
                </tr>
              ) : (
                holdings.map((holding) => {
                  const currentPrice = livePrices[holding.symbol] || holding.avgPrice;
                  const totalCost = holding.amount * holding.avgPrice;
                  const currentValue = holding.amount * currentPrice;
                  const pnl = currentValue - totalCost;
                  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={holding.symbol} className="hover:bg-gray-800/40 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#1A1D24] flex items-center justify-center font-bold text-gray-300 border border-gray-700 group-hover:border-neon-cyan/50 transition-colors">
                            {holding.symbol.charAt(0)}
                          </div>
                          <p className="text-white font-bold text-sm tracking-wide">{holding.symbol}</p>
                        </div>
                      </td>
                      <td className="p-5 text-right font-mono text-white font-medium">
                        {holding.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>
                      <td className="p-5 text-right font-mono text-gray-400">${formatCurrency(holding.avgPrice)}</td>
                      <td className="p-5 text-right font-mono text-white">${formatCurrency(currentPrice)}</td>
                      <td className="p-5 text-right font-mono text-white font-bold">${formatCurrency(currentValue)}</td>
                      <td className="p-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono text-sm font-bold ${isProfit ? 'text-neon-green' : 'text-neon-red'}`}>
                            {isProfit ? '+$' : '-$'}{formatCurrency(Math.abs(pnl))}
                          </span>
                          <span className={`text-[10px] font-bold tracking-wider ${isProfit ? 'text-green-500/70' : 'text-red-500/70'}`}>
                            {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </span>
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
  );
};