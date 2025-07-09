import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit_service.js';

export class QuotaService {
  // Create a quota plan for an app
  async create_quota_plan(app_id, plan_data) {
    try {
      const quota_plan = await prisma.quotaPlan.create({
        data: {
          app_id,
          name: plan_data.name,
          description: plan_data.description,
          billing_type: plan_data.billing_type, // "subscription", "usage", "hybrid"
          quotas: plan_data.quotas, // { "api_calls": 1000, "storage_gb": 5 }
          overage_rates: plan_data.overage_rates, // { "api_calls": 0.001, "storage_gb": 0.10 }
          reset_period: plan_data.reset_period || 'monthly',
          carry_over: plan_data.carry_over || false,
          max_carry_over: plan_data.max_carry_over || 0
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'CREATE_QUOTA_PLAN',
        target_type: 'quota_plan',
        target_id: quota_plan.id,
        payload_snapshot: quota_plan
      });
      
      return quota_plan;
    } catch (error) {
      console.error('Quota service create plan error:', error);
      throw error;
    }
  }

  // Get current period boundaries for a quota plan
  get_current_period(reset_period) {
    const now = new Date();
    const period_start = new Date();
    const period_end = new Date();
    
    switch (reset_period) {
      case 'monthly':
        period_start.setDate(1);
        period_start.setHours(0, 0, 0, 0);
        period_end.setMonth(period_end.getMonth() + 1);
        period_end.setDate(1);
        period_end.setHours(0, 0, 0, 0);
        break;
      case 'yearly':
        period_start.setMonth(0, 1);
        period_start.setHours(0, 0, 0, 0);
        period_end.setFullYear(period_end.getFullYear() + 1);
        period_end.setMonth(0, 1);
        period_end.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        const day_of_week = now.getDay();
        period_start.setDate(now.getDate() - day_of_week);
        period_start.setHours(0, 0, 0, 0);
        period_end.setDate(period_start.getDate() + 7);
        period_end.setHours(0, 0, 0, 0);
        break;
      case 'daily':
        period_start.setHours(0, 0, 0, 0);
        period_end.setDate(period_end.getDate() + 1);
        period_end.setHours(0, 0, 0, 0);
        break;
      case 'none':
        period_start.setFullYear(2000, 0, 1);
        period_end.setFullYear(2100, 0, 1);
        break;
      default:
        period_start.setDate(1);
        period_start.setHours(0, 0, 0, 0);
        period_end.setMonth(period_end.getMonth() + 1);
        period_end.setDate(1);
        period_end.setHours(0, 0, 0, 0);
    }
    
    return { period_start, period_end };
  }

  // Check if customer is within quota limits
  async check_quota(app_id, customer_id, metric_name, requested_quantity = 1, quota_plan_id = null) {
    try {
      // Get quota plan - either from parameter or from customer's subscription
      let quota_plan;
      if (quota_plan_id) {
        quota_plan = await prisma.quotaPlan.findFirst({
          where: { id: quota_plan_id, app_id }
        });
      } else {
        // Find quota plan from customer's subscription
        const subscription = await prisma.subscription.findFirst({
          where: { 
            customer_id, 
            app_id,
            quota_plan_id: { not: null }
          },
          include: { quota_plan: true }
        });
        quota_plan = subscription?.quota_plan;
      }
      
      if (!quota_plan) {
        throw new Error('No quota plan found for customer');
      }
      
      const quota_limit = quota_plan.quotas[metric_name];
      if (quota_limit === undefined) {
        throw new Error(`Metric ${metric_name} not found in quota plan`);
      }
      
      // Get current period boundaries
      const { period_start, period_end } = this.get_current_period(quota_plan.reset_period);
      
      // Get current usage for this period by aggregating Usage records
      const usage_aggregate = await prisma.usage.aggregate({
        where: {
          app_id,
          customer_id,
          metric_name,
          quota_plan_id: quota_plan.id,
          period_start: period_start,
          period_end: period_end
        },
        _sum: {
          quantity: true
        }
      });
      
      const current_usage = usage_aggregate._sum.quantity || 0;
      const would_exceed = (current_usage + requested_quantity) > quota_limit;
      
      return {
        allowed: !would_exceed,
        current_usage,
        quota_limit,
        remaining: Math.max(0, quota_limit - current_usage),
        would_exceed,
        overage_amount: would_exceed ? (current_usage + requested_quantity - quota_limit) : 0,
        period_start,
        period_end
      };
    } catch (error) {
      console.error('Quota service check quota error:', error);
      throw error;
    }
  }

  // Get quota usage for a customer
  async get_quota_usage(app_id, customer_id, quota_plan_id = null) {
    try {
      // Get quota plan - either from parameter or from customer's subscription
      let quota_plan;
      if (quota_plan_id) {
        quota_plan = await prisma.quotaPlan.findFirst({
          where: { id: quota_plan_id, app_id }
        });
      } else {
        // Find quota plan from customer's subscription
        const subscription = await prisma.subscription.findFirst({
          where: { 
            customer_id, 
            app_id,
            quota_plan_id: { not: null }
          },
          include: { quota_plan: true }
        });
        quota_plan = subscription?.quota_plan;
      }
      
      if (!quota_plan) {
        return null;
      }
      
      // Get current period boundaries
      const { period_start, period_end } = this.get_current_period(quota_plan.reset_period);
      
      // Get usage for all metrics in the quota plan
      const usage_by_metric = {};
      const remaining_quotas = {};
      const overage_data = {};
      let is_over_quota = false;
      
      for (const metric_name of Object.keys(quota_plan.quotas)) {
        const quota_limit = quota_plan.quotas[metric_name];
        
        // Aggregate usage for this metric in current period
        const usage_aggregate = await prisma.usage.aggregate({
          where: {
            app_id,
            customer_id,
            metric_name,
            quota_plan_id: quota_plan.id,
            period_start: period_start,
            period_end: period_end
          },
          _sum: {
            quantity: true
          }
        });
        
        const current_usage = usage_aggregate._sum.quantity || 0;
        usage_by_metric[metric_name] = current_usage;
        remaining_quotas[metric_name] = Math.max(0, quota_limit - current_usage);
        
        // Calculate overage
        const overage = Math.max(0, current_usage - quota_limit);
        overage_data[metric_name] = overage;
        
        if (overage > 0) {
          is_over_quota = true;
        }
      }
      
      return {
        customer_id,
        quota_plan_id: quota_plan.id,
        quota_plan,
        period_start,
        period_end,
        usage_data: usage_by_metric,
        remaining_quotas,
        overage_data,
        is_over_quota,
        days_until_reset: Math.ceil((period_end - new Date()) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      console.error('Quota service get usage error:', error);
      throw error;
    }
  }

  // Calculate usage-based billing amount
  async calculate_usage_billing(app_id, customer_id, billing_period_start, billing_period_end, quota_plan_id = null) {
    try {
      // Get quota plan - either from parameter or from customer's subscription
      let quota_plan;
      if (quota_plan_id) {
        quota_plan = await prisma.quotaPlan.findFirst({
          where: { id: quota_plan_id, app_id }
        });
      } else {
        // Find quota plan from customer's subscription
        const subscription = await prisma.subscription.findFirst({
          where: { 
            customer_id, 
            app_id,
            quota_plan_id: { not: null }
          },
          include: { quota_plan: true }
        });
        quota_plan = subscription?.quota_plan;
      }
      
      if (!quota_plan || !quota_plan.overage_rates) {
        return { total_amount: 0, breakdown: {} };
      }
      
      const breakdown = {};
      let total_amount = 0;
      
      // Calculate overage charges for each metric
      for (const metric_name of Object.keys(quota_plan.quotas)) {
        const quota_limit = quota_plan.quotas[metric_name];
        const overage_rate = quota_plan.overage_rates[metric_name] || 0;
        
        // Get usage for this metric in billing period
        const usage_aggregate = await prisma.usage.aggregate({
          where: {
            app_id,
            customer_id,
            metric_name,
            quota_plan_id: quota_plan.id,
            timestamp: {
              gte: new Date(billing_period_start),
              lte: new Date(billing_period_end)
            }
          },
          _sum: {
            quantity: true
          }
        });
        
        const total_usage = usage_aggregate._sum.quantity || 0;
        const overage_quantity = Math.max(0, total_usage - quota_limit);
        const amount = overage_quantity * overage_rate;
        
        breakdown[metric_name] = {
          total_usage,
          quota_limit,
          overage_quantity,
          rate: overage_rate,
          amount
        };
        
        total_amount += amount;
      }
      
      return {
        total_amount,
        breakdown,
        currency: 'usd', // This should be configurable
        billing_period: {
          start: billing_period_start,
          end: billing_period_end
        }
      };
    } catch (error) {
      console.error('Quota service calculate billing error:', error);
      throw error;
    }
  }

  // Process quota carry-over for a customer
  async process_quota_carry_over(app_id, customer_id, quota_plan_id, old_period_start, old_period_end) {
    try {
      const quota_plan = await prisma.quotaPlan.findFirst({
        where: { id: quota_plan_id, app_id }
      });
      
      if (!quota_plan || !quota_plan.carry_over) {
        return { message: 'No carry-over configured for this quota plan' };
      }
      
      const { period_start: new_period_start, period_end: new_period_end } = this.get_current_period(quota_plan.reset_period);
      
      // Calculate carry-over for each metric
      for (const metric_name of Object.keys(quota_plan.quotas)) {
        const quota_limit = quota_plan.quotas[metric_name];
        
        // Get usage for previous period
        const usage_aggregate = await prisma.usage.aggregate({
          where: {
            app_id,
            customer_id,
            metric_name,
            quota_plan_id: quota_plan.id,
            period_start: new Date(old_period_start),
            period_end: new Date(old_period_end)
          },
          _sum: {
            quantity: true
          }
        });
        
        const previous_usage = usage_aggregate._sum.quantity || 0;
        const unused_quota = Math.max(0, quota_limit - previous_usage);
        
        if (unused_quota > 0) {
          // Calculate carry-over amount (respecting max_carry_over)
          const max_carry_over = quota_plan.max_carry_over || unused_quota;
          const carry_over_amount = Math.min(unused_quota, max_carry_over);
          
          // Create negative usage record for carry-over
          await prisma.usage.create({
            data: {
              app_id,
              customer_id,
              quota_plan_id,
              metric_name,
              quantity: -carry_over_amount, // Negative to add to quota
              timestamp: new Date(),
              period_start: new_period_start,
              period_end: new_period_end,
              carried_over_from_period: `${old_period_start}_${old_period_end}`,
              metadata: {
                type: 'carry_over',
                original_unused: unused_quota,
                carried_amount: carry_over_amount
              }
            }
          });
        }
      }
      
      await create_audit_log({
        app_id,
        actor_id: 'system',
        action_type: 'PROCESS_QUOTA_CARRY_OVER',
        target_type: 'quota_plan',
        target_id: quota_plan_id,
        payload_snapshot: {
          customer_id,
          old_period: { start: old_period_start, end: old_period_end },
          new_period: { start: new_period_start, end: new_period_end }
        }
      });
      
      return { message: 'Quota carry-over processed successfully' };
    } catch (error) {
      console.error('Quota service process carry-over error:', error);
      throw error;
    }
  }

  // Get quota plans for an app
  async get_quota_plans(app_id, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      return await prisma.quotaPlan.findMany({
        where: { app_id },
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      });
    } catch (error) {
      console.error('Quota service get plans error:', error);
      throw error;
    }
  }

  // Update quota plan
  async update_quota_plan(app_id, quota_plan_id, update_data) {
    try {
      const quota_plan = await prisma.quotaPlan.findFirst({
        where: { id: quota_plan_id, app_id }
      });
      
      if (!quota_plan) {
        throw new Error('Quota plan not found');
      }
      
      const updated_quota_plan = await prisma.quotaPlan.update({
        where: { id: quota_plan_id },
        data: {
          name: update_data.name || quota_plan.name,
          description: update_data.description || quota_plan.description,
          quotas: update_data.quotas || quota_plan.quotas,
          overage_rates: update_data.overage_rates || quota_plan.overage_rates,
          reset_period: update_data.reset_period || quota_plan.reset_period,
          carry_over: update_data.carry_over !== undefined ? update_data.carry_over : quota_plan.carry_over,
          max_carry_over: update_data.max_carry_over !== undefined ? update_data.max_carry_over : quota_plan.max_carry_over
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'UPDATE_QUOTA_PLAN',
        target_type: 'quota_plan',
        target_id: quota_plan_id,
        payload_snapshot: updated_quota_plan
      });
      
      return updated_quota_plan;
    } catch (error) {
      console.error('Quota service update plan error:', error);
      throw error;
    }
  }

  // Delete quota plan
  async delete_quota_plan(app_id, quota_plan_id) {
    try {
      const quota_plan = await prisma.quotaPlan.findFirst({
        where: { id: quota_plan_id, app_id }
      });
      
      if (!quota_plan) {
        throw new Error('Quota plan not found');
      }
      
      // Check if any subscriptions are using this quota plan
      const subscriptions_using_plan = await prisma.subscription.findMany({
        where: { quota_plan_id: quota_plan_id, app_id }
      });
      
      if (subscriptions_using_plan.length > 0) {
        throw new Error('Cannot delete quota plan: it is being used by active subscriptions');
      }
      
      await prisma.quotaPlan.delete({
        where: { id: quota_plan_id }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'DELETE_QUOTA_PLAN',
        target_type: 'quota_plan',
        target_id: quota_plan_id,
        payload_snapshot: quota_plan
      });
      
      return { message: 'Quota plan deleted successfully' };
    } catch (error) {
      console.error('Quota service delete plan error:', error);
      throw error;
    }
  }
}

export default new QuotaService();