import { Router } from 'express';
import { trade, getPortfolioSummary, getTransactions } from '../controllers/portfolio.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Gắn "Bảo vệ" verifyToken lên TOÀN BỘ các API ở dưới. 
// Ai không có token hợp lệ sẽ bị đá văng ra ngay lập tức với lỗi 401.
router.use(verifyToken);

router.post('/trade', trade);          // API: /api/portfolio/trade
router.get('/summary', getPortfolioSummary);         // API: /api/portfolio/summary
router.get('/transactions', getTransactions); // API: /api/portfolio/transactions
export default router;