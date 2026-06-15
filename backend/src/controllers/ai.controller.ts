import { Request, Response } from 'express';
import Portfolio from '../models/portfolio.model';
import Groq from 'groq-sdk';
import axios from 'axios';

// KHỞI TẠO GROQ Ở PHẠM VI TOÀN CỤC ĐỂ DÙNG CHUNG CHO CẢ 2 API
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });

// ========================================================
// [GET] API 1: Phân tích danh mục đầu tư bằng Groq AI (Giữ nguyên)
// ========================================================
export const getPortfolioInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = req.user; 

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
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    res.status(200).json({ success: true, insight: chatCompletion.choices[0]?.message?.content });

  } catch (error: any) {
    console.error("Pomafina Groq AI Error:", error);
    res.status(500).json({ success: false, message: "POMAFINA AI is temporarily offline." });
  }
};

// ========================================================
// [GET] API 2: Phân tích tâm lý vĩ mô - ĐÃ ĐỒNG BỘ CHUYỂN SANG GROQ
// ========================================================
export const getMarketSentiment = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Kéo tin tức real-time từ CoinTelegraph RSS
    const newsResponse = await axios.get('https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss');
    
    if (newsResponse.data?.status !== 'ok' || !Array.isArray(newsResponse.data?.items)) {
      throw new Error("Lỗi nguồn cấp tin từ CoinTelegraph.");
    }

    const headlines = newsResponse.data.items.slice(0, 5).map((item: any) => item.title);

    const prompt = `
      You are a professional crypto market analyst. Analyze these 5 recent news headlines:
      ${JSON.stringify(headlines)}

      Return ONLY a valid JSON object with this exact structure:
      {
        "fearAndGreedIndex": <number between 0 to 100 based on overall sentiment>,
        "status": "<FEAR or GREED or NEUTRAL>",
        "newsAnalysis": [
          {
            "title": "<headline>",
            "sentiment": "<BULLISH or BEARISH or NEUTRAL>",
            "confidence": "<percentage string, e.g., 85%>"
          }
        ]
      }
    `;

    // 2. Gọi trực tiếp qua Groq Cloud - Không qua trung gian OpenRouter nữa
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1, // Giảm tối đa độ sáng tạo để AI bám sát cấu trúc dữ liệu
      // Kích hoạt chế độ Native JSON Mode của Groq để đảm bảo đầu ra luôn sạch
      response_format: { type: "json_object" } 
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';
    const aiData = JSON.parse(responseText);

    // 3. Trả về cấu hình sạch cho Frontend hiển thị đồng hồ
    res.status(200).json({
      success: true,
      data: aiData
    });

  } catch (error: any) {
    console.error("❌ Groq Sentiment AI Error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Hệ thống phân tích vĩ mô đang bảo trì, vui lòng thử lại sau." 
    });
  }
};