import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class StripeService {
  async create_customer(email, name, metadata = {}) {
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

  async create_subscription(customer_id, price_id, trial_period_days = null) {
    try {
      const subscription_data = {
        customer: customer_id,
        items: [{ price: price_id }],
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

  async update_subscription(subscription_id, updates) {
    try {
      return await stripe.subscriptions.update(subscription_id, updates);
    } catch (error) {
      console.error('Stripe update subscription error:', error);
      throw error;
    }
  }

  async cancel_subscription(subscription_id, at_period_end = false) {
    try {
      if (at_period_end) {
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

  async create_payment_intent(amount, currency, customer_id, metadata = {}) {
    try {
      return await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customer_id,
        metadata
      });
    } catch (error) {
      console.error('Stripe create payment intent error:', error);
      throw error;
    }
  }

  async refund_payment(payment_intent_id, amount = null) {
    try {
      const refund_data = { payment_intent: payment_intent_id };
      if (amount) {
        refund_data.amount = amount;
      }
      return await stripe.refunds.create(refund_data);
    } catch (error) {
      console.error('Stripe refund error:', error);
      throw error;
    }
  }

  async create_usage_record(subscription_item_id, quantity, timestamp = null) {
    try {
      const usage_data = {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000)
      };
      
      return await stripe.subscriptionItems.createUsageRecord(
        subscription_item_id,
        usage_data
      );
    } catch (error) {
      console.error('Stripe create usage record error:', error);
      throw error;
    }
  }

  async get_subscription(subscription_id) {
    try {
      return await stripe.subscriptions.retrieve(subscription_id);
    } catch (error) {
      console.error('Stripe get subscription error:', error);
      throw error;
    }
  }

  async get_customer(customer_id) {
    try {
      return await stripe.customers.retrieve(customer_id);
    } catch (error) {
      console.error('Stripe get customer error:', error);
      throw error;
    }
  }

  async get_payment_intent(payment_intent_id) {
    try {
      return await stripe.paymentIntents.retrieve(payment_intent_id);
    } catch (error) {
      console.error('Stripe get payment intent error:', error);
      throw error;
    }
  }

  async create_price(product_id, unit_amount, currency, recurring = null) {
    try {
      const price_data = {
        product: product_id,
        unit_amount: unit_amount,
        currency
      };

      if (recurring) {
        price_data.recurring = recurring;
      }

      return await stripe.prices.create(price_data);
    } catch (error) {
      console.error('Stripe create price error:', error);
      throw error;
    }
  }

  async create_product(name, description = null, metadata = {}) {
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

  construct_webhook_event(body, signature) {
    try {
      return stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Stripe webhook verification error:', error);
      throw error;
    }
  }
}

export default new StripeService();