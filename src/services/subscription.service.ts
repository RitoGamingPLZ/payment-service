import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit.service.js';
import stripe_service from './stripe.service.js';

interface CreateSubscriptionData {
  customer_id: string;
  price_id: string;
  quantity?: number;
  trial_period_days?: number;
  quota_plan_id?: string;
  metadata?: Record<string, any>;
}

interface UpdateSubscriptionData {
  price_id?: string;
  quantity?: number;
  quota_plan_id?: string;
  metadata?: Record<string, any>;
}

interface GetSubscriptionsOptions {
  limit?: number;
  offset?: number;
  customer_id?: string;
  status?: string;
}

export class SubscriptionService {
  async create_subscription(app_id: string, subscription_data: CreateSubscriptionData) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: subscription_data.customer_id, app_id }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const stripe_subscription = await stripe_service.create_subscription(
        customer.stripe_customer_id,
        subscription_data.price_id,
        subscription_data.trial_period_days
      );
      
      // Validate quota plan if provided
      if (subscription_data.quota_plan_id) {
        const quota_plan = await prisma.quotaPlan.findFirst({
          where: { id: subscription_data.quota_plan_id, app_id }
        });
        
        if (!quota_plan) {
          throw new Error('Quota plan not found');
        }
      }

      const subscription = await prisma.subscription.create({
        data: {
          app_id,
          customer_id: subscription_data.customer_id,
          stripe_subscription_id: stripe_subscription.id,
          status: stripe_subscription.status,
          price_id: subscription_data.price_id,
          quantity: subscription_data.quantity || 1,
          quota_plan_id: subscription_data.quota_plan_id,
          trial_start: stripe_subscription.trial_start ? new Date(stripe_subscription.trial_start * 1000) : null,
          trial_end: stripe_subscription.trial_end ? new Date(stripe_subscription.trial_end * 1000) : null,
          current_period_start: new Date(stripe_subscription.current_period_start * 1000),
          current_period_end: new Date(stripe_subscription.current_period_end * 1000),
          metadata: subscription_data.metadata
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'CREATE_SUBSCRIPTION',
        target_type: 'subscription',
        target_id: subscription.id,
        payload_snapshot: subscription
      });
      
      return subscription;
    } catch (error) {
      console.error('Subscription service create error:', error);
      throw error;
    }
  }

  async get_subscriptions(app_id: string, options: GetSubscriptionsOptions = {}) {
    try {
      const { limit = 50, offset = 0, customer_id, status } = options;
      
      const where: any = { app_id };
      if (customer_id) {
        where.customer_id = customer_id;
      }
      if (status) {
        where.status = status;
      }
      
      return await prisma.subscription.findMany({
        where,
        skip: parseInt(offset.toString()),
        take: parseInt(limit.toString()),
        orderBy: { created_at: 'desc' },
        include: {
          customer: {
            select: { id: true, email: true, name: true }
          },
          quota_plan: {
            select: { id: true, name: true, billing_type: true, quotas: true, overage_rates: true }
          }
        }
      });
    } catch (error) {
      console.error('Subscription service get subscriptions error:', error);
      throw error;
    }
  }

  async get_subscription_by_id(app_id: string, subscription_id: string) {
    try {
      return await prisma.subscription.findFirst({
        where: { id: subscription_id, app_id },
        include: {
          customer: {
            select: { id: true, email: true, name: true }
          },
          quota_plan: {
            select: { id: true, name: true, billing_type: true, quotas: true, overage_rates: true, carry_over: true, max_carry_over: true }
          },
          payments: true,
          usage: true
        }
      });
    } catch (error) {
      console.error('Subscription service get subscription error:', error);
      throw error;
    }
  }

  async update_subscription(app_id: string, subscription_id: string, update_data: UpdateSubscriptionData) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { id: subscription_id, app_id }
      });
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      const stripe_updates: any = {};
      if (update_data.price_id) {
        stripe_updates.items = [{ id: subscription.stripe_subscription_id, price: update_data.price_id }];
      }
      if (update_data.quantity) {
        stripe_updates.quantity = update_data.quantity;
      }
      if (update_data.metadata) {
        stripe_updates.metadata = update_data.metadata;
      }
      
      if (Object.keys(stripe_updates).length > 0) {
        await stripe_service.update_subscription(subscription.stripe_subscription_id, stripe_updates);
      }
      
      // Validate quota plan if provided
      if (update_data.quota_plan_id) {
        const quota_plan = await prisma.quotaPlan.findFirst({
          where: { id: update_data.quota_plan_id, app_id }
        });
        
        if (!quota_plan) {
          throw new Error('Quota plan not found');
        }
      }

      const updated_subscription = await prisma.subscription.update({
        where: { id: subscription_id },
        data: {
          price_id: update_data.price_id || subscription.price_id,
          quantity: update_data.quantity || subscription.quantity,
          quota_plan_id: update_data.quota_plan_id !== undefined ? update_data.quota_plan_id : subscription.quota_plan_id,
          metadata: update_data.metadata || subscription.metadata
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'UPDATE_SUBSCRIPTION',
        target_type: 'subscription',
        target_id: subscription_id,
        payload_snapshot: updated_subscription
      });
      
      return updated_subscription;
    } catch (error) {
      console.error('Subscription service update error:', error);
      throw error;
    }
  }

  async cancel_subscription(app_id: string, subscription_id: string, cancel_at_period_end: boolean = false) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { id: subscription_id, app_id }
      });
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      const canceled_subscription = await stripe_service.cancel_subscription(
        subscription.stripe_subscription_id,
        cancel_at_period_end
      );
      
      const updated_subscription = await prisma.subscription.update({
        where: { id: subscription_id },
        data: {
          status: canceled_subscription.status,
          cancel_at_period_end: canceled_subscription.cancel_at_period_end
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'CANCEL_SUBSCRIPTION',
        target_type: 'subscription',
        target_id: subscription_id,
        payload_snapshot: { cancel_at_period_end }
      });
      
      return updated_subscription;
    } catch (error) {
      console.error('Subscription service cancel error:', error);
      throw error;
    }
  }
}

export default new SubscriptionService();