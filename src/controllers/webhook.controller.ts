import { Request, Response } from 'express';
import webhook_service from '../services/webhook.service.js';
import { create_audit_log } from '../services/audit.service.js';

export class WebhookController {
  async handle_stripe_webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    const event_id = req.headers['stripe-event-id'] as string;
    
    // Signature validation is now handled by middleware
    // req.webhook_validated should be true if we reach here
    
    try {
      const result = await webhook_service.process_stripe_webhook(req.body, sig);
      
      if (result.message) {
        return res.status(200).json({ received: true, message: result.message });
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook controller error:', error);
      
      // Log failed webhook processing at controller level
      await create_audit_log({
        app_id: 'stripe_webhook_system',
        actor_id: 'stripe_webhook',
        action_type: 'webhook_controller_failed',
        target_type: 'webhook',
        target_id: event_id || 'unknown',
        payload_snapshot: {
          error: error instanceof Error ? error.message : 'Unknown error',
          webhook_validated: req.webhook_validated || false
        }
      });
      
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}

export default new WebhookController();