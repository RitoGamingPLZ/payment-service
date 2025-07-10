import { Request, Response } from 'express';
import subscription_plan_service from '../services/subscription-plan.service.js';
import { 
  CreateSubscriptionPlanDto, 
  UpdateSubscriptionPlanDto, 
  GetSubscriptionPlansQueryDto,
  GetPublicPlansQueryDto 
} from '../dto/subscription-plan.dto.js';

export class SubscriptionPlanController {
  async create_subscription_plan(req: Request, res: Response) {
    try {
      const plan_data: CreateSubscriptionPlanDto = req.body;
      
      const plan = await subscription_plan_service.create_subscription_plan(req.app_id, plan_data);
      
      res.status(201).json(plan);
    } catch (error) {
      console.error('Create subscription plan error:', error);
      if (error instanceof Error && (
        error.message === 'A plan with this slug already exists' || 
        error.message === 'Quota plan not found'
      )) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create subscription plan' });
    }
  }

  async get_subscription_plans(req: Request, res: Response) {
    try {
      const query: GetSubscriptionPlansQueryDto = req.query;
      
      const plans = await subscription_plan_service.get_subscription_plans(req.app_id, query);
      
      res.json(plans);
    } catch (error) {
      console.error('Get subscription plans error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscription plans' });
    }
  }

  async get_public_plans(req: Request, res: Response) {
    try {
      const query: GetPublicPlansQueryDto = req.query;
      
      const plans = await subscription_plan_service.get_public_plans(req.app_id, query.billing_period);
      
      res.json(plans);
    } catch (error) {
      console.error('Get public plans error:', error);
      res.status(500).json({ error: 'Failed to retrieve public plans' });
    }
  }

  async get_subscription_plan_by_id(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const plan = await subscription_plan_service.get_subscription_plan_by_id(req.app_id, id);
      
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Get subscription plan error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscription plan' });
    }
  }

  async get_subscription_plan_by_slug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      
      const plan = await subscription_plan_service.get_subscription_plan_by_slug(req.app_id, slug);
      
      if (!plan) {
        return res.status(404).json({ error: 'Subscription plan not found' });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Get subscription plan by slug error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscription plan' });
    }
  }

  async update_subscription_plan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const update_data: UpdateSubscriptionPlanDto = req.body;
      
      const updated_plan = await subscription_plan_service.update_subscription_plan(req.app_id, id, update_data);
      
      res.json(updated_plan);
    } catch (error) {
      console.error('Update subscription plan error:', error);
      if (error instanceof Error && (
        error.message === 'Subscription plan not found' ||
        error.message === 'A plan with this slug already exists' ||
        error.message === 'Quota plan not found'
      )) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update subscription plan' });
    }
  }

  async delete_subscription_plan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await subscription_plan_service.delete_subscription_plan(req.app_id, id);
      
      res.json({ success: true, message: 'Subscription plan deleted successfully' });
    } catch (error) {
      console.error('Delete subscription plan error:', error);
      if (error instanceof Error && (
        error.message === 'Subscription plan not found' ||
        error.message === 'Cannot delete plan with active subscriptions'
      )) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete subscription plan' });
    }
  }
}

export default new SubscriptionPlanController();