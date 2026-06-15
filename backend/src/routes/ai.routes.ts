import express from 'express';
import { getMarketSentiment, getPortfolioInsight } from '../controllers/ai.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Chỉ ai có token đăng nhập mới được gọi API này
router.get('/insight', verifyToken, getPortfolioInsight);
// AI 2: Phân tích tâm lý thị trường (FinBERT - Dành cho mọi user)
router.get('/sentiment', verifyToken, getMarketSentiment);

export default router;