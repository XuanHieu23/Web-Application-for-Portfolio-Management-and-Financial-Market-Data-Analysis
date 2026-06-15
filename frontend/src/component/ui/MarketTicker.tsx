import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const TOP_COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT'];

interface TickerEntry {
  price: number;
  change: number;
}

export const MarketTicker: React.FC = () => {
  const [livePrices, setLivePrices] = useState<Record<string, TickerEntry>>({});

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_SOCKET_URL
      || (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

    const socket = io(baseUrl);

    socket.on('MARKET_LIVE_DATA', (liveData: { symbol: string; price: string; priceChangePercent: string }[]) => {
      setLivePrices(prev => {
        const next = { ...prev };
        liveData.forEach(coin => {
          const coinName = coin.symbol.replace('USDT', '');
          if (TOP_COINS.includes(coinName)) {
            next[coinName] = {
              price: parseFloat(coin.price),
              change: parseFloat(coin.priceChangePercent ?? '0'),
            };
          }
        });
        return next;
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  // Nhân đôi mảng để dải băng cuộn liên tục, không bị đứt
  const displayCoins = [...TOP_COINS, ...TOP_COINS];

  return (
    <div className="w-full bg-[#0B0E14] border-b border-gray-800 overflow-hidden flex items-center h-10">
      <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused] cursor-pointer">
        {displayCoins.map((coin, index) => {
          const data = livePrices[coin];
          const price = data?.price ?? 0;
          const change = data?.change ?? 0;
          const isPositive = change >= 0;

          return (
            <div key={`${coin}-${index}`} className="flex items-center space-x-3 mx-6">
              <span className="text-gray-400 font-bold text-sm">{coin}</span>
              <span className="text-white font-mono text-sm">
                ${price > 0
                  ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                  : '---'}
              </span>
              <span className={`text-xs font-bold ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
                {price > 0 ? `${isPositive ? '+' : ''}${change.toFixed(2)}%` : '···'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
