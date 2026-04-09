import { Response } from 'express';
import Portfolio from '../models/portfolio.model';
import Transaction from '../models/transaction.model';
import { AuthRequest } from '../middlewares/auth.middleware'; 

// 1. API Giao dịch (MUA / BÁN) -> /api/portfolio/trade
export const trade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?._id; 
    const { coinSymbol, type, quantity, price } = req.body;

    if (!coinSymbol || !type || !quantity || !price) {
      res.status(400).json({ success: false, message: 'Please provide all required transaction details!' });
      return;
    }

    // A. Lưu lịch sử giao dịch
    const newTx = new Transaction({ 
      userId, 
      coinSymbol: coinSymbol.toUpperCase(), 
      type, 
      quantity: Number(quantity), 
      price: Number(price) 
    });
    await newTx.save();

    // B. Cập nhật Ví (Portfolio) kèm thuật toán DCA
    let portfolioItem = await Portfolio.findOne({ userId, coinSymbol: coinSymbol.toUpperCase() });

    if (type === 'BUY') {
      if (!portfolioItem) {
        portfolioItem = new Portfolio({ 
          userId, 
          coinSymbol: coinSymbol.toUpperCase(), 
          quantity: Number(quantity), 
          avgPurchasePrice: Number(price) 
        });
      } else {
        const oldTotalValue = portfolioItem.quantity * portfolioItem.avgPurchasePrice;
        const newTotalValue = Number(quantity) * Number(price);
        const newTotalQty = portfolioItem.quantity + Number(quantity);
        
        portfolioItem.avgPurchasePrice = (oldTotalValue + newTotalValue) / newTotalQty;
        portfolioItem.quantity = newTotalQty;
      }
    } 
    else if (type === 'SELL') {
      if (!portfolioItem || portfolioItem.quantity < Number(quantity)) {
        res.status(400).json({ success: false, message: 'Insufficient balance to execute SELL order!' });
        return;
      }
      portfolioItem.quantity -= Number(quantity);
    }

    if (portfolioItem) {
      await portfolioItem.save();
    }

    res.status(201).json({ success: true, message: 'Transaction executed successfully!' });

  } catch (error) {
    console.error('Lỗi khi Trade:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 2. API Lấy Bảng Tổng Hợp Ví (Đã cộng trừ DCA sẵn cho Frontend) -> /api/portfolio/summary
export const getPortfolioSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?._id;
    // Tìm coin user đang giữ (số lượng > 0)
    const portfolio = await Portfolio.find({ userId, quantity: { $gt: 0 } });
    
    // Map data lại để Frontend dễ đọc (giống với interface Holding)
    const formattedData = portfolio.map(item => ({
      symbol: item.coinSymbol,
      amount: item.quantity,
      avgPrice: item.avgPurchasePrice
    }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching portfolio summary' });
  }
};

// 3. API Lấy Lịch sử giao dịch -> /api/portfolio/transactions
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching history' });
  }
};