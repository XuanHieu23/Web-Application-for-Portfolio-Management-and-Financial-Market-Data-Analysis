import { Request, Response } from 'express';
import axios from 'axios';

// [GET] Kéo dữ liệu Ticker 24h
export const getTickers = async (req: Request, res: Response) => {
  try {
    // ĐÃ FIX: Đổi domain sang api.binance.com để tránh bị nhà mạng VN chặn
    const response = await axios.get('https://api4.binance.com/api/v3/ticker/24hr');
    
    const usdtPairs = response.data
      .filter((c: any) => c.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 10);

    res.status(200).json({ success: true, data: usdtPairs });
  } catch (error) {
    console.error('Lỗi gọi API Binance Ticker:', error);
    res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu thị trường' });
  }
};

// [GET] Kéo dữ liệu Nến Nhật (Klines)
export const getKlines = async (req: Request, res: Response) => {
  try {
    const { symbol, interval = '1d', limit = 100 } = req.query;
    
    // ĐÃ FIX: Đổi domain sang api.binance.com
    const response = await axios.get('https://api4.binance.com/api/v3/klines', {
      params: { symbol, interval, limit }
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Lỗi gọi API Binance Klines:', error);
    res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu biểu đồ nến' });
  }
};

// [GET] Kéo dữ liệu Vĩ mô từ CoinGecko (Giữ nguyên)
export const getGlobalData = async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/global');
    const data = response.data.data;
    
    res.status(200).json({ 
      success: true, 
      data: {
        marketCap: data.total_market_cap.usd,
        marketCapChange: data.market_cap_change_percentage_24h_usd,
        btcDominance: data.market_cap_percentage.btc
      } 
    });
  } catch (error) {
    console.error('Lỗi gọi API CoinGecko:', error);
    res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu vĩ mô toàn cầu' });
  }
};