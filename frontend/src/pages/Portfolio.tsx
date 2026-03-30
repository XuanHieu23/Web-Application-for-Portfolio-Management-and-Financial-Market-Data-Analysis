import React, { useEffect, useState } from 'react';
import { portfolioApi } from '../api/portfolioApi';

// Định nghĩa kiểu dữ liệu cho Ví
interface PortfolioItem {
  _id: string;
  coinSymbol: string;
  quantity: number;
  avgPurchasePrice: number;
}

export const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Hàm lấy dữ liệu Ví từ Backend
  const fetchPortfolio = async () => {
    try {
      const data = await portfolioApi.getPortfolio(); // Dùng hàm viết sẵn
      setPortfolio(data);
    } catch (error) {
      console.error('Lỗi khi lấy ví:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Hàm test nút MUA
  const handleTestBuy = async () => {
    try {
      await portfolioApi.tradeCoin({
        coinSymbol: 'BTC',
        type: 'BUY',
        quantity: 0.5,
        price: 65000 
      });
      fetchPortfolio(); // Cập nhật lại ví sau khi mua thành công
    } catch (error) {
      console.error('Lỗi khi mua:', error);
    }
  };

  // Chạy ngay khi vào trang
  useEffect(() => {
    fetchPortfolio();
  }, []);

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-neon-cyan">My Portfolio</h1>
        <button 
          onClick={handleTestBuy}
          className="bg-neon-green/20 border border-neon-green text-neon-green px-4 py-2 rounded-lg hover:bg-neon-green/40 transition-colors"
        >
          + Test Buy 0.5 BTC
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading your assets...</p>
      ) : portfolio.length === 0 ? (
        <div className="text-center py-12 bg-neon-panel rounded-xl border border-gray-800">
          <p className="text-gray-400">Your portfolio is empty. Make a trade to start!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio.map((item) => (
            <div key={item._id} className="bg-neon-panel border border-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{item.coinSymbol}</h2>
                <span className="text-gray-400 text-sm">Asset</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantity</span>
                  <span className="font-mono text-lg">{item.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg. Entry Price</span>
                  <span className="font-mono text-neon-cyan">${item.avgPurchasePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-800 mt-4">
                  <span className="text-gray-400">Total Value</span>
                  <span className="font-mono text-lg font-bold text-neon-green">
                    ${(item.quantity * item.avgPurchasePrice).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};