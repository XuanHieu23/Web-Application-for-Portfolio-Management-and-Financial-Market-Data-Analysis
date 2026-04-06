import { Request, Response } from 'express';
import Transaction from '../models/transaction.model';
import Portfolio from '../models/portfolio.model';

// [POST] Thêm giao dịch mới vào Database & Cập nhật Ví Portfolio
export const addTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id || (req as any).user.id; 
    
    // ĐÃ FIX: Hứng đúng các biến Frontend gửi lên (coinSymbol, quantity)
    const { coinSymbol, type, quantity, price } = req.body;

    if (!coinSymbol || !type || !quantity || !price) {
      res.status(400).json({ success: false, message: 'Please provide all required transaction details!' });
      return;
    }

    // 1. LƯU LỊCH SỬ GIAO DỊCH (TRANSACTION)
    const newTx = new Transaction({
      userId,
      coinSymbol: coinSymbol.toUpperCase(),
      type,
      quantity: Number(quantity),
      price: Number(price)
    });
    const savedTransaction = await newTx.save();

    // 2. TỰ ĐỘNG CẬP NHẬT VÍ TÀI SẢN (PORTFOLIO) KÈM LOGIC TÍNH DCA
    let portfolioItem = await Portfolio.findOne({ userId, coinSymbol: coinSymbol.toUpperCase() });

    if (type === 'BUY') {
      if (!portfolioItem) {
        // Chưa có coin này trong ví -> Tạo mới
        portfolioItem = new Portfolio({
          userId,
          coinSymbol: coinSymbol.toUpperCase(),
          quantity: Number(quantity),
          avgPurchasePrice: Number(price)
        });
      } else {
        // Đã có coin này -> Tính giá trung bình DCA
        const oldTotalValue = portfolioItem.quantity * portfolioItem.avgPurchasePrice;
        const newTotalValue = Number(quantity) * Number(price);
        const newTotalQty = portfolioItem.quantity + Number(quantity);

        portfolioItem.avgPurchasePrice = (oldTotalValue + newTotalValue) / newTotalQty;
        portfolioItem.quantity = newTotalQty;
      }
    } else if (type === 'SELL') {
      // Logic Bán: Kiểm tra xem có đủ coin để bán không
      if (!portfolioItem || portfolioItem.quantity < Number(quantity)) {
        res.status(400).json({ success: false, message: 'Insufficient balance to execute SELL order!' });
        return;
      }
      portfolioItem.quantity -= Number(quantity);
    }

    if (portfolioItem) {
      await portfolioItem.save();
    }

    // 3. TRẢ VỀ FRONTEND (Đúng chuẩn cấu trúc response.data.success mà Frontend đang chờ)
    res.status(201).json({ 
      success: true, 
      message: 'Transaction executed successfully',
      data: savedTransaction 
    });

  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ success: false, message: 'Server error during transaction' });
  }
};

// [GET] Lấy toàn bộ lịch sử giao dịch
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id || (req as any).user.id;
    
    // Tìm các giao dịch của user này và sắp xếp thời gian mới nhất lên đầu (-1)
    // ĐÃ FIX: Dùng trường 'timestamp' cho đúng với transaction.model.ts
    const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: transactions.length,
      data: transactions 
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ success: false, message: 'Server error fetching history' });
  }
};