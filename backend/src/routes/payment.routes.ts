import express from 'express';
import { createCheckoutSession, webhook } from '../controllers/payment.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @desc    Create a Stripe Checkout session to upgrade to PRO plan
 * @route   POST /payment/create-checkout-session
 * @access  Private
 */
router.post('/create-checkout-session', verifyToken, createCheckoutSession);

/**
 * @desc    Receive and handle Stripe webhook events (e.g. checkout.session.completed)
 * @route   POST /payment/webhook
 * @access  Public (Stripe signature verified internally)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

export default router;
