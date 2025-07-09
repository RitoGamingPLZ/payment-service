import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit.service.js';

interface QuotaCheckResult {
  allowed: boolean;
  current_usage: number;
  quota_limit: number;
  remaining: number;
  would_exceed: boolean;
  overage_amount: number;
  period_start: Date;
  period_end: Date;
}

export class QuotaSqlService {
  // Check quota using SQL function with transaction safety
  async check_and_consume_quota(
    app_id: string, 
    customer_id: string, 
    metric_name: string, 
    requested_quantity: number = 1,
    quota_plan_id?: string,
    metadata?: Record<string, any>
  ): Promise<{
    quota_check: QuotaCheckResult;
    usage_record: any;
    consumed: boolean;
  }> {
    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      try {
        // Find quota plan
        let quota_plan;
        if (quota_plan_id) {
          quota_plan = await tx.quotaPlan.findFirst({
            where: { id: quota_plan_id, app_id }
          });
        } else {
          const subscription = await tx.subscription.findFirst({
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

        const quotas = quota_plan.quotas as Record<string, number>;
        const quota_limit = quotas[metric_name];
        
        if (quota_limit === undefined) {
          throw new Error(`Metric ${metric_name} not found in quota plan`);
        }

        // Use SQL function to check quota within transaction
        const sql_check = await tx.$queryRaw<{can_consume: boolean}[]>`
          SELECT check_quota_limit(
            ${customer_id}::UUID,
            ${metric_name}::TEXT,
            ${requested_quantity}::INT,
            ${quota_plan.id}::UUID
          ) as can_consume
        `;

        const can_consume = sql_check[0]?.can_consume || false;

        // Get current usage for response details
        const period_boundaries = await tx.$queryRaw<{period_start: Date, period_end: Date}[]>`
          SELECT period_start, period_end 
          FROM get_current_period_boundaries(${quota_plan.reset_period})
        `;

        const { period_start, period_end } = period_boundaries[0];

        const usage_aggregate = await tx.usage.aggregate({
          where: {
            app_id,
            customer_id,
            metric_name,
            quota_plan_id: quota_plan.id,
            timestamp: {
              gte: period_start,
              lte: period_end
            }
          },
          _sum: {
            quantity: true
          }
        });

        const current_usage = usage_aggregate._sum.quantity || 0;

        const quota_check: QuotaCheckResult = {
          allowed: can_consume,
          current_usage,
          quota_limit,
          remaining: Math.max(0, quota_limit - current_usage),
          would_exceed: !can_consume,
          overage_amount: can_consume ? 0 : (current_usage + requested_quantity - quota_limit),
          period_start,
          period_end
        };

        // If quota check passes, create usage record
        let usage_record;
        if (can_consume) {
          usage_record = await tx.usage.create({
            data: {
              app_id,
              customer_id,
              quota_plan_id: quota_plan.id,
              metric_name,
              quantity: requested_quantity,
              timestamp: new Date(),
              metadata
            }
          });

          // Create audit log
          await create_audit_log({
            app_id,
            actor_id: customer_id,
            action_type: 'CONSUME_QUOTA',
            target_type: 'usage',
            target_id: usage_record.id,
            payload_snapshot: {
              metric_name,
              requested_quantity,
              quota_check: quota_check
            }
          });
        }

        return {
          quota_check,
          usage_record: usage_record || null,
          consumed: can_consume
        };

      } catch (error) {
        console.error('SQL quota check and consume error:', error);
        throw error;
      }
    });
  }

  // Check quota without consuming (read-only)
  async check_quota_only(
    app_id: string, 
    customer_id: string, 
    metric_name: string, 
    requested_quantity: number = 1,
    quota_plan_id?: string
  ): Promise<QuotaCheckResult> {
    try {
      // Find quota plan
      let quota_plan;
      if (quota_plan_id) {
        quota_plan = await prisma.quotaPlan.findFirst({
          where: { id: quota_plan_id, app_id }
        });
      } else {
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

      const quotas = quota_plan.quotas as Record<string, number>;
      const quota_limit = quotas[metric_name];
      
      if (quota_limit === undefined) {
        throw new Error(`Metric ${metric_name} not found in quota plan`);
      }

      // Use SQL function to check quota
      const sql_check = await prisma.$queryRaw<{can_consume: boolean}[]>`
        SELECT check_quota_limit(
          ${customer_id}::UUID,
          ${metric_name}::TEXT,
          ${requested_quantity}::INT,
          ${quota_plan.id}::UUID
        ) as can_consume
      `;

      const can_consume = sql_check[0]?.can_consume || false;

      // Get current usage for response details
      const period_boundaries = await prisma.$queryRaw<{period_start: Date, period_end: Date}[]>`
        SELECT period_start, period_end 
        FROM get_current_period_boundaries(${quota_plan.reset_period})
      `;

      const { period_start, period_end } = period_boundaries[0];

      const usage_aggregate = await prisma.usage.aggregate({
        where: {
          app_id,
          customer_id,
          metric_name,
          quota_plan_id: quota_plan.id,
          timestamp: {
            gte: period_start,
            lte: period_end
          }
        },
        _sum: {
          quantity: true
        }
      });

      const current_usage = usage_aggregate._sum.quantity || 0;

      return {
        allowed: can_consume,
        current_usage,
        quota_limit,
        remaining: Math.max(0, quota_limit - current_usage),
        would_exceed: !can_consume,
        overage_amount: can_consume ? 0 : (current_usage + requested_quantity - quota_limit),
        period_start,
        period_end
      };

    } catch (error) {
      console.error('SQL quota check error:', error);
      throw error;
    }
  }

  // Batch quota check and consume
  async batch_check_and_consume_quota(
    app_id: string,
    customer_id: string,
    items: Array<{
      metric_name: string;
      requested_quantity: number;
      metadata?: Record<string, any>;
    }>,
    quota_plan_id?: string
  ): Promise<{
    all_allowed: boolean;
    results: Array<{
      metric_name: string;
      quota_check: QuotaCheckResult;
      usage_record: any;
      consumed: boolean;
    }>;
  }> {
    // Use a transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      const results: Array<{
        metric_name: string;
        quota_check: QuotaCheckResult;
        usage_record: any;
        consumed: boolean;
      }> = [];
      let all_allowed = true;

      // First, check all quotas
      for (const item of items) {
        const check_result = await this.check_quota_only(
          app_id,
          customer_id,
          item.metric_name,
          item.requested_quantity,
          quota_plan_id
        );

        if (!check_result.allowed) {
          all_allowed = false;
        }

        results.push({
          metric_name: item.metric_name,
          quota_check: check_result,
          usage_record: null,
          consumed: false
        });
      }

      // If all checks pass, consume all quotas
      if (all_allowed) {
        // Find quota plan
        let quota_plan;
        if (quota_plan_id) {
          quota_plan = await tx.quotaPlan.findFirst({
            where: { id: quota_plan_id, app_id }
          });
        } else {
          const subscription = await tx.subscription.findFirst({
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

        // Create usage records for all items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const usage_record = await tx.usage.create({
            data: {
              app_id,
              customer_id,
              quota_plan_id: quota_plan.id,
              metric_name: item.metric_name,
              quantity: item.requested_quantity,
              timestamp: new Date(),
              metadata: item.metadata
            }
          });

          results[i].usage_record = usage_record;
          results[i].consumed = true;
        }

        // Create audit log for batch consumption
        await create_audit_log({
          app_id,
          actor_id: customer_id,
          action_type: 'BATCH_CONSUME_QUOTA',
          target_type: 'usage',
          target_id: 'batch',
          payload_snapshot: {
            items,
            results: results.map(r => ({
              metric_name: r.metric_name,
              consumed: r.consumed,
              usage_id: r.usage_record?.id
            }))
          }
        });
      }

      return {
        all_allowed,
        results
      };
    });
  }

  // Get effective quota limit (including carry-over)
  async get_effective_quota_limit(
    app_id: string,
    customer_id: string,
    metric_name: string,
    quota_plan_id?: string
  ): Promise<number> {
    try {
      // Find quota plan
      let quota_plan;
      if (quota_plan_id) {
        quota_plan = await prisma.quotaPlan.findFirst({
          where: { id: quota_plan_id, app_id }
        });
      } else {
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

      const sql_result = await prisma.$queryRaw<{effective_limit: number}[]>`
        SELECT get_effective_quota_limit(
          ${customer_id}::UUID,
          ${metric_name}::TEXT,
          ${quota_plan.id}::UUID
        ) as effective_limit
      `;

      return sql_result[0]?.effective_limit || 0;

    } catch (error) {
      console.error('Get effective quota limit error:', error);
      throw error;
    }
  }
}

export default new QuotaSqlService();