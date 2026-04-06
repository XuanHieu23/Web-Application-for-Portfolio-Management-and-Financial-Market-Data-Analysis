import express from 'express';
import { getTickers, getKlines } from '../controllers/market.controller';
// Lưu ý: Các API này Public, không cần dùng middleware 'protect' vì ai cũng có thể xem giá

const router = express.Router();

router.get('/tickers', getTickers);
router.get('/klines', getKlines);

export default router;