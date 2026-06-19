import { Request, Response } from 'express';
import axios from 'axios';

/**
 * @desc    Fetch the top 10 USDT trading pairs from Binance sorted by 24h quote volume
 * @route   GET /market/tickers
 * @access  Public
 */
export const getTickers = async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://api4.binance.com/api/v3/ticker/24hr');

    const usdtPairs = response.data
      .filter((c: any) => c.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 10);

    res.status(200).json({ success: true, data: usdtPairs });
  } catch (error) {
    console.error('Binance Ticker API error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch market data.' });
  }
};

/**
 * @desc    Proxy Binance klines (OHLCV candlestick) data for a given symbol, interval, and limit
 * @route   GET /market/klines?symbol=BTCUSDT&interval=1d&limit=7
 * @access  Public
 */
export const getKlines = async (req: Request, res: Response) => {
  try {
    const { symbol, interval = '1d', limit = 100 } = req.query;

    const response = await axios.get('https://api4.binance.com/api/v3/klines', {
      params: { symbol, interval, limit }
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Binance Klines API error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch candlestick data.' });
  }
};

/**
 * @desc    Fetch global crypto market data from CoinGecko — total market cap, 24h change, BTC dominance
 * @route   GET /market/global
 * @access  Public
 */
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
    console.error('CoinGecko API error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global market data.' });
  }
};
