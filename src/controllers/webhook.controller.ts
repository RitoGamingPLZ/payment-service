import { Request, Response } from 'express';
import stripe_service from '../services/stripe.service.js';
import payment_service from '../services/payment.service.js';
import { create_audit_log } from '../services/audit.service.js';
import Stripe from 'stripe';

export class WebhookController {
  async handle_stripe_webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    
    try {
      const event = await stripe_service.construct_webhook_event(req.body, sig);
      
      console.log(`Received webhook event: ${event.type}`);
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handle_payment_intent_succeeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handle_payment_intent_failed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'invoice.payment_succeeded':
          await this.handle_invoice_payment_succeeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handle_invoice_payment_failed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.created':
          await this.handle_subscription_created(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handle_subscription_updated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handle_subscription_deleted(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  }

  private async handle_payment_intent_succeeded(payment_intent: Stripe.PaymentIntent) {
    try {
      await payment_service.update_payment_from_webhook(
        payment_intent.id,
        'succeeded',
        payment_intent.metadata
      );
      
      console.log(`Payment intent succeeded: ${payment_intent.id}`);
    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
    }
  }

  private async handle_payment_intent_failed(payment_intent: Stripe.PaymentIntent) {
    try {
      await payment_service.update_payment_from_webhook(
        payment_intent.id,
        'failed',
        payment_intent.metadata
      );
      
      console.log(`Payment intent failed: ${payment_intent.id}`);
    } catch (error) {
      console.error('Error handling payment intent failed:', error);
    }
  }

  private async handle_invoice_payment_succeeded(invoice: Stripe.Invoice) {
    try {
      console.log(`Invoice payment succeeded: ${invoice.id}`);
      // Handle invoice payment success logic here
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
    }
  }

  private async handle_invoice_payment_failed(invoice: Stripe.Invoice) {
    try {
      console.log(`Invoice payment failed: ${invoice.id}`);
      // Handle invoice payment failure logic here
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
    }
  }

  private async handle_subscription_created(subscription: Stripe.Subscription) {
    try {
      console.log(`Subscription created: ${subscription.id}`);
      // Handle subscription creation logic here
    } catch (error) {
      console.error('Error handling subscription created:', error);
    }
  }

  private async handle_subscription_updated(subscription: Stripe.Subscription) {
    try {
      console.log(`Subscription updated: ${subscription.id}`);
      // Handle subscription update logic here
    } catch (error) {
      console.error('Error handling subscription updated:', error);
    }
  }

  private async handle_subscription_deleted(subscription: Stripe.Subscription) {
    try {
      console.log(`Subscription deleted: ${subscription.id}`);
      // Handle subscription deletion logic here
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
    }
  }
}

export default new WebhookController();