import express from 'express';
import { addTransaction, getTransactions } from '../controllers/transaction.controller';
// IMPORT middleware bảo mật của bạn (File này bạn đã làm ở phần Auth)
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Tất cả các API liên quan đến tiền nong/giao dịch đều phải có 'protect' (bắt buộc phải có Token mới được gọi)
router.post('/', verifyToken, addTransaction);
router.get('/', verifyToken, getTransactions);

export default router;