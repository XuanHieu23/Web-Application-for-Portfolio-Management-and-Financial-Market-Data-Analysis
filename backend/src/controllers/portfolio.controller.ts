import { Response } from 'express';
import Portfolio from '../models/portfolio.model';
import Transaction from '../models/transaction.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// 1. API Giao dịch (MUA / BÁN)
export const trade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id; // Lấy ID của user từ Token
    const { coinSymbol, type, quantity, price } = req.body;

    // Validate dữ liệu đầu vào
    if (!coinSymbol || !type || !quantity || !price) {
      res.status(400).json({ message: 'Vui lòng cung cấp đủ thông tin giao dịch!' });
      return;
    }

    // BƯỚC A: Lưu biên lai vào bảng Transaction (Lịch sử không bao giờ bị xóa)
    const newTx = new Transaction({ userId, coinSymbol, type, quantity, price });
    await newTx.save();

    // BƯỚC B: Cập nhật lại Ví (Portfolio)
    let portfolioItem = await Portfolio.findOne({ userId, coinSymbol });

    if (type === 'BUY') {
      if (!portfolioItem) {
        // Nếu user chưa từng mua coin này -> Tạo mới Ví cho coin này
        portfolioItem = new Portfolio({ 
          userId, 
          coinSymbol, 
          quantity, 
          avgPurchasePrice: price 
        });
      } else {
        // CÔNG THỨC TÀI CHÍNH TÍNH GIÁ TRUNG BÌNH KHI MUA THÊM (DCA - Dollar Cost Averaging)
        const oldTotalValue = portfolioItem.quantity * portfolioItem.avgPurchasePrice;
        const newTotalValue = quantity * price;
        const newTotalQty = portfolioItem.quantity + quantity;
        
        portfolioItem.avgPurchasePrice = (oldTotalValue + newTotalValue) / newTotalQty;
        portfolioItem.quantity = newTotalQty;
      }
    } 
    else if (type === 'SELL') {
      // Kiểm tra xem user có đủ coin để bán không
      if (!portfolioItem || portfolioItem.quantity < quantity) {
        res.status(400).json({ message: 'Số dư không đủ để thực hiện lệnh Bán!' });
        return;
      }
      
      // Bán thì chỉ trừ số lượng coin đi, giá vốn trung bình (avgPurchasePrice) GIỮ NGUYÊN
      portfolioItem.quantity -= quantity;
    }

    if (portfolioItem) {
      await portfolioItem.save();
      res.status(200).json({ 
        message: 'Giao dịch thành công!', 
        portfolio: portfolioItem 
      });
    } else {
      res.status(500).json({ message: 'Lỗi không thể tạo Ví' });
    }

  } catch (error) {
    console.error('Lỗi khi Trade:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. API Lấy Danh sách Ví tài sản của User
export const getPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id;
    // Tìm tất cả coin mà user này đang giữ (số lượng > 0)
    const portfolio = await Portfolio.find({ userId, quantity: { $gt: 0 } });
    res.status(200).json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. API Lấy Lịch sử giao dịch
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id;
    // Tìm lịch sử và sắp xếp theo thời gian mới nhất (thằng nào mới mua thì lên đầu)
    const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};