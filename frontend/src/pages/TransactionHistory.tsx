import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, ListFilter, ChevronDown, Clock, Database, FileText } from 'lucide-react';
import { axiosClient } from '../services/axiosClient';

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
  const [coinFilter, setCoinFilter] = useState('ALL');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axiosClient.get('/portfolio/transactions');
        if (res.data && res.data.success) {

          const txData = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.docs || []);
          setTransactions(txData);
        }
      } catch (error) {
        console.error('Failed to load transaction history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const coinOptions = Array.from(new Set(transactions.map(tx => tx.coinSymbol))).sort();
  const filteredTransactions = coinFilter === 'ALL'
    ? transactions
    : transactions.filter(tx => tx.coinSymbol === coinFilter);

  return (
    <div className="space-y-6 relative">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <FileText className="text-neon-cyan" size={28} />
            Ledger Registry
          </h1>
          <p className="text-gray-400 text-sm">Cryptographically secured and immutable transaction history.</p>
        </div>

        <div className="relative w-full md:w-56">
          <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
          <select
            value={coinFilter}
            onChange={(e) => setCoinFilter(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-neon-cyan transition-colors appearance-none cursor-pointer"
          >
            <option value="ALL">All Assets</option>
            {coinOptions.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="bg-neon-panel border border-gray-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-5">Transaction ID / Date</th>
                <th className="p-5">Asset</th>
                <th className="p-5">Type</th>
                <th className="p-5 text-right">Executed Price</th>
                <th className="p-5 text-right">Amount</th>
                <th className="p-5 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-neon-cyan animate-pulse font-mono text-sm">
                    <Database className="mx-auto mb-3 opacity-50" size={32} />
                    DECRYPTING LEDGER ARCHIVES...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-500 font-mono text-sm">
                    <Clock className="mx-auto mb-3 opacity-30" size={32} />
                    NO TRANSACTIONS FOUND IN REGISTRY
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  const totalValue = tx.quantity * tx.price;

                  return (
                    <tr key={tx._id} className="hover:bg-gray-800/40 transition-colors group">
                      <td className="p-5">
                        <p className="text-gray-400 font-mono text-xs mb-1">#{tx._id.slice(-8).toUpperCase()}</p>
                        <p className="text-white text-sm">{formatDate(tx.timestamp)}</p>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1A1D24] flex items-center justify-center font-bold text-gray-300 border border-gray-700">
                            {tx.coinSymbol.charAt(0)}
                          </div>
                          <span className="text-white font-bold">{tx.coinSymbol}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${
                          isBuy
                            ? 'bg-green-950/40 text-neon-green border-neon-green/30'
                            : 'bg-red-950/40 text-neon-red border-neon-red/30'
                        }`}>
                          {isBuy ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-5 text-right font-mono text-white">
                        ${formatCurrency(tx.price)}
                      </td>
                      <td className="p-5 text-right font-mono text-white">
                        {tx.quantity}
                      </td>
                      <td className="p-5 text-right font-mono font-bold text-white">
                        ${formatCurrency(totalValue)}
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
