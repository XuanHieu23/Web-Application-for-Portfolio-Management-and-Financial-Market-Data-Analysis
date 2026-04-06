import React from 'react';
import { useBinanceTickers } from '../../hooks/useBinanceTicker';

// Danh sách Top 10 Coin muốn hiển thị trên dải băng
const TOP_COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT'];

export const MarketTicker: React.FC = () => {
  // Gắn chữ USDT vào đuôi để thành mã chuẩn của Binance (VD: BTCUSDT)
  const symbols = TOP_COINS.map(coin => `${coin}USDT`);
  
  // Hút giá Live của cả 10 đồng coin cùng lúc!
  const livePrices = useBinanceTickers(symbols);

  // Mẹo UX: Nhân đôi mảng để khi chạy hết danh sách, nó tự nối tiếp vào đuôi mà không bị giật hay đứt quãng
  const displayCoins = [...TOP_COINS, ...TOP_COINS];

  return (
    <div className="w-full bg-[#0B0E14] border-b border-gray-800 overflow-hidden flex items-center h-10">
      <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused] cursor-pointer">
        {displayCoins.map((coin, index) => {
          const data = livePrices[`${coin}USDT`];
          const price = data?.price || 0;
          const change = data?.change || 0;
          const isPositive = change >= 0;

          return (
            <div key={`${coin}-${index}`} className="flex items-center space-x-3 mx-6">
              <span className="text-gray-400 font-bold text-sm">{coin}</span>
              <span className="text-white font-mono text-sm">
                ${price > 0 ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
              </span>
              <span className={`text-xs font-bold ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};