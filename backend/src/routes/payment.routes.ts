import express from 'express';
import { createCheckoutSession } from '../controllers/payment.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Route: POST /api/payment/create-checkout-session
// Yêu cầu: User phải đăng nhập (có token) mới được nâng cấp
router.post('/create-checkout-session', verifyToken, createCheckoutSession);

export default router;