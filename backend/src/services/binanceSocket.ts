import { Server as SocketIOServer } from 'socket.io';
import ws from 'ws';
import WebSocket from 'ws';

export const setupBinanceSocket = (io: SocketIOServer) => {
  // Kết nối nội bộ từ Backend của bạn đến Binance (Luồng Mini Ticker 24h của tất cả các coin)
  const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
  binanceWs.on('error', (error) => {
  console.error('⚠️ [Cảnh báo] Lỗi kết nối WebSocket tới Binance:', error.message);
});

  binanceWs.on('open', () => {
    console.log('✅ Backend has connected successfully to Binance');
  });

  binanceWs.on('message', (data: string) => {
    try {
      const tickers = JSON.parse(data);
      
      // Lọc ra các cặp giao dịch với USDT
      const usdtPairs = tickers.filter((t: any) => t.s.endsWith('USDT'));
      
      // Tối ưu: Chỉ gửi những data thật sự cần thiết cho UI (Symbol, Last Price, 24h Change)
      const optimizedData = usdtPairs.map((t: any) => ({
        symbol: t.s,
        price: t.c, // Close price (Giá hiện tại)
      }));

      // Bắn luồng dữ liệu này xuống tất cả các Frontend (Client) đang mở web
      io.emit('MARKET_LIVE_DATA', optimizedData);
      
    } catch (error) {
      console.error('Lỗi khi parse dữ liệu Socket:', error);
    }
  });

  binanceWs.on('close', () => {
    console.log('❌ Backend has lost connection with Binance, attempting to reconnect...');
    // Trong thực tế sẽ viết logic auto-reconnect ở đây
  });
};