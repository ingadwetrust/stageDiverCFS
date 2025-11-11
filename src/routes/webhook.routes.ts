import { Router } from 'express';
import { stripeWebhook } from '../controllers/webhook.controller';

const router = Router();

// Stripe webhook - no auth middleware, raw body needed
router.post('/stripe', stripeWebhook);

export default router;

