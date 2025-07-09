import Stripe from 'stripe';
import stripe_service from './stripe.service.js';
import payment_service from './payment.service.js';
import { create_audit_log } from './audit.service.js';

export class WebhookService {
  private processed_events = new Set<string>();

  async process_stripe_webhook(payload: any, signature: string) {
    const event = await stripe_service.construct_webhook_event(payload, signature);
    
    // Idempotency check - prevent processing the same event twice
    if (this.processed_events.has(event.id)) {
      return { success: true, message: 'Event already processed' };
    }

    // Log webhook event for audit trail
    await create_audit_log({
      app_id: 'stripe_webhook_system',
      actor_id: 'stripe_webhook',
      action_type: 'webhook_received',
      target_type: 'webhook',
      target_id: event.id,
      payload_snapshot: {
        event_type: event.type,
        api_version: event.api_version,
        created: event.created,
        livemode: event.livemode
      }
    });

    console.log(`Processing webhook event: ${event.type} (ID: ${event.id})`);
    
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handle_payment_intent_succeeded(event.data.object as Stripe.PaymentIntent, event.id);
          break;
        case 'payment_intent.payment_failed':
          await this.handle_payment_intent_failed(event.data.object as Stripe.PaymentIntent, event.id);
          break;
        case 'invoice.payment_succeeded':
          await this.handle_invoice_payment_succeeded(event.data.object as Stripe.Invoice, event.id);
          break;
        case 'invoice.payment_failed':
          await this.handle_invoice_payment_failed(event.data.object as Stripe.Invoice, event.id);
          break;
        case 'customer.subscription.created':
          await this.handle_subscription_created(event.data.object as Stripe.Subscription, event.id);
          break;
        case 'customer.subscription.updated':
          await this.handle_subscription_updated(event.data.object as Stripe.Subscription, event.id);
          break;
        case 'customer.subscription.deleted':
          await this.handle_subscription_deleted(event.data.object as Stripe.Subscription, event.id);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
          await create_audit_log({
            app_id: 'stripe_webhook_system',
            actor_id: 'stripe_webhook',
            action_type: 'webhook_unhandled',
            target_type: 'webhook',
            target_id: event.id,
            payload_snapshot: {
              event_type: event.type,
              message: 'Unhandled webhook event type'
            }
          });
      }
      
      // Mark event as processed
      this.processed_events.add(event.id);
      
      // Clean up old processed events (keep last 1000)
      if (this.processed_events.size > 1000) {
        const events_array = Array.from(this.processed_events);
        const events_to_remove = events_array.slice(0, events_array.length - 1000);
        events_to_remove.forEach(event_id => this.processed_events.delete(event_id));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error processing webhook event:', error);
      
      await create_audit_log({
        app_id: 'stripe_webhook_system',
        actor_id: 'stripe_webhook',
        action_type: 'webhook_processing_failed',
        target_type: 'webhook',
        target_id: event.id,
        payload_snapshot: {
          event_type: event.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      throw error;
    }
  }

  private async handle_payment_intent_succeeded(payment_intent: Stripe.PaymentIntent, event_id: string) {
    try {
      await payment_service.update_payment_from_webhook(
        payment_intent.id,
        'succeeded',
        payment_intent.metadata
      );
      
      await create_audit_log({
        app_id: payment_intent.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'payment_intent_succeeded',
        target_type: 'payment_intent',
        target_id: payment_intent.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          amount: payment_intent.amount,
          currency: payment_intent.currency,
          customer: payment_intent.customer,
          metadata: payment_intent.metadata
        }
      });
      
      console.log(`Payment intent succeeded: ${payment_intent.id}`);
    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
      await create_audit_log({
        app_id: payment_intent.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'payment_intent_succeeded_failed',
        target_type: 'payment_intent',
        target_id: payment_intent.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  private async handle_payment_intent_failed(payment_intent: Stripe.PaymentIntent, event_id: string) {
    try {
      await payment_service.update_payment_from_webhook(
        payment_intent.id,
        'failed',
        payment_intent.metadata
      );
      
      await create_audit_log({
        app_id: payment_intent.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'payment_intent_failed',
        target_type: 'payment_intent',
        target_id: payment_intent.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          amount: payment_intent.amount,
          currency: payment_intent.currency,
          customer: payment_intent.customer,
          last_payment_error: payment_intent.last_payment_error,
          metadata: payment_intent.metadata
        }
      });
      
      console.log(`Payment intent failed: ${payment_intent.id}`);
    } catch (error) {
      console.error('Error handling payment intent failed:', error);
      await create_audit_log({
        app_id: payment_intent.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'payment_intent_failed_processing_failed',
        target_type: 'payment_intent',
        target_id: payment_intent.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  private async handle_invoice_payment_succeeded(invoice: Stripe.Invoice, event_id: string) {
    try {
      await create_audit_log({
        app_id: invoice.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'invoice_payment_succeeded',
        target_type: 'invoice',
        target_id: invoice.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          customer: invoice.customer,
          subscription: invoice.subscription,
          billing_reason: invoice.billing_reason
        }
      });
      
      console.log(`Invoice payment succeeded: ${invoice.id}`);
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
      await create_audit_log({
        app_id: invoice.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'invoice_payment_succeeded_failed',
        target_type: 'invoice',
        target_id: invoice.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  private async handle_invoice_payment_failed(invoice: Stripe.Invoice, event_id: string) {
    try {
      await create_audit_log({
        app_id: invoice.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'invoice_payment_failed',
        target_type: 'invoice',
        target_id: invoice.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
          customer: invoice.customer,
          subscription: invoice.subscription,
          billing_reason: invoice.billing_reason,
          attempt_count: invoice.attempt_count
        }
      });
      
      console.log(`Invoice payment failed: ${invoice.id}`);
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
      await create_audit_log({
        app_id: invoice.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'invoice_payment_failed_processing_failed',
        target_type: 'invoice',
        target_id: invoice.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  private async handle_subscription_created(subscription: Stripe.Subscription, event_id: string) {
    try {
      await create_audit_log({
        app_id: subscription.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'subscription_created',
        target_type: 'subscription',
        target_id: subscription.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          items: subscription.items.data.map(item => ({
            price: item.price.id,
            quantity: item.quantity
          }))
        }
      });
      
      console.log(`Subscription created: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription created:', error);
      await create_audit_log({
        app_id: subscription.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'subscription_created_failed',
        target_type: 'subscription',
        target_id: subscription.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  private async handle_subscription_updated(subscription: Stripe.Subscription, event_id: string) {
    try {
      await create_audit_log({
        app_id: subscription.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'subscription_updated',
        target_type: 'subscription',
        target_id: subscription.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          items: subscription.items.data.map(item => ({
            price: item.price.id,
            quantity: item.quantity
          }))
        }
      });
      
      console.log(`Subscription updated: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      await create_audit_log({
        app_id: subscription.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'subscription_updated_failed',
        target_type: 'subscription',
        target_id: subscription.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  private async handle_subscription_deleted(subscription: Stripe.Subscription, event_id: string) {
    try {
      await create_audit_log({
        app_id: subscription.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'subscription_deleted',
        target_type: 'subscription',
        target_id: subscription.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          customer: subscription.customer,
          status: subscription.status,
          canceled_at: subscription.canceled_at,
          ended_at: subscription.ended_at
        }
      });
      
      console.log(`Subscription deleted: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
      await create_audit_log({
        app_id: subscription.metadata?.app_id || 'unknown',
        actor_id: 'stripe_webhook',
        action_type: 'subscription_deleted_failed',
        target_type: 'subscription',
        target_id: subscription.id,
        payload_snapshot: {
          webhook_event_id: event_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }
}

export default new WebhookService();