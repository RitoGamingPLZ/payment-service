import prisma from '../lib/prisma.js';
import stripe_service from '../services/stripe_service.js';
import { create_audit_log } from '../services/audit_service.js';

export class WebhookController {
  async handle_stripe_webhook(req, res) {
    const sig = req.headers['stripe-signature'];
    
    try {
      const event = stripe_service.construct_webhook_event(req.body, sig);
      
      console.log(`Received webhook event: ${event.type}`);
      
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handle_invoice_payment_succeeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handle_invoice_payment_failed(event.data.object);
          break;
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handle_subscription_updated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handle_subscription_deleted(event.data.object);
          break;
        
        case 'payment_intent.succeeded':
          await this.handle_payment_intent_succeeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handle_payment_intent_failed(event.data.object);
          break;
        
        case 'charge.refunded':
          await this.handle_charge_refunded(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }

  async handle_invoice_payment_succeeded(invoice) {
    try {
      if (invoice.subscription) {
        const subscription = await prisma.subscription.findUnique({
          where: { stripe_subscription_id: invoice.subscription },
          include: { app: true }
        });
        
        if (subscription) {
          await create_audit_log({
            app_id: subscription.app_id,
            actor_id: 'stripe_webhook',
            action_type: 'INVOICE_PAYMENT_SUCCEEDED',
            target_type: 'subscription',
            target_id: subscription.id,
            payload_snapshot: invoice
          });
        }
      }
    } catch (error) {
      console.error('Handle invoice payment succeeded error:', error);
    }
  }

  async handle_invoice_payment_failed(invoice) {
    try {
      if (invoice.subscription) {
        const subscription = await prisma.subscription.findUnique({
          where: { stripe_subscription_id: invoice.subscription },
          include: { app: true, customer: true }
        });
        
        if (subscription) {
          await prisma.gracePeriod.create({
            data: {
              app_id: subscription.app_id,
              customer_id: subscription.customer_id,
              reason: 'payment_failed',
              start_date: new Date(),
              end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              metadata: { invoice_id: invoice.id }
            }
          });
          
          await create_audit_log({
            app_id: subscription.app_id,
            actor_id: 'stripe_webhook',
            action_type: 'INVOICE_PAYMENT_FAILED',
            target_type: 'subscription',
            target_id: subscription.id,
            payload_snapshot: invoice
          });
        }
      }
    } catch (error) {
      console.error('Handle invoice payment failed error:', error);
    }
  }

  async handle_subscription_updated(stripe_subscription) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { stripe_subscription_id: stripe_subscription.id },
        include: { app: true }
      });
      
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: stripe_subscription.status,
            current_period_start: new Date(stripe_subscription.current_period_start * 1000),
            current_period_end: new Date(stripe_subscription.current_period_end * 1000),
            cancel_at_period_end: stripe_subscription.cancel_at_period_end,
            trial_start: stripe_subscription.trial_start ? new Date(stripe_subscription.trial_start * 1000) : null,
            trial_end: stripe_subscription.trial_end ? new Date(stripe_subscription.trial_end * 1000) : null
          }
        });
        
        await create_audit_log({
          app_id: subscription.app_id,
          actor_id: 'stripe_webhook',
          action_type: 'SUBSCRIPTION_UPDATED',
          target_type: 'subscription',
          target_id: subscription.id,
          payload_snapshot: stripe_subscription
        });
      }
    } catch (error) {
      console.error('Handle subscription updated error:', error);
    }
  }

  async handle_subscription_deleted(stripe_subscription) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { stripe_subscription_id: stripe_subscription.id },
        include: { app: true }
      });
      
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'canceled' }
        });
        
        await create_audit_log({
          app_id: subscription.app_id,
          actor_id: 'stripe_webhook',
          action_type: 'SUBSCRIPTION_DELETED',
          target_type: 'subscription',
          target_id: subscription.id,
          payload_snapshot: stripe_subscription
        });
      }
    } catch (error) {
      console.error('Handle subscription deleted error:', error);
    }
  }

  async handle_payment_intent_succeeded(payment_intent) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { stripe_payment_id: payment_intent.id },
        include: { app: true }
      });
      
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'succeeded' }
        });
        
        await create_audit_log({
          app_id: payment.app_id,
          actor_id: 'stripe_webhook',
          action_type: 'PAYMENT_SUCCEEDED',
          target_type: 'payment',
          target_id: payment.id,
          payload_snapshot: payment_intent
        });
      }
    } catch (error) {
      console.error('Handle payment intent succeeded error:', error);
    }
  }

  async handle_payment_intent_failed(payment_intent) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { stripe_payment_id: payment_intent.id },
        include: { app: true, customer: true }
      });
      
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' }
        });
        
        await prisma.gracePeriod.create({
          data: {
            app_id: payment.app_id,
            customer_id: payment.customer_id,
            reason: 'payment_failed',
            start_date: new Date(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            metadata: { payment_intent_id: payment_intent.id }
          }
        });
        
        await create_audit_log({
          app_id: payment.app_id,
          actor_id: 'stripe_webhook',
          action_type: 'PAYMENT_FAILED',
          target_type: 'payment',
          target_id: payment.id,
          payload_snapshot: payment_intent
        });
      }
    } catch (error) {
      console.error('Handle payment intent failed error:', error);
    }
  }

  async handle_charge_refunded(charge) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { stripe_payment_id: charge.payment_intent },
        include: { app: true }
      });
      
      if (payment) {
        await create_audit_log({
          app_id: payment.app_id,
          actor_id: 'stripe_webhook',
          action_type: 'CHARGE_REFUNDED',
          target_type: 'payment',
          target_id: payment.id,
          payload_snapshot: charge
        });
      }
    } catch (error) {
      console.error('Handle charge refunded error:', error);
    }
  }
}

export default new WebhookController();