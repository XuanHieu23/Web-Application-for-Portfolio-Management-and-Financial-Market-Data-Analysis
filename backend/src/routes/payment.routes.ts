import express from 'express';
import { createCheckoutSession, webhook } from '../controllers/payment.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

// User gọi để lấy link thanh toán (Phải đăng nhập)
router.post('/create-checkout-session', verifyToken, createCheckoutSession);

// Stripe gọi để báo thanh toán thành công (Bắt buộc dùng express.raw)
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

export default router;