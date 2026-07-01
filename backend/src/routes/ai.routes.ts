import express from 'express';
import { getMarketSentiment, getPortfolioInsight } from '../controllers/ai.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @desc    Analyze the user's portfolio and return investment suggestions via Groq AI
 * @route   GET /ai/insight
 * @access  Private (PRO only)
 */
router.get('/insight', verifyToken, getPortfolioInsight);

/**
 * @desc    Analyze overall crypto market sentiment from latest news via Groq AI
 * @route   GET /ai/sentiment
 * @access  Private (all authenticated users)
 */
router.get('/sentiment', verifyToken, getMarketSentiment);

export default router;
