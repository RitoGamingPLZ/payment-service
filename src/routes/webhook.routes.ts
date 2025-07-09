import express from 'express';
import webhook_controller from '../controllers/webhook.controller.js';

const router = express.Router();

// Stripe webhook endpoint - no authentication required
router.post('/stripe', 
  express.raw({ type: 'application/json' }), // Stripe requires raw body
  webhook_controller.handle_stripe_webhook
);

export default router;