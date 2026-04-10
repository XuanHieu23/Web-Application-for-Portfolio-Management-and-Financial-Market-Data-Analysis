import express from 'express';
import { trade, getPortfolioSummary, getTransactions } from '../controllers/portfolio.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/trade', verifyToken, trade);
router.get('/summary', verifyToken, getPortfolioSummary);
router.get('/transactions', verifyToken, getTransactions);

export default router;