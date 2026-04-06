import { Request, Response } from 'express';
import axios from 'axios';

// [GET] Kéo dữ liệu Ticker 24h (Bảng xếp hạng)
export const getTickers = async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://data-api.binance.vision/api/v3/ticker/24hr');
    
    // TỐI ƯU: Backend lọc luôn dữ liệu, chỉ gửi đúng 10 đồng coin xuống Frontend cho nhẹ
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
    
    const response = await axios.get('https://data-api.binance.vision/api/v3/klines', {
      params: { symbol, interval, limit }
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Lỗi gọi API Binance Klines:', error);
    res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu biểu đồ nến' });
  }
};