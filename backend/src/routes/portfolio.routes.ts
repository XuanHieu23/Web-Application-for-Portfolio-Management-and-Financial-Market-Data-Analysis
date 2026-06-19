import express from 'express';
import { trade, getPortfolioSummary, getTransactions } from '../controllers/portfolio.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @desc    Execute a BUY or SELL trade, update holding and record the transaction
 * @route   POST /portfolio/trade
 * @access  Private
 */
router.post('/trade', verifyToken, trade);

/**
 * @desc    Get the authenticated user's current holdings (symbol, amount, avgPrice)
 * @route   GET /portfolio/summary
 * @access  Private
 */
router.get('/summary', verifyToken, getPortfolioSummary);

/**
 * @desc    Get the authenticated user's full transaction history
 * @route   GET /portfolio/transactions
 * @access  Private
 */
router.get('/transactions', verifyToken, getTransactions);

export default router;
