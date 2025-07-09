import usage_service from '../services/usage_service.js';

export class UsageController {
  async create_usage(req, res) {
    try {
      const { 
        customer_id, 
        metric_name, 
        quantity, 
        subscription_id, 
        quota_plan_id,
        timestamp, 
        period_start,
        period_end,
        carried_over_from_period,
        metadata 
      } = req.body;
      
      const usage = await usage_service.create_usage(req.app_id, {
        customer_id,
        metric_name,
        quantity,
        subscription_id,
        quota_plan_id,
        timestamp,
        period_start,
        period_end,
        carried_over_from_period,
        metadata
      });
      
      res.status(201).json(usage);
    } catch (error) {
      console.error('Create usage error:', error);
      if (error.message === 'Customer not found' || error.message === 'Subscription not found' || error.message === 'Quota plan not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create usage' });
    }
  }

  async create_batch_usage(req, res) {
    try {
      const { records } = req.body;
      
      const result = await usage_service.create_batch_usage(req.app_id, records);
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Create batch usage error:', error);
      if (error.message === 'One or more customers not found') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create batch usage' });
    }
  }

  async get_usage(req, res) {
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
      } = req.query;
      
      const usage = await usage_service.get_usage(req.app_id, {
        limit,
        offset,
        customer_id,
        metric_name,
        subscription_id,
        quota_plan_id,
        start_date,
        end_date,
        period_start,
        period_end
      });
      
      res.json(usage);
    } catch (error) {
      console.error('Get usage error:', error);
      res.status(500).json({ error: 'Failed to retrieve usage' });
    }
  }

  async get_usage_summary(req, res) {
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
      } = req.query;
      
      const summary = await usage_service.get_usage_summary(req.app_id, {
        customer_id,
        metric_name,
        subscription_id,
        quota_plan_id,
        start_date,
        end_date,
        period_start,
        period_end
      });
      
      res.json(summary);
    } catch (error) {
      console.error('Get usage summary error:', error);
      res.status(500).json({ error: 'Failed to retrieve usage summary' });
    }
  }

  async get_usage_for_period(req, res) {
    try {
      const { customer_id, metric_name, period_start, period_end } = req.query;
      
      if (!customer_id || !metric_name || !period_start || !period_end) {
        return res.status(400).json({ 
          error: 'customer_id, metric_name, period_start, and period_end are required' 
        });
      }
      
      const total_usage = await usage_service.get_usage_for_period(
        req.app_id, 
        customer_id, 
        metric_name, 
        period_start, 
        period_end
      );
      
      res.json({
        customer_id,
        metric_name,
        period_start,
        period_end,
        total_usage
      });
    } catch (error) {
      console.error('Get usage for period error:', error);
      res.status(500).json({ error: 'Failed to retrieve usage for period' });
    }
  }

  async create_carry_over_usage(req, res) {
    try {
      const { 
        customer_id, 
        metric_name, 
        carry_over_quantity, 
        new_period_start, 
        new_period_end, 
        previous_period_id 
      } = req.body;
      
      const carry_over_usage = await usage_service.create_carry_over_usage(
        req.app_id,
        customer_id,
        metric_name,
        carry_over_quantity,
        new_period_start,
        new_period_end,
        previous_period_id
      );
      
      res.status(201).json(carry_over_usage);
    } catch (error) {
      console.error('Create carry-over usage error:', error);
      res.status(500).json({ error: 'Failed to create carry-over usage' });
    }
  }
}

export default new UsageController();