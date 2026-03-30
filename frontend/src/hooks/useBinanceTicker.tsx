import { useState, useEffect } from 'react';

// Định nghĩa kiểu dữ liệu trả về: { BTCUSDT: { price: 65000, change: 2.5 }, ETHUSDT: ... }
interface TickerData {
  [symbol: string]: {
    price: number;
    change: number;
  };
}

export const useBinanceTickers = (symbols: string[]) => {
  const [tickers, setTickers] = useState<TickerData>({});

  useEffect(() => {
    // Nếu không có coin nào thì không mở kết nối
    if (symbols.length === 0) return;

    // 1. Ép các mã coin về chữ thường và nối lại đúng chuẩn Binance (vd: btcusdt@ticker/ethusdt@ticker)
    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    
    // 2. Mở đường ống kết nối
    const ws = new WebSocket(wsUrl);

    // 3. Lắng nghe dữ liệu đổ về
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Data của Binance trả về nằm trong biến message.data
      const data = message.data;
      
      if (data) {
        // Cập nhật giá mới vào state mà không làm mất giá của các coin khác
        setTickers(prev => ({
          ...prev,
          [data.s]: { // data.s là Tên Coin (VD: BTCUSDT)
            price: parseFloat(data.c), // data.c là Giá hiện tại (Current Price)
            change: parseFloat(data.P) // data.P là % Thay đổi 24h
          }
        }));
      }
    };

    // 4. Đóng kết nối khi rời trang hoặc thay đổi danh sách coin
    return () => {
      ws.close();
    };
  }, [symbols.join(',')]); // Hook sẽ chạy lại nếu mảng symbols thay đổi

  return tickers;
};