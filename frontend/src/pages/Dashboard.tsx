import React, { useEffect, useState } from 'react';
import { portfolioApi } from '../api/portfolioApi';
import { useBinanceTickers } from '../hooks/useBinanceTicker'; // Gọi Hook mới

export const Dashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Lấy danh sách các mã coin user đang giữ (thêm chữ USDT vào đuôi cho đúng chuẩn Binance)
  const symbols = portfolio.map(item => `${item.coinSymbol}USDT`);
  
  // 2. Cắm ống WebSocket hút giá của toàn bộ các coin đó
  const livePrices = useBinanceTickers(symbols);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const portfolioData = await portfolioApi.getPortfolio();
        setPortfolio(portfolioData);
      } catch (error) {
        console.error('Lỗi tải ví:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // 3. CÔNG THỨC TÍNH TỔNG TÀI SẢN REAL-TIME
  // Lặp qua ví, lấy số lượng nhân với giá live. Nếu chưa có giá live thì dùng giá gốc lúc mua (avgPurchasePrice)
  const realTimeTotalBalance = portfolio.reduce((total, item) => {
    const symbolUSDT = `${item.coinSymbol}USDT`;
    const currentPrice = livePrices[symbolUSDT]?.price || item.avgPurchasePrice;
    return total + (item.quantity * currentPrice);
  }, 0);

  // 4. CÔNG THỨC TÍNH TIỀN LỜI/LỖ (PnL)
  // Tổng tiền hiện tại trừ đi (Tổng tiền vốn = số lượng * giá lúc mua)
  const totalCost = portfolio.reduce((total, item) => total + (item.quantity * item.avgPurchasePrice), 0);
  const profitAndLoss = realTimeTotalBalance - totalCost;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>

      {loading ? (
        <div className="text-gray-400 animate-pulse">Đang đồng bộ dữ liệu thị trường...</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Thẻ 1: Tổng Tài Sản (Nhảy số liên tục) */}
        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-2">Total Balance (Live)</p>
          <h2 className="text-4xl font-bold text-white font-mono">
            ${realTimeTotalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Thẻ 2: Tiền Lời / Lỗ (Nhảy số liên tục theo giá) */}
        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-2">Total Profit/Loss</p>
          <h2 className={`text-2xl font-bold font-mono ${profitAndLoss >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
            {profitAndLoss >= 0 ? '+' : '-'}${Math.abs(profitAndLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
      </div>
      )}
    </div>
  );
};