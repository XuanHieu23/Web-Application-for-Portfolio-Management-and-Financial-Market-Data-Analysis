import React, { useEffect, useState } from 'react';
import { portfolioApi } from '../api/portfolioApi';

export const Dashboard: React.FC = () => {
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Lấy dữ liệu ví thật từ Backend
        const portfolioData = await portfolioApi.getPortfolio();
        
        // Tính tổng tài sản: Tổng cộng (Số lượng * Giá vốn) của tất cả các đồng coin
        const calculatedTotal = portfolioData.reduce((acc: number, item: any) => {
          return acc + (item.quantity * item.avgPurchasePrice);
        }, 0);

        setTotalBalance(calculatedTotal);
      } catch (error) {
        console.error('Lỗi khi tải Dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>

      {/* Bốn thẻ chỉ số */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Thẻ 1: TỔNG TÀI SẢN (Dữ liệu thật) */}
        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl group-hover:bg-neon-cyan/10 transition-colors"></div>
          <p className="text-gray-400 text-sm mb-2">Total Balance (Est.)</p>
          {loading ? (
             <div className="h-10 w-32 bg-gray-800 animate-pulse rounded"></div>
          ) : (
             <h2 className="text-4xl font-bold text-white">
               ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h2>
          )}
          <div className="mt-4 flex items-center text-neon-green text-sm font-medium">
            <span>+0.00% (24h)</span> {/* Tạm để tĩnh vì chưa có API giá thị trường */}
          </div>
        </div>

        {/* Các thẻ Mock khác (Sẽ làm thật ở các tuần sau khi tích hợp API Giá Coin) */}
        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-2">24h Profit/Loss</p>
          <h2 className="text-2xl font-bold text-neon-green">+$0.00</h2>
        </div>
        
        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-2">Active Assets</p>
          <h2 className="text-2xl font-bold text-white">--</h2>
        </div>

        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-2">Market Trend</p>
          <h2 className="text-2xl font-bold text-yellow-400">Neutral</h2>
        </div>
      </div>

      {/* Phần Chart và Lịch sử giao dịch sẽ được đồng bộ tiếp ở Tuần 3 */}
      <div className="mt-8 bg-neon-panel border border-gray-800 rounded-2xl p-6 h-96 flex items-center justify-center">
        <p className="text-gray-500">Market Chart will be integrated here</p>
      </div>
    </div>
  );
};