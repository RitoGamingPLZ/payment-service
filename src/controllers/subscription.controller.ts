import { Request, Response } from 'express';
import subscription_service from '../services/subscription.service.js';
import { 
  CreateSubscriptionDto, 
  UpdateSubscriptionDto, 
  CancelSubscriptionDto, 
  GetSubscriptionsQueryDto 
} from '../dto/subscription.dto.js';

export class SubscriptionController {
  async create_subscription(req: Request, res: Response) {
    try {
      const subscription_data: CreateSubscriptionDto = req.body;
      
      const subscription = await subscription_service.create_subscription(req.app_id, subscription_data);
      
      res.status(201).json(subscription);
    } catch (error) {
      console.error('Create subscription error:', error);
      if (error instanceof Error && (error.message === 'Customer not found' || error.message === 'Quota plan not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  }

  async get_subscriptions(req: Request, res: Response) {
    try {
      const query: GetSubscriptionsQueryDto = req.query;
      
      const subscriptions = await subscription_service.get_subscriptions(req.app_id, query);
      
      res.json(subscriptions);
    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscriptions' });
    }
  }

  async get_subscription_by_id(req: Request, res: Response) {
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

  async update_subscription(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const update_data: UpdateSubscriptionDto = req.body;
      
      const updated_subscription = await subscription_service.update_subscription(req.app_id, id, update_data);
      
      res.json(updated_subscription);
    } catch (error) {
      console.error('Update subscription error:', error);
      if (error instanceof Error && (error.message === 'Subscription not found' || error.message === 'Quota plan not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  async cancel_subscription(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cancel_data: CancelSubscriptionDto = req.body;
      
      const updated_subscription = await subscription_service.cancel_subscription(req.app_id, id, cancel_data.cancel_at_period_end);
      
      res.json(updated_subscription);
    } catch (error) {
      console.error('Cancel subscription error:', error);
      if (error instanceof Error && error.message === 'Subscription not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }
}

export default new SubscriptionController();