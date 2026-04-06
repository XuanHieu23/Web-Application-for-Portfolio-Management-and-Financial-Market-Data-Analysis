import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { axiosClient } from '../services/axiosClient'; 
import { NotificationBanner } from '../component/ui/NotificationBanner';

interface Transaction {
  _id: string;
  coinSymbol: string; // Khớp với Backend
  type: 'BUY' | 'SELL';
  quantity: number;   // Khớp với Backend
  price: number;
  timestamp: string;
}

interface Holding {
  symbol: string;
  amount: number;
  avgPrice: number;
}

export const Portfolio: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  
  // Quản lý thông báo Banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Dữ liệu form Quick Add
  const [formData, setFormData] = useState({
    symbol: 'BTC',
    type: 'BUY',
    amount: '',
    price: ''
  });

  useEffect(() => {
    fetchData();
    fetchLivePrices();
  }, []);

  // 1. KÉO LỊCH SỬ GIAO DỊCH TỪ BACKEND
  const fetchData = async () => {
    try {
      const response = await axiosClient.get('/transactions');
      // Dựa theo controller bạn gửi, có thể response là mảng luôn hoặc bọc trong .data
      const data = response.data.data || response.data; 
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Lỗi lấy giao dịch:', error);
      showNotification('Could not sync transactions with node.', 'error');
    }
  };

  // 2. KÉO GIÁ LIVE TỪ BINANCE (Thông qua Backend Proxy)
  const fetchLivePrices = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/market/tickers');
      const resData = await res.json();
      const priceMap: Record<string, number> = {};
      if (resData && resData.data) {
        resData.data.forEach((coin: any) => {
          priceMap[coin.symbol.replace('USDT', '')] = parseFloat(coin.lastPrice);
        });
        setLivePrices(priceMap);
      }
    } catch (error) {
      console.error('Lỗi lấy giá live:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 3. TÍNH TOÁN TỔNG TÀI SẢN TỪ LỊCH SỬ
  const calculateHoldings = (): Holding[] => {
    const holdingsMap: Record<string, { totalAmount: number; totalCost: number }> = {};
    
    transactions.forEach(t => {
      // Đảm bảo an toàn nếu backend trả về symbol hay coinSymbol
      const sym = t.coinSymbol || (t as any).symbol; 
      const qty = t.quantity || (t as any).amount;
      
      if (!sym || !qty) return;

      if (!holdingsMap[sym]) holdingsMap[sym] = { totalAmount: 0, totalCost: 0 };
      
      if (t.type === 'BUY') {
        holdingsMap[sym].totalAmount += qty;
        holdingsMap[sym].totalCost += (qty * t.price);
      } else {
        holdingsMap[sym].totalAmount -= qty;
      }
    });

    return Object.keys(holdingsMap)
      .filter(symbol => holdingsMap[symbol].totalAmount > 0)
      .map(symbol => ({
        symbol,
        amount: holdingsMap[symbol].totalAmount,
        avgPrice: holdingsMap[symbol].totalCost / holdingsMap[symbol].totalAmount
      }));
  };

  const holdings = calculateHoldings();

  // 4. BẮN GIAO DỊCH XUỐNG BACKEND
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // CHÚ Ý TẠI ĐÂY: Đổi tên biến cho khớp 100% với file transaction.model.ts của Backend
      const payload = {
        coinSymbol: formData.symbol, // Backend cần 'coinSymbol'
        type: formData.type,
        quantity: Number(formData.amount), // Backend cần 'quantity'
        price: Number(formData.price)
      };

      await axiosClient.post('/transactions', payload);

      showNotification(`${formData.type} ${formData.symbol} order executed successfully.`, 'success');
      setFormData({ symbol: 'BTC', type: 'BUY', amount: '', price: '' });
      fetchData(); // Load lại data ngay lập tức
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Transaction failed. Check server logs.';
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 relative">
      
      {/* BANNER THÔNG BÁO */}
      {notification && (
        <div className="fixed top-20 right-6 z-[100] animate-in fade-in slide-in-from-right-10">
          <NotificationBanner 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        </div>
      )}

      {/* HEADER: NET WORTH */}
      <div>
        <p className="text-gray-500 font-bold tracking-widest text-xs mb-2 uppercase">CURRENT NET WORTH</p>
        <div className="flex items-end gap-4">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            ${formatCurrency(holdings.reduce((acc, h) => acc + (h.amount * (livePrices[h.symbol] || h.avgPrice)), 0))}
          </h1>
          <div className="flex items-center gap-1 bg-green-950/40 border border-neon-green/30 text-neon-green px-3 py-1.5 rounded-lg mb-2 text-sm font-bold">
            <ArrowUpRight size={16} /> Live Data
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* =======================================
            CỘT TRÁI (BẢN ĐỒ & HOLDINGS TABLE) 
            ======================================= */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Chart Placeholder */}
          <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 h-80 relative flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold tracking-widest text-sm uppercase">Total Portfolio Value</h3>
              <div className="flex gap-2">
                {['1H', '1D', '1W', '1M', 'ALL'].map(time => (
                  <button key={time} className="px-3 py-1 bg-gray-900 border border-gray-700 text-gray-400 text-xs font-bold rounded hover:text-white transition-colors">
                    {time}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center text-gray-600 font-mono text-sm bg-gradient-to-t from-neon-cyan/5 to-transparent">
              [ Area Chart Placeholder ]
            </div>
          </div>

          {/* Asset Holdings Table */}
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
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-gray-500 font-mono">No assets found. Add a transaction to start tracking.</td>
                    </tr>
                  ) : (
                    holdings.map((holding) => {
                      const currentPrice = livePrices[holding.symbol] || holding.avgPrice;
                      const totalInvested = holding.amount * holding.avgPrice;
                      const currentValue = holding.amount * currentPrice;
                      const pnl = currentValue - totalInvested;
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
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-right font-mono text-white font-medium">{holding.amount}</td>
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

        {/* =======================================
            CỘT PHẢI (SIDEBAR & QUICK ADD)
            ======================================= */}
        <div className="space-y-6">
          
          {/* Asset Allocation */}
          <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-bold tracking-widest text-sm uppercase mb-6">Asset Allocation</h3>
            <div className="h-48 border-2 border-dashed border-gray-800 rounded-full w-48 mx-auto flex items-center justify-center text-gray-500 text-xs font-mono mb-6 relative">
              [ Donut Chart ]
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{holdings.length}</span>
                <span className="text-[10px] text-gray-500 tracking-widest">ASSETS</span>
              </div>
            </div>
            <div className="space-y-3">
              {holdings.map((h, i) => (
                <div key={h.symbol} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: i % 2 === 0 ? '#00F0FF' : '#00FF9D'}}></span>
                    {h.symbol}
                  </div>
                  <span className="text-white font-mono font-medium">
                    {Math.round((h.amount * h.avgPrice) / (holdings.reduce((acc, curr) => acc + (curr.amount * curr.avgPrice), 0) || 1) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add Form */}
          <div className="bg-gradient-to-br from-[#151924] to-[#0A0D12] border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-white font-bold tracking-widest text-sm uppercase">Quick Add</h3>
              <button className="p-1.5 bg-gray-800 text-gray-400 rounded hover:text-neon-cyan transition-colors">
                <Plus size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button type="button" onClick={() => setFormData({ ...formData, type: 'BUY' })} className={`py-2 rounded font-bold text-xs transition-all ${formData.type === 'BUY' ? 'bg-green-950/40 text-neon-green border border-neon-green/30' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-600'}`}>BUY</button>
                <button type="button" onClick={() => setFormData({ ...formData, type: 'SELL' })} className={`py-2 rounded font-bold text-xs transition-all ${formData.type === 'SELL' ? 'bg-red-950/40 text-neon-red border border-neon-red/30' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-600'}`}>SELL</button>
              </div>

              <div>
                <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1.5">Asset Type</label>
                <div className="relative">
                  <input type="text" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })} className="w-full bg-[#0B0E14] border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-neon-cyan font-mono text-sm uppercase" placeholder="BTC" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-1.5">Amount</label>
                  <input type="number" step="any" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-[#0B0E14] border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-neon-cyan font-mono text-sm" placeholder="0.00" required />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase">Price Paid</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const currentLivePrice = livePrices[formData.symbol] || 0;
                        setFormData({ ...formData, price: currentLivePrice.toString() });
                      }}
                      className="text-neon-cyan text-[9px] hover:underline"
                    >
                      Use Current Price
                    </button>
                  </div>
                  <input type="number" step="any" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-[#0B0E14] border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-neon-cyan font-mono text-sm" placeholder="$ 0.00" required />
                  </div>
              </div>

              <button type="submit" disabled={loading} className="w-full mt-4 py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50">
                {loading ? 'EXECUTING...' : 'EXECUTE TRANSACTION'}
              </button>
              <p className="text-center text-[9px] text-gray-600 tracking-widest uppercase mt-2">Last synced with node: 12ms ago</p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};