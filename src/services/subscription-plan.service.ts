import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit.service.js';

interface CreateSubscriptionPlanData {
  name: string;
  description?: string;
  slug: string;
  base_price: number;
  currency?: string;
  billing_period: string;
  stripe_price_id?: string;
  stripe_product_id?: string;
  quota_plan_id?: string;
  trial_days?: number;
  setup_fee?: number;
  is_popular?: boolean;
  is_featured?: boolean;
  display_order?: number;
  metadata?: Record<string, any>;
}

interface UpdateSubscriptionPlanData {
  name?: string;
  description?: string;
  slug?: string;
  base_price?: number;
  currency?: string;
  billing_period?: string;
  stripe_price_id?: string;
  stripe_product_id?: string;
  quota_plan_id?: string;
  trial_days?: number;
  setup_fee?: number;
  is_popular?: boolean;
  is_featured?: boolean;
  display_order?: number;
  is_active?: boolean;
  is_public?: boolean;
  metadata?: Record<string, any>;
}

interface GetSubscriptionPlansOptions {
  limit?: number;
  offset?: number;
  is_public?: boolean;
  is_active?: boolean;
  billing_period?: string;
}

export class SubscriptionPlanService {
  async create_subscription_plan(app_id: string, plan_data: CreateSubscriptionPlanData) {
    try {
      // Check if slug is unique within the app
      const existing_plan = await prisma.subscriptionPlan.findFirst({
        where: { app_id, slug: plan_data.slug }
      });
      
      if (existing_plan) {
        throw new Error('A plan with this slug already exists');
      }
      
      // Validate quota plan if provided
      if (plan_data.quota_plan_id) {
        const quota_plan = await prisma.quotaPlan.findFirst({
          where: { id: plan_data.quota_plan_id, app_id }
        });
        
        if (!quota_plan) {
          throw new Error('Quota plan not found');
        }
      }

      const subscription_plan = await prisma.subscriptionPlan.create({
        data: {
          app_id,
          name: plan_data.name,
          description: plan_data.description,
          slug: plan_data.slug,
          base_price: plan_data.base_price,
          currency: plan_data.currency || 'usd',
          billing_period: plan_data.billing_period,
          stripe_price_id: plan_data.stripe_price_id,
          stripe_product_id: plan_data.stripe_product_id,
          quota_plan_id: plan_data.quota_plan_id,
          trial_days: plan_data.trial_days,
          setup_fee: plan_data.setup_fee,
          is_popular: plan_data.is_popular || false,
          is_featured: plan_data.is_featured || false,
          display_order: plan_data.display_order || 0,
          metadata: plan_data.metadata || {}
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'CREATE_SUBSCRIPTION_PLAN',
        target_type: 'subscription_plan',
        target_id: subscription_plan.id,
        payload_snapshot: subscription_plan
      });
      
      return subscription_plan;
    } catch (error) {
      console.error('Subscription plan service create error:', error);
      throw error;
    }
  }

  async get_subscription_plans(app_id: string, options: GetSubscriptionPlansOptions = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        is_public, 
        is_active, 
        billing_period 
      } = options;
      
      const where: any = { app_id };
      
      if (is_public !== undefined) {
        where.is_public = is_public;
      }
      if (is_active !== undefined) {
        where.is_active = is_active;
      }
      if (billing_period) {
        where.billing_period = billing_period;
      }
      
      return await prisma.subscriptionPlan.findMany({
        where,
        skip: parseInt(offset.toString()),
        take: parseInt(limit.toString()),
        orderBy: [
          { display_order: 'asc' },
          { created_at: 'desc' }
        ],
        include: {
          quota_plan: {
            select: { 
              id: true, 
              name: true, 
              quotas: true, 
              billing_type: true,
              reset_period: true 
            }
          },
          _count: {
            select: { subscriptions: true }
          }
        }
      });
    } catch (error) {
      console.error('Subscription plan service get plans error:', error);
      throw error;
    }
  }

  async get_public_plans(app_id: string, billing_period?: string) {
    try {
      const where: any = { 
        app_id,
        is_public: true,
        is_active: true
      };
      
      if (billing_period) {
        where.billing_period = billing_period;
      }
      
      return await prisma.subscriptionPlan.findMany({
        where,
        orderBy: [
          { is_featured: 'desc' },
          { display_order: 'asc' },
          { base_price: 'asc' }
        ],
        include: {
          quota_plan: {
            select: { 
              id: true, 
              name: true, 
              quotas: true, 
              reset_period: true 
            }
          }
        }
      });
    } catch (error) {
      console.error('Subscription plan service get public plans error:', error);
      throw error;
    }
  }

  async get_subscription_plan_by_id(app_id: string, plan_id: string) {
    try {
      return await prisma.subscriptionPlan.findFirst({
        where: { id: plan_id, app_id },
        include: {
          quota_plan: true,
          _count: {
            select: { subscriptions: true }
          }
        }
      });
    } catch (error) {
      console.error('Subscription plan service get plan error:', error);
      throw error;
    }
  }

  async get_subscription_plan_by_slug(app_id: string, slug: string) {
    try {
      return await prisma.subscriptionPlan.findFirst({
        where: { app_id, slug, is_public: true, is_active: true },
        include: {
          quota_plan: {
            select: { 
              id: true, 
              name: true, 
              quotas: true, 
              reset_period: true 
            }
          }
        }
      });
    } catch (error) {
      console.error('Subscription plan service get plan by slug error:', error);
      throw error;
    }
  }

  async update_subscription_plan(app_id: string, plan_id: string, update_data: UpdateSubscriptionPlanData) {
    try {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { id: plan_id, app_id }
      });
      
      if (!plan) {
        throw new Error('Subscription plan not found');
      }
      
      // Check slug uniqueness if updating slug
      if (update_data.slug && update_data.slug !== plan.slug) {
        const existing_plan = await prisma.subscriptionPlan.findFirst({
          where: { app_id, slug: update_data.slug, id: { not: plan_id } }
        });
        
        if (existing_plan) {
          throw new Error('A plan with this slug already exists');
        }
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

      const updated_plan = await prisma.subscriptionPlan.update({
        where: { id: plan_id },
        data: update_data
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'UPDATE_SUBSCRIPTION_PLAN',
        target_type: 'subscription_plan',
        target_id: plan_id,
        payload_snapshot: updated_plan
      });
      
      return updated_plan;
    } catch (error) {
      console.error('Subscription plan service update error:', error);
      throw error;
    }
  }

  async delete_subscription_plan(app_id: string, plan_id: string) {
    try {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { id: plan_id, app_id },
        include: {
          _count: {
            select: { subscriptions: true }
          }
        }
      });
      
      if (!plan) {
        throw new Error('Subscription plan not found');
      }
      
      // Don't allow deletion if there are active subscriptions
      if (plan._count.subscriptions > 0) {
        throw new Error('Cannot delete plan with active subscriptions');
      }

      await prisma.subscriptionPlan.delete({
        where: { id: plan_id }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'DELETE_SUBSCRIPTION_PLAN',
        target_type: 'subscription_plan',
        target_id: plan_id,
        payload_snapshot: { deleted_plan: plan.name }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Subscription plan service delete error:', error);
      throw error;
    }
  }
}

export default new SubscriptionPlanService();