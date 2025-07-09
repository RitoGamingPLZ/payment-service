import { Request, Response, NextFunction } from 'express';
import { create_audit_log } from '../services/audit.service.js';
import stripe_service from '../services/stripe.service.js';

// Extend the Request interface globally
declare global {
  namespace Express {
    interface Request {
      webhook_validated?: boolean;
      webhook_source?: string;
    }
  }
}

export const stripe_webhook_auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const user_agent = req.headers['user-agent'] as string;
    const forwarded_for = req.headers['x-forwarded-for'] as string;
    const real_ip = req.headers['x-real-ip'] as string;
    
    // Validate Stripe signature is present
    if (!sig) {
      await create_audit_log({
        app_id: 'stripe_webhook_system',
        actor_id: 'unknown',
        action_type: 'webhook_auth_failed',
        target_type: 'webhook',
        target_id: 'unknown',
        payload_snapshot: {
          reason: 'missing_signature',
          user_agent,
          forwarded_for,
          real_ip
        }
      });
      return res.status(401).json({ error: 'Missing Stripe signature' });
    }

    // Validate User-Agent contains Stripe
    if (!user_agent || !user_agent.includes('Stripe')) {
      await create_audit_log({
        app_id: 'stripe_webhook_system',
        actor_id: 'unknown',
        action_type: 'webhook_auth_failed',
        target_type: 'webhook',
        target_id: 'unknown',
        payload_snapshot: {
          reason: 'invalid_user_agent',
          user_agent,
          forwarded_for,
          real_ip
        }
      });
      return res.status(401).json({ error: 'Invalid user agent' });
    }

    // Get IP for logging purposes
    const ip = real_ip || forwarded_for?.split(',')[0] || req.ip;

    // Validate content type
    const content_type = req.headers['content-type'];
    if (!content_type || !content_type.includes('application/json')) {
      await create_audit_log({
        app_id: 'stripe_webhook_system',
        actor_id: 'unknown',
        action_type: 'webhook_auth_failed',
        target_type: 'webhook',
        target_id: 'unknown',
        payload_snapshot: {
          reason: 'invalid_content_type',
          content_type,
          user_agent
        }
      });
      return res.status(400).json({ error: 'Invalid content type' });
    }

    // Verify Stripe signature
    const is_valid_signature = await stripe_service.validate_webhook_signature(req.body, sig);
    if (!is_valid_signature) {
      await create_audit_log({
        app_id: 'stripe_webhook_system',
        actor_id: 'unknown',
        action_type: 'webhook_signature_invalid',
        target_type: 'webhook',
        target_id: 'unknown',
        payload_snapshot: {
          reason: 'invalid_signature',
          ip,
          user_agent,
          content_type
        }
      });
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Mark request as validated
    req.webhook_validated = true;
    req.webhook_source = 'stripe';

    // Log successful webhook authentication
    await create_audit_log({
      app_id: 'stripe_webhook_system',
      actor_id: 'stripe_webhook',
      action_type: 'webhook_auth_success',
      target_type: 'webhook',
      target_id: 'authenticated',
      payload_snapshot: {
        ip,
        user_agent,
        content_type,
        signature_verified: true
      }
    });

    next();
  } catch (error) {
    console.error('Webhook authentication error:', error);
    
    await create_audit_log({
      app_id: 'stripe_webhook_system',
      actor_id: 'unknown',
      action_type: 'webhook_auth_error',
      target_type: 'webhook',
      target_id: 'unknown',
      payload_snapshot: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    return res.status(500).json({ error: 'Webhook authentication failed' });
  }
};

// Security headers middleware for webhooks
export const webhook_security_headers = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Remove potentially revealing headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

