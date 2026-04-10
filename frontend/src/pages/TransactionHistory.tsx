import React, { useState, useEffect } from 'react';
import { axiosClient } from '../services/axiosClient';
import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';

interface Transaction {
  _id: string;
  coinSymbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
}

export const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axiosClient.get('/portfolio/transactions');
        const data = response.data.data || response.data;
        if (Array.isArray(data)) setTransactions(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="flex items-center justify-center h-full text-neon-cyan font-mono animate-pulse">LOADING LEDGER...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-500 font-bold tracking-widest text-xs mb-2 uppercase">PORTFOLIO LEDGER</p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-6">Transaction History</h1>
      </div>

      <div className="bg-neon-panel border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-900/80 border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-5">Date & Time</th>
                <th className="p-5">Type</th>
                <th className="p-5">Asset</th>
                <th className="p-5 text-right">Amount</th>
                <th className="p-5 text-right">Filled Price</th>
                <th className="p-5 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-mono text-sm">No transaction history found.</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="p-5 text-gray-400 font-mono text-sm flex items-center gap-2">
                      <Clock size={14} className="text-gray-600" />
                      {formatDate(tx.timestamp || (tx as any).date)}
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${
                        tx.type === 'BUY' ? 'bg-green-950/40 text-neon-green border-neon-green/30' : 'bg-red-950/40 text-neon-red border-neon-red/30'
                      }`}>
                        {tx.type === 'BUY' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-5 font-bold text-white tracking-wide">{tx.coinSymbol}</td>
                    <td className="p-5 text-right font-mono text-white">{tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                    <td className="p-5 text-right font-mono text-gray-400">${formatCurrency(tx.price)}</td>
                    <td className="p-5 text-right font-mono text-white font-bold">${formatCurrency(tx.quantity * tx.price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};