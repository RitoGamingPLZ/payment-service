import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit.service.js';

export class UsageBillingService {
  async calculate_usage_billing(app_id: string, metric_name: string, usage_quantity: number, rate_per_unit: number) {
    try {
      const total_cost = usage_quantity * rate_per_unit;
      
      return {
        metric_name,
        total_usage: usage_quantity,
        rate_per_unit,
        total_cost,
        currency: 'usd'
      };
    } catch (error) {
      console.error('Usage billing service calculate billing error:', error);
      throw error;
    }
  }

  async calculate_monthly_usage_bill(app_id: string, customer_id: string, billing_month: number, billing_year: number) {
    try {
      const start_date = new Date(billing_year, billing_month - 1, 1);
      const end_date = new Date(billing_year, billing_month, 0, 23, 59, 59);
      
      const usage_records = await prisma.usage.findMany({
        where: {
          app_id,
          customer_id,
          timestamp: {
            gte: start_date,
            lte: end_date
          }
        }
      });
      
      const usage_by_metric: Record<string, number> = {};
      for (const record of usage_records) {
        if (!usage_by_metric[record.metric_name]) {
          usage_by_metric[record.metric_name] = 0;
        }
        usage_by_metric[record.metric_name] += record.quantity;
      }
      
      const billing_breakdown: Record<string, any> = {};
      let total_bill = 0;
      const default_rate = 0.001;
      
      for (const [metric_name, total_usage] of Object.entries(usage_by_metric)) {
        const metric_billing = await this.calculate_usage_billing(app_id, metric_name, total_usage, default_rate);
        billing_breakdown[metric_name] = metric_billing;
        total_bill += metric_billing.total_cost;
      }
      
      const bill = {
        app_id,
        customer_id,
        billing_period: {
          month: billing_month,
          year: billing_year,
          start_date,
          end_date
        },
        total_bill,
        currency: 'usd',
        billing_breakdown,
        raw_usage: usage_by_metric
      };
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'CALCULATE_USAGE_BILL',
        target_type: 'usage_bill',
        target_id: customer_id,
        payload_snapshot: bill
      });
      
      return bill;
    } catch (error) {
      console.error('Usage billing service calculate monthly bill error:', error);
      throw error;
    }
  }

  async generate_usage_invoice(app_id: string, customer_id: string, billing_period_start: Date, billing_period_end: Date) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: customer_id, app_id }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const usage_records = await prisma.usage.findMany({
        where: {
          app_id,
          customer_id,
          timestamp: {
            gte: billing_period_start,
            lte: billing_period_end
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      const usage_by_metric: Record<string, { total_quantity: number; records: any[] }> = {};
      for (const record of usage_records) {
        if (!usage_by_metric[record.metric_name]) {
          usage_by_metric[record.metric_name] = {
            total_quantity: 0,
            records: []
          };
        }
        usage_by_metric[record.metric_name].total_quantity += record.quantity;
        usage_by_metric[record.metric_name].records.push(record);
      }
      
      const line_items = [];
      let subtotal = 0;
      const default_rate = 0.001;
      
      for (const [metric_name, metric_data] of Object.entries(usage_by_metric)) {
        const billing = await this.calculate_usage_billing(app_id, metric_name, metric_data.total_quantity, default_rate);
        
        line_items.push({
          metric_name,
          quantity: metric_data.total_quantity,
          unit_cost: billing.rate_per_unit,
          total_cost: billing.total_cost
        });
        
        subtotal += billing.total_cost;
      }
      
      const tax_rate = 0.08;
      const tax_amount = subtotal * tax_rate;
      const total_amount = subtotal + tax_amount;
      
      const invoice = {
        invoice_id: `INV-${Date.now()}-${customer_id.slice(-6)}`,
        app_id,
        customer_id,
        customer_email: customer.email,
        customer_name: customer.name,
        billing_period: {
          start: billing_period_start,
          end: billing_period_end
        },
        line_items,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
        currency: 'usd',
        generated_at: new Date(),
        status: 'pending'
      };
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'GENERATE_USAGE_INVOICE',
        target_type: 'invoice',
        target_id: invoice.invoice_id,
        payload_snapshot: invoice
      });
      
      return invoice;
    } catch (error) {
      console.error('Usage billing service generate invoice error:', error);
      throw error;
    }
  }

  async get_usage_summary(app_id: string, customer_id: string, billing_period_start: Date, billing_period_end: Date) {
    try {
      const usage_records = await prisma.usage.findMany({
        where: {
          app_id,
          customer_id,
          timestamp: {
            gte: billing_period_start,
            lte: billing_period_end
          }
        }
      });
      
      const usage_by_metric: Record<string, any> = {};
      for (const record of usage_records) {
        if (!usage_by_metric[record.metric_name]) {
          usage_by_metric[record.metric_name] = {
            total_quantity: 0,
            record_count: 0,
            first_usage: record.timestamp,
            last_usage: record.timestamp
          };
        }
        
        usage_by_metric[record.metric_name].total_quantity += record.quantity;
        usage_by_metric[record.metric_name].record_count += 1;
        
        if (record.timestamp < usage_by_metric[record.metric_name].first_usage) {
          usage_by_metric[record.metric_name].first_usage = record.timestamp;
        }
        if (record.timestamp > usage_by_metric[record.metric_name].last_usage) {
          usage_by_metric[record.metric_name].last_usage = record.timestamp;
        }
      }
      
      return {
        app_id,
        customer_id,
        billing_period: {
          start: billing_period_start,
          end: billing_period_end
        },
        usage_by_metric,
        total_records: usage_records.length
      };
    } catch (error) {
      console.error('Usage billing service get summary error:', error);
      throw error;
    }
  }

  async calculate_overage_billing(app_id: string, customer_id: string, quota_plan_id: string, billing_period_start: Date, billing_period_end: Date) {
    try {
      const quota_plan = await prisma.quotaPlan.findFirst({
        where: { id: quota_plan_id, app_id }
      });
      
      if (!quota_plan || !quota_plan.overage_rates) {
        return { total_amount: 0, breakdown: {} };
      }
      
      const breakdown: Record<string, any> = {};
      let total_amount = 0;
      
      const quotas = quota_plan.quotas as Record<string, number>;
      const overage_rates = quota_plan.overage_rates as Record<string, number> || {};
      
      for (const metric_name of Object.keys(quotas)) {
        const quota_limit = quotas[metric_name];
        const overage_rate = overage_rates[metric_name] || 0;
        
        const usage_aggregate = await prisma.usage.aggregate({
          where: {
            app_id,
            customer_id,
            metric_name,
            quota_plan_id,
            timestamp: {
              gte: billing_period_start,
              lte: billing_period_end
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
        currency: 'usd',
        billing_period: {
          start: billing_period_start,
          end: billing_period_end
        }
      };
    } catch (error) {
      console.error('Usage billing service calculate overage error:', error);
      throw error;
    }
  }
}

export default new UsageBillingService();