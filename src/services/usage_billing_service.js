import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit_service.js';

export class UsageBillingService {
  // Calculate simple usage billing for a metric (flat rate)
  async calculate_usage_billing(app_id, metric_name, usage_quantity, rate_per_unit) {
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

  // Calculate monthly usage bill for a customer
  async calculate_monthly_usage_bill(app_id, customer_id, billing_month, billing_year) {
    try {
      const start_date = new Date(billing_year, billing_month - 1, 1);
      const end_date = new Date(billing_year, billing_month, 0, 23, 59, 59);
      
      // Get all usage records for the billing period
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
      
      // Group usage by metric
      const usage_by_metric = {};
      for (const record of usage_records) {
        if (!usage_by_metric[record.metric_name]) {
          usage_by_metric[record.metric_name] = 0;
        }
        usage_by_metric[record.metric_name] += record.quantity;
      }
      
      // For now, using flat rate billing - this could be enhanced later
      const billing_breakdown = {};
      let total_bill = 0;
      const default_rate = 0.001; // Default rate per unit
      
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

  // Generate usage-based invoice
  async generate_usage_invoice(app_id, customer_id, billing_period_start, billing_period_end) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: customer_id, app_id }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      // Get usage records for the billing period
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
      
      // Group and calculate billing
      const usage_by_metric = {};
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
      
      // Calculate billing for each metric
      const line_items = [];
      let subtotal = 0;
      const default_rate = 0.001; // Default rate per unit
      
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
      
      const tax_rate = 0.08; // This should be configurable
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

  // Get usage summary for billing period
  async get_usage_summary(app_id, customer_id, billing_period_start, billing_period_end) {
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
      
      // Group usage by metric
      const usage_by_metric = {};
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

  // Calculate overage billing from quota plan
  async calculate_overage_billing(app_id, customer_id, quota_plan_id, billing_period_start, billing_period_end) {
    try {
      const quota_plan = await prisma.quotaPlan.findFirst({
        where: { id: quota_plan_id, app_id }
      });
      
      if (!quota_plan || !quota_plan.overage_rates) {
        return { total_amount: 0, breakdown: {} };
      }
      
      const breakdown = {};
      let total_amount = 0;
      
      // Calculate overage for each metric
      for (const metric_name of Object.keys(quota_plan.quotas)) {
        const quota_limit = quota_plan.quotas[metric_name];
        const overage_rate = quota_plan.overage_rates[metric_name] || 0;
        
        // Get usage for this metric in billing period
        const usage_aggregate = await prisma.usage.aggregate({
          where: {
            app_id,
            customer_id,
            metric_name,
            quota_plan_id,
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