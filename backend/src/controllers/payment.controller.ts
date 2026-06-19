import { Request, Response } from 'express';
import Stripe from 'stripe';
import User from '../models/user.model';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2026-03-25.dahlia' });

/**
 * @desc    Create a Stripe Checkout session for the POMAFINA PRO monthly subscription ($15/mo).
 *          Embeds the userId in session metadata so the webhook can upgrade the account on success.
 * @route   POST /payment/create-checkout-session
 * @access  Private
 */
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
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
          unit_amount: 1500,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      metadata: { userId },
      success_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancelled`,
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Handle incoming Stripe webhook events. Verifies the Stripe signature,
 *          then on `checkout.session.completed` upgrades the matching user to PRO tier.
 * @route   POST /payment/webhook
 * @access  Public (Stripe signature verified internally)
 */
export const webhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ [STRIPE] STRIPE_WEBHOOK_SECRET is not configured in .env');
    res.status(500).json({ error: 'Webhook secret not configured on server.' });
    return;
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ [STRIPE] Webhook signature verification failed:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { userId?: string } };
    const userId = session.metadata?.userId;

    console.log(`\n✅ [WEBHOOK EVENT] Payment notification received from Stripe!`);
    console.log(`👉 Processing for User ID: ${userId}`);

    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { tier: 'PRO' });
        console.log(`🚀 [SYSTEM] Account ${userId} successfully upgraded to POMAFINA PRO.\n`);
      } catch (err) {
        console.error(`❌ [SYSTEM] Failed to upgrade account ${userId}:`, err);
      }
    } else {
      console.log(`❌ [WEBHOOK ERROR] Payment succeeded but no userId found in session metadata!\n`);
    }
  }

  res.status(200).json({ received: true });
};
