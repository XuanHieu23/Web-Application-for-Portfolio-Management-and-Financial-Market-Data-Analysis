import { Request, Response } from 'express';
import Portfolio from '../models/portfolio.model';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const getPortfolioInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = req.user; // Trực tiếp lấy từ req

    // TypeScript tự hiểu currentUser có thuộc tính tier
    if (!currentUser || currentUser.tier !== 'PRO') {
      res.status(403).json({ success: false, message: 'Premium Feature. Please upgrade to POMAFINA PRO.' });
      return;
    }

    const portfolio = await Portfolio.find({ userId: currentUser.id, quantity: { $gt: 0 } });
    
    if (portfolio.length === 0) {
      res.status(200).json({ success: true, insight: "Your portfolio is empty. Add assets for analysis." });
      return;
    }

    const portfolioDetails = portfolio.map(p => `${p.quantity} ${p.coinSymbol} (Avg Buy: $${p.avgPurchasePrice.toFixed(2)})`).join(', ');

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are POMAFINA AI, an expert crypto wealth manager. Analyze the user's portfolio and give short, actionable advice under 100 words." },
        { role: "user", content: `My portfolio: ${portfolioDetails}. Assessment?` }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
    });

    res.status(200).json({ success: true, insight: chatCompletion.choices[0]?.message?.content });

  } catch (error: any) {
    console.error("Pomafina AI Error:", error);
    res.status(500).json({ success: false, message: "POMAFINA AI is temporarily offline." });
  }
};