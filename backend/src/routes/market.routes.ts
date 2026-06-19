import express from 'express';
import { getTickers, getKlines, getGlobalData } from '../controllers/market.controller';

const router = express.Router();

/**
 * @desc    Fetch realtime prices for all coins from Binance (lastPrice, priceChangePercent)
 * @route   GET /market/tickers
 * @access  Public
 */
router.get('/tickers', getTickers);

/**
 * @desc    Fetch OHLCV candlestick data by symbol, interval and limit
 * @route   GET /market/klines?symbol=BTCUSDT&interval=1d&limit=7
 * @access  Public
 */
router.get('/klines', getKlines);

/**
 * @desc    Fetch global crypto market overview (total market cap, BTC dominance)
 * @route   GET /market/global
 * @access  Public
 */
router.get('/global', getGlobalData);

export default router;
