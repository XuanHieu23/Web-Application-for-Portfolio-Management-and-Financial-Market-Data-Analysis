import React, { useEffect, useState } from 'react';
import { portfolioApi } from '../api/portfolioApi';
import { useBinanceTickers } from '../hooks/useBinanceTicker'; 
// 1. IMPORT COMPONENT BIỂU ĐỒ VÀO ĐÂY:
import { CandlestickChart } from '../component/ui/CandlestickChart'; 

export const Dashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách mã coin và cắm ống WebSocket
  const symbols = portfolio.map(item => `${item.coinSymbol}USDT`);
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

  // Tính toán
  const realTimeTotalBalance = portfolio.reduce((total, item) => {
    const symbolUSDT = `${item.coinSymbol}USDT`;
    const currentPrice = livePrices[symbolUSDT]?.price || item.avgPurchasePrice;
    return total + (item.quantity * currentPrice);
  }, 0);

  const totalCost = portfolio.reduce((total, item) => total + (item.quantity * item.avgPurchasePrice), 0);
  const profitAndLoss = realTimeTotalBalance - totalCost;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>

      {loading ? (
        <div className="text-gray-400 animate-pulse">Đang đồng bộ dữ liệu thị trường...</div>
      ) : (
        /* 2. BỌC BẰNG FRAGMENT <> ... </> TẠI ĐÂY */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Thẻ 1: Tổng Tài Sản */}
            <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 shadow-lg">
              <p className="text-gray-400 text-sm mb-2">Total Balance (Live)</p>
              <h2 className="text-4xl font-bold text-white font-mono">
                ${realTimeTotalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>

            {/* Thẻ 2: Tiền Lời / Lỗ */}
            <div className="bg-neon-panel border border-gray-800 rounded-2xl p-6 shadow-lg">
              <p className="text-gray-400 text-sm mb-2">Total Profit/Loss</p>
              <h2 className={`text-2xl font-bold font-mono ${profitAndLoss >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {profitAndLoss >= 0 ? '+' : '-'}${Math.abs(profitAndLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>

          {/* Phần Chart */}
          <div className="mt-8 bg-neon-panel border border-gray-800 rounded-2xl p-6 shadow-lg">
             <CandlestickChart />
          </div>
        </>
      )}
    </div>
  );
};  