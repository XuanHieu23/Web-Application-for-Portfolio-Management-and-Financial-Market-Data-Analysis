import { Request, Response } from 'express';
import Stripe from 'stripe';
import User from '../models/user.model';

// API 1: TẠO LINK THANH TOÁN
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2026-03-25.dahlia' });
    
    // Lấy userId an toàn 100% từ request
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: 'POMAFINA PRO Subscription',
            description: 'Unlock POMAFINA AI Oracle and Advanced Market Sentiment'
          },
          unit_amount: 1500, // $15.00
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      metadata: { userId }, // Gắn thẻ ID để Webhook nhận diện
      success_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancelled`,
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API 2: LẮNG NGHE WEBHOOK TỪ STRIPE
export const webhook = async (req: Request, res: Response): Promise<void> => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2026-03-25.dahlia' });
  const sig = req.headers['stripe-signature'] as string;
  let event: any; // Chỗ này của Stripe webhook vẫn bắt buộc để any vì thư viện chưa update kịp Type

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;

    console.log(`✅ [WEBHOOK] User ${userId} thanh toán thành công!`);
    
    if (userId) {
      await User.findByIdAndUpdate(userId, { tier: 'PRO' });
      console.log(`🚀 [SYSTEM] Đã nâng cấp tài khoản ${userId} lên POMAFINA PRO.`);
    }
  }

  res.status(200).json({ received: true });
};