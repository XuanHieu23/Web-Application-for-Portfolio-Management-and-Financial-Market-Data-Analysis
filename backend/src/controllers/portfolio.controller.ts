import { Response } from 'express';
import Portfolio from '../models/portfolio.model';
import Transaction from '../models/transaction.model';
import { AuthRequest } from '../middlewares/auth.middleware'; 

export const trade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?._id; 
    const { coinSymbol, type, quantity, price } = req.body;

    if (!coinSymbol || !type || !quantity || !price) {
      res.status(400).json({ success: false, message: 'Missing transaction details!' });
      return;
    }

    // 1. Lưu vào Lịch sử
    const newTx = new Transaction({ 
      userId, 
      coinSymbol: coinSymbol.toUpperCase(), 
      type, 
      quantity: Number(quantity), 
      price: Number(price) 
    });
    await newTx.save();

    // 2. Cập nhật Số dư Ví (DCA Logic)
    let portfolioItem = await Portfolio.findOne({ userId, coinSymbol: coinSymbol.toUpperCase() });

    if (type === 'BUY') {
      if (!portfolioItem) {
        portfolioItem = new Portfolio({ userId, coinSymbol: coinSymbol.toUpperCase(), quantity: Number(quantity), avgPurchasePrice: Number(price) });
      } else {
        const oldTotalValue = portfolioItem.quantity * portfolioItem.avgPurchasePrice;
        const newTotalValue = Number(quantity) * Number(price);
        const newTotalQty = portfolioItem.quantity + Number(quantity);
        portfolioItem.avgPurchasePrice = (oldTotalValue + newTotalValue) / newTotalQty;
        portfolioItem.quantity = newTotalQty;
      }
    } else if (type === 'SELL') {
      if (!portfolioItem || portfolioItem.quantity < Number(quantity)) {
        res.status(400).json({ success: false, message: 'Insufficient balance!' });
        return;
      }
      portfolioItem.quantity -= Number(quantity);
    }

    if (portfolioItem) await portfolioItem.save();
    res.status(201).json({ success: true, message: 'Trade executed!' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPortfolioSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const portfolio = await Portfolio.find({ userId, quantity: { $gt: 0 } });
    
    const formattedData = portfolio.map(item => ({
      symbol: item.coinSymbol,
      amount: item.quantity,
      avgPrice: item.avgPurchasePrice
    }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};