import subscription_service from '../services/subscription_service.js';

export class SubscriptionController {
  async create_subscription(req, res) {
    try {
      const { customer_id, price_id, quantity = 1, trial_period_days, quota_plan_id, metadata } = req.body;
      
      const subscription = await subscription_service.create_subscription(req.app_id, {
        customer_id,
        price_id,
        quantity,
        trial_period_days,
        quota_plan_id,
        metadata
      });
      
      res.status(201).json(subscription);
    } catch (error) {
      console.error('Create subscription error:', error);
      if (error.message === 'Customer not found' || error.message === 'Quota plan not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  }

  async get_subscriptions(req, res) {
    try {
      const { limit = 50, offset = 0, customer_id, status } = req.query;
      
      const subscriptions = await subscription_service.get_subscriptions(req.app_id, {
        limit,
        offset,
        customer_id,
        status
      });
      
      res.json(subscriptions);
    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscriptions' });
    }
  }

  async get_subscription_by_id(req, res) {
    try {
      const { id } = req.params;
      
      const subscription = await subscription_service.get_subscription_by_id(req.app_id, id);
      
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscription' });
    }
  }

  async update_subscription(req, res) {
    try {
      const { id } = req.params;
      const { price_id, quantity, quota_plan_id, metadata } = req.body;
      
      const updated_subscription = await subscription_service.update_subscription(req.app_id, id, {
        price_id,
        quantity,
        quota_plan_id,
        metadata
      });
      
      res.json(updated_subscription);
    } catch (error) {
      console.error('Update subscription error:', error);
      if (error.message === 'Subscription not found' || error.message === 'Quota plan not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  async cancel_subscription(req, res) {
    try {
      const { id } = req.params;
      const { cancel_at_period_end = false } = req.body;
      
      const updated_subscription = await subscription_service.cancel_subscription(req.app_id, id, cancel_at_period_end);
      
      res.json(updated_subscription);
    } catch (error) {
      console.error('Cancel subscription error:', error);
      if (error.message === 'Subscription not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }
}

export default new SubscriptionController();