-- Database-level quota enforcement for PostgreSQL
-- Supports hybrid billing: Subscription + QuotaPlan relationships

-- Function to check quota limit before inserting usage
CREATE OR REPLACE FUNCTION check_quota_limit(
  p_customer_id UUID,
  p_metric_name TEXT,
  p_period_start TIMESTAMP,
  p_period_end TIMESTAMP,
  p_new_quantity INT,
  p_quota_plan_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  current_usage INT;
  quota_limit INT;
  billing_type TEXT;
BEGIN
  -- Get quota limit and billing type for this metric
  SELECT 
    (quotas->>p_metric_name)::INT,
    billing_type
  INTO quota_limit, billing_type
  FROM quota_plans
  WHERE id = p_quota_plan_id;
  
  -- If no quota limit set, allow unlimited usage
  IF quota_limit IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- For pure usage billing, allow unlimited usage
  IF billing_type = 'usage' THEN
    RETURN TRUE;
  END IF;
  
  -- Calculate current usage in this period
  SELECT COALESCE(SUM(quantity), 0) INTO current_usage
  FROM usage
  WHERE customer_id = p_customer_id
    AND metric_name = p_metric_name
    AND period_start = p_period_start
    AND period_end = p_period_end;
  
  -- Check if new usage would exceed quota
  RETURN (current_usage + p_new_quantity) <= quota_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate effective quota limit including carry-over
CREATE OR REPLACE FUNCTION get_effective_quota_limit(
  p_customer_id UUID,
  p_metric_name TEXT,
  p_period_start TIMESTAMP,
  p_period_end TIMESTAMP,
  p_quota_plan_id UUID
) RETURNS INT AS $$
DECLARE
  base_limit INT;
  carry_over_amount INT;
  effective_limit INT;
BEGIN
  -- Get base quota limit
  SELECT (quotas->>p_metric_name)::INT INTO base_limit
  FROM quota_plans
  WHERE id = p_quota_plan_id;
  
  -- If no base limit, return unlimited
  IF base_limit IS NULL THEN
    RETURN 2147483647; -- Max INT value
  END IF;
  
  -- Calculate carry-over amount (negative usage records)
  SELECT COALESCE(SUM(ABS(quantity)), 0) INTO carry_over_amount
  FROM usage
  WHERE customer_id = p_customer_id
    AND metric_name = p_metric_name
    AND period_start = p_period_start
    AND period_end = p_period_end
    AND quantity < 0; -- Negative quantities are carry-over
  
  -- Return effective limit
  effective_limit := base_limit + carry_over_amount;
  RETURN effective_limit;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to enforce quotas
CREATE OR REPLACE FUNCTION enforce_quota_trigger() RETURNS TRIGGER AS $$
DECLARE
  effective_limit INT;
  current_usage INT;
  billing_type TEXT;
BEGIN
  -- Skip quota check if no quota plan assigned
  IF NEW.quota_plan_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Skip quota check for carry-over records (negative quantities)
  IF NEW.quantity < 0 THEN
    RETURN NEW;
  END IF;
  
  -- Get billing type
  SELECT billing_type INTO billing_type
  FROM quota_plans
  WHERE id = NEW.quota_plan_id;
  
  -- Skip quota check for pure usage billing
  IF billing_type = 'usage' THEN
    RETURN NEW;
  END IF;
  
  -- Get effective quota limit (including carry-over)
  effective_limit := get_effective_quota_limit(
    NEW.customer_id,
    NEW.metric_name,
    NEW.period_start,
    NEW.period_end,
    NEW.quota_plan_id
  );
  
  -- Calculate current usage (excluding carry-over)
  SELECT COALESCE(SUM(quantity), 0) INTO current_usage
  FROM usage
  WHERE customer_id = NEW.customer_id
    AND metric_name = NEW.metric_name
    AND period_start = NEW.period_start
    AND period_end = NEW.period_end
    AND quantity > 0; -- Only count positive usage
  
  -- Check quota
  IF (current_usage + NEW.quantity) > effective_limit THEN
    RAISE EXCEPTION 'Quota exceeded for metric % (current: %, effective_limit: %, attempted: %)',
      NEW.metric_name, current_usage, effective_limit, NEW.quantity
      USING ERRCODE = '23514'; -- Check violation error code
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS quota_enforcement_trigger ON usage;
CREATE TRIGGER quota_enforcement_trigger
  BEFORE INSERT ON usage
  FOR EACH ROW
  EXECUTE FUNCTION enforce_quota_trigger();

-- Function to validate usage record consistency
CREATE OR REPLACE FUNCTION validate_usage_consistency() RETURNS TRIGGER AS $$
BEGIN
  -- If subscription_id is provided, ensure it belongs to the same customer
  IF NEW.subscription_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE id = NEW.subscription_id 
      AND customer_id = NEW.customer_id
    ) THEN
      RAISE EXCEPTION 'Subscription % does not belong to customer %',
        NEW.subscription_id, NEW.customer_id;
    END IF;
  END IF;
  
  -- If quota_plan_id is provided and we have a subscription, 
  -- ensure they're compatible
  IF NEW.quota_plan_id IS NOT NULL AND NEW.subscription_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = NEW.subscription_id
      AND (s.quota_plan_id = NEW.quota_plan_id OR s.quota_plan_id IS NULL)
    ) THEN
      RAISE EXCEPTION 'Quota plan % is not compatible with subscription %',
        NEW.quota_plan_id, NEW.subscription_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create consistency validation trigger
DROP TRIGGER IF EXISTS usage_consistency_trigger ON usage;
CREATE TRIGGER usage_consistency_trigger
  BEFORE INSERT OR UPDATE ON usage
  FOR EACH ROW
  EXECUTE FUNCTION validate_usage_consistency();

-- Create index for efficient quota checking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_quota_check 
  ON usage (customer_id, metric_name, period_start, period_end, quantity);

-- Create index for period-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_period_customer
  ON usage (customer_id, period_start, period_end);

-- Create index for app-level analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_app_analytics
  ON usage (app_id, metric_name, timestamp);

-- Create index for quota plan queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_quota_plan_period
  ON usage (quota_plan_id, period_start, period_end);

-- Create partial index for carry-over records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_carry_over
  ON usage (customer_id, metric_name, carried_over_from_period)
  WHERE quantity < 0;

-- Create index for subscription-quota plan relationship
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_quota_plan
  ON subscriptions (quota_plan_id) WHERE quota_plan_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON FUNCTION check_quota_limit IS 'Checks if new usage would exceed quota limit';
COMMENT ON FUNCTION get_effective_quota_limit IS 'Calculates effective quota limit including carry-over';
COMMENT ON FUNCTION enforce_quota_trigger IS 'Trigger function to enforce quota limits on usage insertion';
COMMENT ON FUNCTION validate_usage_consistency IS 'Validates usage record relationships are consistent';
COMMENT ON TRIGGER quota_enforcement_trigger ON usage IS 'Enforces quota limits at database level';
COMMENT ON TRIGGER usage_consistency_trigger ON usage IS 'Ensures usage records have valid relationships';