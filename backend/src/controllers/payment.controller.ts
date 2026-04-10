import { Response } from 'express';
import Stripe from 'stripe';
import { AuthRequest } from '../middlewares/auth.middleware'; // Đảm bảo đường dẫn đúng với middleware của bạn

// Khởi tạo Stripe với Secret Key từ file .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-03-25.dahlia', // Phiên bản API của Stripe
});

export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id || (req.user as any)?._id;

    // Tạo một phiên thanh toán (Checkout Session) trên Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // Chế độ thu phí hàng tháng
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'KINETIC PRO Subscription',
              description: 'Unlock KINETIC AI Oracle and Advanced Market Sentiment (Powered by Groq & FinBERT)',
            },
            unit_amount: 1500, // 1500 cents = $15.00 / tháng
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId.toString(), // NHỚ KỸ: Gắn ID của user vào đây để lát nữa Stripe báo về mình còn biết ai vừa trả tiền
      },
      // Chuyển hướng người dùng về lại Frontend sau khi thanh toán xong hoặc hủy
      success_url: `http://localhost:5173/dashboard?payment=success`,
      cancel_url: `http://localhost:5173/dashboard?payment=cancelled`,
    });

    // Trả cái link thanh toán của Stripe về cho Frontend
    res.status(200).json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('Lỗi khi tạo Checkout Session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};