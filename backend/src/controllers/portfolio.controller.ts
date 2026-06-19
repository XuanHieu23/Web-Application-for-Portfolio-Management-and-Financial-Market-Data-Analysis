import { Request, Response } from 'express';
import Portfolio from '../models/portfolio.model';
import Transaction from '../models/transaction.model';

/**
 * @desc    Execute a BUY or SELL trade — upserts the holding with recalculated average price
 *          and creates a transaction record. Returns 400 if selling more than available quantity.
 * @route   POST /portfolio/trade
 * @access  Private
 */
export const trade = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { coinSymbol, type, quantity, price } = req.body;

    if (!coinSymbol || !type || !quantity || !price) {
      res.status(400).json({ success: false, message: 'Missing transaction details!' });
      return;
    }

    if (!['BUY', 'SELL'].includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid transaction type. Must be BUY or SELL.' });
      return;
    }

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

    const newTx = new Transaction({
      userId,
      coinSymbol: coinSymbol.toUpperCase(),
      type,
      quantity: Number(quantity),
      price: Number(price)
    });
    await newTx.save();

    await portfolioItem!.save();
    res.status(201).json({ success: true, message: 'Trade executed!' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Return all holdings with quantity > 0 for the authenticated user,
 *          formatted as { symbol, amount, avgPrice }
 * @route   GET /portfolio/summary
 * @access  Private
 */
export const getPortfolioSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

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

/**
 * @desc    Return all transaction history for the authenticated user, sorted by newest first
 * @route   GET /portfolio/transactions
 * @access  Private
 */
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
