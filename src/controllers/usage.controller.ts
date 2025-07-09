import { Request, Response } from 'express';
import usage_service from '../services/usage.service.js';
import { 
  CreateUsageDto, 
  CreateBatchUsageDto, 
  CreateCarryOverUsageDto, 
  GetUsageQueryDto, 
  GetUsageForPeriodQueryDto 
} from '../dto/usage.dto.js';

export class UsageController {
  async create_usage(req: Request, res: Response) {
    try {
      const usage_data: CreateUsageDto = req.body;
      
      const usage = await usage_service.create_usage(req.app_id, usage_data);
      
      res.status(201).json(usage);
    } catch (error) {
      console.error('Create usage error:', error);
      if (error instanceof Error && (error.message === 'Customer not found' || error.message === 'Subscription not found' || error.message === 'Quota plan not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create usage' });
    }
  }

  async create_batch_usage(req: Request, res: Response) {
    try {
      const batch_data: CreateBatchUsageDto = req.body;
      
      const result = await usage_service.create_batch_usage(req.app_id, batch_data.records);
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Create batch usage error:', error);
      if (error instanceof Error && error.message === 'One or more customers not found') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create batch usage' });
    }
  }

  async get_usage(req: Request, res: Response) {
    try {
      const query: GetUsageQueryDto = req.query;
      
      const usage = await usage_service.get_usage(req.app_id, query);
      
      res.json(usage);
    } catch (error) {
      console.error('Get usage error:', error);
      res.status(500).json({ error: 'Failed to retrieve usage' });
    }
  }

  async get_usage_summary(req: Request, res: Response) {
    try {
      const query: GetUsageQueryDto = req.query;
      
      const summary = await usage_service.get_usage_summary(req.app_id, query);
      
      res.json(summary);
    } catch (error) {
      console.error('Get usage summary error:', error);
      res.status(500).json({ error: 'Failed to retrieve usage summary' });
    }
  }

  async get_usage_for_period(req: Request, res: Response) {
    try {
      const query = req.query as any;
      
      const total_usage = await usage_service.get_usage_for_period(
        req.app_id, 
        query.customer_id, 
        query.metric_name, 
        query.period_start, 
        query.period_end
      );
      
      res.json({
        customer_id: query.customer_id,
        metric_name: query.metric_name,
        period_start: query.period_start,
        period_end: query.period_end,
        total_usage
      });
    } catch (error) {
      console.error('Get usage for period error:', error);
      res.status(500).json({ error: 'Failed to retrieve usage for period' });
    }
  }

  async create_carry_over_usage(req: Request, res: Response) {
    try {
      const carry_over_data: CreateCarryOverUsageDto = req.body;
      
      const carry_over_usage = await usage_service.create_carry_over_usage(
        req.app_id,
        carry_over_data.customer_id,
        carry_over_data.metric_name,
        carry_over_data.carry_over_quantity,
        carry_over_data.previous_period_id
      );
      
      res.status(201).json(carry_over_usage);
    } catch (error) {
      console.error('Create carry-over usage error:', error);
      res.status(500).json({ error: 'Failed to create carry-over usage' });
    }
  }
}

export default new UsageController();