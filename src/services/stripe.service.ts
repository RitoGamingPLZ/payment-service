import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class StripeService {
  async create_customer(email: string, name?: string, metadata: Record<string, any> = {}) {
    try {
      return await stripe.customers.create({
        email,
        name,
        metadata
      });
    } catch (error) {
      console.error('Stripe create customer error:', error);
      throw error;
    }
  }

  async update_customer(customer_id: string, update_data: Stripe.CustomerUpdateParams) {
    try {
      return await stripe.customers.update(customer_id, update_data);
    } catch (error) {
      console.error('Stripe update customer error:', error);
      throw error;
    }
  }

  async delete_customer(customer_id: string) {
    try {
      return await stripe.customers.del(customer_id);
    } catch (error) {
      console.error('Stripe delete customer error:', error);
      throw error;
    }
  }

  async create_payment_intent(amount: number, currency: string, customer_id: string, description?: string, metadata: Record<string, any> = {}) {
    try {
      return await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customer_id,
        description,
        metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });
    } catch (error) {
      console.error('Stripe create payment intent error:', error);
      throw error;
    }
  }

  async confirm_payment_intent(payment_intent_id: string, payment_method?: string) {
    try {
      return await stripe.paymentIntents.confirm(payment_intent_id, {
        payment_method
      });
    } catch (error) {
      console.error('Stripe confirm payment intent error:', error);
      throw error;
    }
  }

  async refund_payment(payment_intent_id: string, amount?: number, reason?: string) {
    try {
      return await stripe.refunds.create({
        payment_intent: payment_intent_id,
        amount,
        reason: reason as Stripe.RefundCreateParams.Reason
      });
    } catch (error) {
      console.error('Stripe refund payment error:', error);
      throw error;
    }
  }

  async create_subscription(customer_id: string, price_id: string, trial_period_days?: number) {
    try {
      const subscription_data: Stripe.SubscriptionCreateParams = {
        customer: customer_id,
        items: [{ price: price_id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      };

      if (trial_period_days) {
        subscription_data.trial_period_days = trial_period_days;
      }

      return await stripe.subscriptions.create(subscription_data);
    } catch (error) {
      console.error('Stripe create subscription error:', error);
      throw error;
    }
  }

  async update_subscription(subscription_id: string, update_data: Stripe.SubscriptionUpdateParams) {
    try {
      return await stripe.subscriptions.update(subscription_id, update_data);
    } catch (error) {
      console.error('Stripe update subscription error:', error);
      throw error;
    }
  }

  async cancel_subscription(subscription_id: string, cancel_at_period_end: boolean = false) {
    try {
      if (cancel_at_period_end) {
        return await stripe.subscriptions.update(subscription_id, {
          cancel_at_period_end: true
        });
      } else {
        return await stripe.subscriptions.cancel(subscription_id);
      }
    } catch (error) {
      console.error('Stripe cancel subscription error:', error);
      throw error;
    }
  }

  async get_subscription(subscription_id: string) {
    try {
      return await stripe.subscriptions.retrieve(subscription_id);
    } catch (error) {
      console.error('Stripe get subscription error:', error);
      throw error;
    }
  }

  async construct_webhook_event(payload: any, signature: string) {
    try {
      const webhook_secret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhook_secret) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
      }
      
      // Validate signature and construct event
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhook_secret
      );
      
      // Additional validation: check event timestamp to prevent replay attacks
      const event_timestamp = event.created;
      const current_timestamp = Math.floor(Date.now() / 1000);
      const max_age = 300; // 5 minutes
      
      if (current_timestamp - event_timestamp > max_age) {
        throw new Error('Webhook event timestamp is too old');
      }
      
      return event;
    } catch (error) {
      console.error('Stripe construct webhook event error:', error);
      throw error;
    }
  }
  
  async validate_webhook_signature(payload: any, signature: string): Promise<boolean> {
    try {
      await this.construct_webhook_event(payload, signature);
      return true;
    } catch (error) {
      return false;
    }
  }

  async create_price(product_id: string, unit_amount: number, currency: string, recurring?: { interval: string }) {
    try {
      const price_data: Stripe.PriceCreateParams = {
        product: product_id,
        unit_amount,
        currency
      };

      if (recurring) {
        price_data.recurring = {
          interval: recurring.interval as Stripe.PriceCreateParams.Recurring.Interval
        };
      }

      return await stripe.prices.create(price_data);
    } catch (error) {
      console.error('Stripe create price error:', error);
      throw error;
    }
  }

  async create_product(name: string, description?: string, metadata: Record<string, any> = {}) {
    try {
      return await stripe.products.create({
        name,
        description,
        metadata
      });
    } catch (error) {
      console.error('Stripe create product error:', error);
      throw error;
    }
  }
}

export default new StripeService();