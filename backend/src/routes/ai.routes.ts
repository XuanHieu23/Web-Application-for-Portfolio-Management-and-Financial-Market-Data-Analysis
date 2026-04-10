import express from 'express';
import { getPortfolioInsight } from '../controllers/ai.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Chỉ ai có token đăng nhập mới được gọi API này
router.get('/insight', verifyToken, getPortfolioInsight);

export default router;