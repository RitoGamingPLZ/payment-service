import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit.service.js';

interface CreateUsageData {
  customer_id: string;
  metric_name: string;
  quantity: number;
  subscription_id?: string;
  quota_plan_id?: string;
  timestamp?: Date;
  period_start?: Date;
  period_end?: Date;
  carried_over_from_period?: string;
  metadata?: Record<string, any>;
}

interface GetUsageOptions {
  limit?: number;
  offset?: number;
  customer_id?: string;
  metric_name?: string;
  subscription_id?: string;
  quota_plan_id?: string;
  start_date?: string;
  end_date?: string;
  period_start?: string;
  period_end?: string;
}

export class UsageService {
  async create_usage(app_id: string, usage_data: CreateUsageData) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: usage_data.customer_id, app_id }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      if (usage_data.subscription_id) {
        const subscription = await prisma.subscription.findFirst({
          where: { id: usage_data.subscription_id, app_id }
        });
        
        if (!subscription) {
          throw new Error('Subscription not found');
        }
      }
      
      if (usage_data.quota_plan_id) {
        const quota_plan = await prisma.quotaPlan.findFirst({
          where: { id: usage_data.quota_plan_id, app_id }
        });
        
        if (!quota_plan) {
          throw new Error('Quota plan not found');
        }
      }
      
      const usage = await prisma.usage.create({
        data: {
          app_id,
          customer_id: usage_data.customer_id,
          subscription_id: usage_data.subscription_id,
          quota_plan_id: usage_data.quota_plan_id,
          metric_name: usage_data.metric_name,
          quantity: usage_data.quantity,
          timestamp: usage_data.timestamp ? new Date(usage_data.timestamp) : new Date(),
          period_start: usage_data.period_start ? new Date(usage_data.period_start) : undefined,
          period_end: usage_data.period_end ? new Date(usage_data.period_end) : undefined,
          carried_over_from_period: usage_data.carried_over_from_period,
          metadata: usage_data.metadata
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'CREATE_USAGE',
        target_type: 'usage',
        target_id: usage.id,
        payload_snapshot: usage
      });
      
      return usage;
    } catch (error) {
      console.error('Usage service create usage error:', error);
      throw error;
    }
  }

  async create_batch_usage(app_id: string, records: CreateUsageData[]) {
    try {
      const customer_ids = [...new Set(records.map(r => r.customer_id))];
      const customers = await prisma.customer.findMany({
        where: { id: { in: customer_ids }, app_id }
      });
      
      if (customers.length !== customer_ids.length) {
        throw new Error('One or more customers not found');
      }
      
      const usage_records = records.map(record => {
        const data: any = {
          app_id,
          customer_id: record.customer_id,
          metric_name: record.metric_name,
          quantity: record.quantity,
          timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
        };
        
        if (record.subscription_id) data.subscription_id = record.subscription_id;
        if (record.quota_plan_id) data.quota_plan_id = record.quota_plan_id;
        if (record.period_start) data.period_start = new Date(record.period_start);
        if (record.period_end) data.period_end = new Date(record.period_end);
        if (record.carried_over_from_period) data.carried_over_from_period = record.carried_over_from_period;
        if (record.metadata) data.metadata = record.metadata;
        
        return data;
      });
      
      const created_records = await prisma.usage.createMany({
        data: usage_records
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'BATCH_CREATE_USAGE',
        target_type: 'usage',
        target_id: 'batch',
        payload_snapshot: { count: created_records.count, records: usage_records }
      });
      
      return { 
        message: `Created ${created_records.count} usage records`,
        count: created_records.count
      };
    } catch (error) {
      console.error('Usage service batch create error:', error);
      throw error;
    }
  }

  async get_usage(app_id: string, options: GetUsageOptions = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        customer_id, 
        metric_name, 
        subscription_id,
        quota_plan_id,
        start_date,
        end_date,
        period_start,
        period_end
      } = options;
      
      const where: any = { app_id };
      
      if (customer_id) {
        where.customer_id = customer_id;
      }
      if (metric_name) {
        where.metric_name = metric_name;
      }
      if (subscription_id) {
        where.subscription_id = subscription_id;
      }
      if (quota_plan_id) {
        where.quota_plan_id = quota_plan_id;
      }
      if (start_date || end_date) {
        where.timestamp = {};
        if (start_date) {
          where.timestamp.gte = new Date(start_date);
        }
        if (end_date) {
          where.timestamp.lte = new Date(end_date);
        }
      }
      if (period_start || period_end) {
        where.period_start = {};
        if (period_start) {
          where.period_start.gte = new Date(period_start);
        }
        if (period_end) {
          where.period_end = {};
          where.period_end.lte = new Date(period_end);
        }
      }
      
      return await prisma.usage.findMany({
        where,
        skip: parseInt(offset.toString()),
        take: parseInt(limit.toString()),
        orderBy: { timestamp: 'desc' },
        include: {
          customer: {
            select: { id: true, email: true, name: true }
          },
          subscription: {
            select: { id: true, stripe_subscription_id: true, status: true }
          },
          quota_plan: {
            select: { id: true, name: true, billing_type: true }
          }
        }
      });
    } catch (error) {
      console.error('Usage service get usage error:', error);
      throw error;
    }
  }

  async get_usage_summary(app_id: string, options: GetUsageOptions = {}) {
    try {
      const { 
        customer_id, 
        metric_name, 
        subscription_id,
        quota_plan_id,
        start_date,
        end_date,
        period_start,
        period_end
      } = options;
      
      const where: any = { app_id };
      
      if (customer_id) {
        where.customer_id = customer_id;
      }
      if (metric_name) {
        where.metric_name = metric_name;
      }
      if (subscription_id) {
        where.subscription_id = subscription_id;
      }
      if (quota_plan_id) {
        where.quota_plan_id = quota_plan_id;
      }
      if (start_date || end_date) {
        where.timestamp = {};
        if (start_date) {
          where.timestamp.gte = new Date(start_date);
        }
        if (end_date) {
          where.timestamp.lte = new Date(end_date);
        }
      }
      if (period_start && period_end) {
        where.period_start = new Date(period_start);
        where.period_end = new Date(period_end);
      }
      
      const usage_records = await prisma.usage.findMany({
        where,
        orderBy: { timestamp: 'desc' }
      });
      
      const summary = usage_records.reduce((acc, record) => {
        const key = record.metric_name;
        if (!acc[key]) {
          acc[key] = {
            metric_name: key,
            total_quantity: 0,
            record_count: 0,
            first_usage: record.timestamp,
            last_usage: record.timestamp,
            carry_over_quantity: 0
          };
        }
        
        if (record.quantity < 0) {
          // Negative quantity indicates carry-over
          acc[key].carry_over_quantity += Math.abs(record.quantity);
        } else {
          acc[key].total_quantity += record.quantity;
        }
        
        acc[key].record_count += 1;
        
        if (record.timestamp < acc[key].first_usage) {
          acc[key].first_usage = record.timestamp;
        }
        if (record.timestamp > acc[key].last_usage) {
          acc[key].last_usage = record.timestamp;
        }
        
        return acc;
      }, {} as any);
      
      return Object.values(summary);
    } catch (error) {
      console.error('Usage service get summary error:', error);
      throw error;
    }
  }

  async get_usage_for_period(app_id: string, customer_id: string, metric_name: string, period_start: string, period_end: string) {
    try {
      const result = await prisma.usage.aggregate({
        where: {
          app_id,
          customer_id,
          metric_name,
          period_start: new Date(period_start),
          period_end: new Date(period_end)
        },
        _sum: {
          quantity: true
        }
      });
      
      return result._sum.quantity || 0;
    } catch (error) {
      console.error('Usage service get usage for period error:', error);
      throw error;
    }
  }

  async create_carry_over_usage(app_id: string, customer_id: string, metric_name: string, carry_over_quantity: number, new_period_start: string, new_period_end: string, previous_period_id: string) {
    try {
      const carry_over_usage = await prisma.usage.create({
        data: {
          app_id,
          customer_id,
          metric_name,
          quantity: -carry_over_quantity,
          timestamp: new Date(),
          period_start: new Date(new_period_start),
          period_end: new Date(new_period_end),
          carried_over_from_period: previous_period_id,
          metadata: {
            type: 'carry_over',
            original_period: previous_period_id
          }
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: 'system',
        action_type: 'CREATE_CARRY_OVER_USAGE',
        target_type: 'usage',
        target_id: carry_over_usage.id,
        payload_snapshot: carry_over_usage
      });
      
      return carry_over_usage;
    } catch (error) {
      console.error('Usage service create carry-over error:', error);
      throw error;
    }
  }
}

export default new UsageService();