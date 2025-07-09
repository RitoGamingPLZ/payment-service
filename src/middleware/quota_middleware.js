import quota_service from '../services/quota_service.js';

// Middleware to check quota before allowing API calls
export const check_quota = (metric_name, quantity = 1) => {
  return async (req, res, next) => {
    try {
      const { app_id } = req;
      const customer_id = req.body.customer_id || req.query.customer_id || req.params.customer_id;
      
      if (!customer_id) {
        return res.status(400).json({ 
          error: 'Customer ID is required for quota checking' 
        });
      }
      
      // Check if customer has quota usage setup
      const quota_usage = await quota_service.get_quota_usage(app_id, customer_id);
      
      if (!quota_usage) {
        // If no quota usage found, allow the request (unlimited)
        return next();
      }
      
      // Check if the request would exceed quota
      const quota_check = await quota_service.check_quota(app_id, customer_id, metric_name, quantity);
      
      if (!quota_check.allowed) {
        return res.status(429).json({
          error: 'Quota exceeded',
          details: {
            metric_name,
            current_usage: quota_check.current_usage,
            quota_limit: quota_check.quota_limit,
            remaining: quota_check.remaining,
            overage_amount: quota_check.overage_amount
          }
        });
      }
      
      // Store quota check result for use in the route handler
      req.quota_check = quota_check;
      
      next();
    } catch (error) {
      console.error('Quota middleware error:', error);
      res.status(500).json({ error: 'Failed to check quota' });
    }
  };
};

// Middleware to record usage after successful API call
export const record_usage = (metric_name, quantity = 1) => {
  return async (req, res, next) => {
    // Store original res.json to wrap it
    const original_json = res.json;
    
    res.json = async function(data) {
      try {
        const { app_id } = req;
        const customer_id = req.body.customer_id || req.query.customer_id || req.params.customer_id;
        
        if (customer_id && res.statusCode >= 200 && res.statusCode < 300) {
          // Only record usage for successful responses
          const usage_quantity = typeof quantity === 'function' ? quantity(req, res, data) : quantity;
          
          await quota_service.record_usage(app_id, customer_id, metric_name, usage_quantity);
        }
      } catch (error) {
        console.error('Usage recording error:', error);
        // Don't fail the request if usage recording fails
      }
      
      // Call original json method
      return original_json.call(this, data);
    };
    
    next();
  };
};

// Combined middleware for quota checking and usage recording
export const quota_and_usage = (metric_name, quantity = 1) => {
  return [
    check_quota(metric_name, quantity),
    record_usage(metric_name, quantity)
  ];
};

// Middleware to check if customer is in grace period
export const check_grace_period = async (req, res, next) => {
  try {
    const { app_id } = req;
    const customer_id = req.body.customer_id || req.query.customer_id || req.params.customer_id;
    
    if (!customer_id) {
      return next();
    }
    
    const quota_usage = await quota_service.get_quota_usage(app_id, customer_id);
    
    if (quota_usage && quota_usage.is_over_quota) {
      // Check if customer has active grace period
      const grace_period = await prisma.gracePeriod.findFirst({
        where: {
          app_id,
          customer_id,
          status: 'active',
          start_date: { lte: new Date() },
          end_date: { gte: new Date() }
        }
      });
      
      if (!grace_period) {
        return res.status(403).json({
          error: 'Account suspended due to quota exceeded',
          details: {
            is_over_quota: true,
            usage_data: quota_usage.usage_data,
            quota_limits: quota_usage.quota_plan.quotas
          }
        });
      }
      
      // Add grace period info to request
      req.grace_period = grace_period;
      
      // Add warning header
      res.setHeader('X-Quota-Warning', 'Account is over quota but in grace period');
    }
    
    next();
  } catch (error) {
    console.error('Grace period check error:', error);
    res.status(500).json({ error: 'Failed to check grace period' });
  }
};

// Middleware for enforcing different quota policies
export const enforce_quota_policy = (policy = 'strict') => {
  return async (req, res, next) => {
    try {
      const { app_id } = req;
      const customer_id = req.body.customer_id || req.query.customer_id || req.params.customer_id;
      
      if (!customer_id) {
        return next();
      }
      
      const quota_usage = await quota_service.get_quota_usage(app_id, customer_id);
      
      if (!quota_usage) {
        return next();
      }
      
      switch (policy) {
        case 'strict':
          // Block all requests if any quota is exceeded
          if (quota_usage.is_over_quota) {
            return res.status(429).json({
              error: 'Quota exceeded - strict policy',
              details: quota_usage.usage_data
            });
          }
          break;
          
        case 'warn':
          // Allow requests but add warning headers
          if (quota_usage.is_over_quota) {
            res.setHeader('X-Quota-Status', 'exceeded');
            res.setHeader('X-Quota-Usage', JSON.stringify(quota_usage.usage_data));
          }
          break;
          
        case 'bill':
          // Allow requests and bill for overage
          if (quota_usage.is_over_quota) {
            res.setHeader('X-Quota-Status', 'exceeded-billable');
            res.setHeader('X-Quota-Overage', JSON.stringify(quota_usage.overage_data));
          }
          break;
          
        default:
          // Default to strict policy
          if (quota_usage.is_over_quota) {
            return res.status(429).json({
              error: 'Quota exceeded',
              details: quota_usage.usage_data
            });
          }
      }
      
      next();
    } catch (error) {
      console.error('Quota policy enforcement error:', error);
      res.status(500).json({ error: 'Failed to enforce quota policy' });
    }
  };
};

// Middleware to validate quota plan exists for customer
export const ensure_quota_plan = async (req, res, next) => {
  try {
    const { app_id } = req;
    const customer_id = req.body.customer_id || req.query.customer_id || req.params.customer_id;
    
    if (!customer_id) {
      return next();
    }
    
    const quota_usage = await quota_service.get_quota_usage(app_id, customer_id);
    
    if (!quota_usage) {
      return res.status(400).json({
        error: 'No quota plan assigned to customer',
        details: {
          customer_id,
          message: 'Please assign a quota plan to this customer before using the API'
        }
      });
    }
    
    // Add quota usage to request for use in route handlers
    req.quota_usage = quota_usage;
    
    next();
  } catch (error) {
    console.error('Quota plan validation error:', error);
    res.status(500).json({ error: 'Failed to validate quota plan' });
  }
};