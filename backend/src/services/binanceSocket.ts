import { Server as SocketIOServer } from 'socket.io';
import WebSocket from 'ws';

const RECONNECT_DELAY_MS = 5000;

function connect(io: SocketIOServer): void {
  const binanceWs = new WebSocket('wss://stream.binance.com:443/ws/!miniTicker@arr');

  binanceWs.on('error', (error) => {
    console.error('⚠️ [Warning] Binance WebSocket connection error:', error.message);
  });

  binanceWs.on('open', () => {
    console.log('✅ Backend has connected successfully to Binance');
  });

  binanceWs.on('message', (data: string) => {
    try {
      const tickers = JSON.parse(data);

      const usdtPairs = tickers.filter((t: any) => t.s.endsWith('USDT'));

      const optimizedData = usdtPairs.map((t: any) => {
        const close = parseFloat(t.c);
        const open = parseFloat(t.o);
        const priceChangePercent = open !== 0
          ? (((close - open) / open) * 100).toFixed(2)
          : '0';
        return { symbol: t.s, price: t.c, priceChangePercent };
      });

      io.emit('MARKET_LIVE_DATA', optimizedData);
    } catch (error) {
      console.error('Failed to parse WebSocket data:', error);
    }
  });

  binanceWs.on('close', () => {
    console.log(`❌ Binance WebSocket disconnected — reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
    setTimeout(() => connect(io), RECONNECT_DELAY_MS);
  });
}

export const setupBinanceSocket = (io: SocketIOServer): void => {
  connect(io);
};
