import { Request, Response, NextFunction } from 'express';
import quota_sql_service from '../services/quota-sql.service.js';

// Middleware to check quota before allowing API calls (using SQL functions)
export const check_quota = (metric_name: string, quantity: number = 1) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { app_id } = req;
      const customer_id = req.body.customer_id || req.query.customer_id || req.params.customer_id;
      
      if (!customer_id) {
        return res.status(400).json({ error: 'customer_id is required for quota checking' });
      }
      
      // Use SQL function for quota validation
      const quota_check = await quota_sql_service.check_quota_only(
        app_id, 
        customer_id, 
        metric_name, 
        quantity
      );
      
      if (!quota_check.allowed) {
        return res.status(429).json({
          error: 'Quota exceeded',
          quota_limit: quota_check.quota_limit,
          current_usage: quota_check.current_usage,
          overage_amount: quota_check.overage_amount,
          remaining: quota_check.remaining
        });
      }
      
      // Attach quota info to request for potential use in controller
      (req as any).quota_info = quota_check;
      next();
    } catch (error) {
      console.error('Quota middleware error:', error);
      return res.status(500).json({ error: 'Failed to check quota' });
    }
  };
};

