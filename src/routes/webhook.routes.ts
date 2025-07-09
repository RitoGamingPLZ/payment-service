import express from 'express';
import webhook_controller from '../controllers/webhook.controller.js';
import { stripe_webhook_auth, webhook_security_headers } from '../middleware/webhook-auth.middleware.js';

const router = express.Router();

// Apply security headers to all webhook routes
router.use(webhook_security_headers);

// Stripe webhook endpoint with authentication and signature verification
router.post('/stripe', 
  express.raw({ type: 'application/json' }), // Stripe requires raw body
  stripe_webhook_auth, // Custom authentication middleware
  webhook_controller.handle_stripe_webhook
);

export default router;