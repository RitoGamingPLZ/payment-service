-- Remove period_start and period_end fields from usage table
-- These fields are redundant as period information can be derived from subscription relationships

ALTER TABLE "usage" DROP COLUMN IF EXISTS "period_start";
ALTER TABLE "usage" DROP COLUMN IF EXISTS "period_end";

-- Update indexes to use timestamp instead of period fields
DROP INDEX IF EXISTS "usage_customer_id_metric_name_period_start_period_end_idx";
DROP INDEX IF EXISTS "usage_period_start_period_end_idx";

-- Create new indexes for efficient timestamp-based queries
CREATE INDEX IF NOT EXISTS "usage_customer_id_metric_name_timestamp_idx" ON "usage"("customer_id", "metric_name", "timestamp");
CREATE INDEX IF NOT EXISTS "usage_quota_plan_id_timestamp_idx" ON "usage"("quota_plan_id", "timestamp") WHERE "quota_plan_id" IS NOT NULL;

-- =====================================================================================
-- SQL QUOTA ENFORCEMENT FUNCTIONS (Updated for timestamp-based queries)
-- =====================================================================================

-- Function to get current period boundaries for a quota plan
CREATE OR REPLACE FUNCTION get_current_period_boundaries(
  p_reset_period TEXT,
  p_reference_time TIMESTAMP DEFAULT NOW()
) RETURNS TABLE(period_start TIMESTAMP, period_end TIMESTAMP) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
BEGIN
  start_time := p_reference_time;
  end_time := p_reference_time;
  
  CASE p_reset_period
    WHEN 'monthly' THEN
      start_time := DATE_TRUNC('month', p_reference_time);
      end_time := DATE_TRUNC('month', p_reference_time + INTERVAL '1 month');
    WHEN 'yearly' THEN
      start_time := DATE_TRUNC('year', p_reference_time);
      end_time := DATE_TRUNC('year', p_reference_time + INTERVAL '1 year');
    WHEN 'weekly' THEN
      start_time := DATE_TRUNC('week', p_reference_time);
      end_time := DATE_TRUNC('week', p_reference_time + INTERVAL '1 week');
    WHEN 'daily' THEN
      start_time := DATE_TRUNC('day', p_reference_time);
      end_time := DATE_TRUNC('day', p_reference_time + INTERVAL '1 day');
    WHEN 'none' THEN
      start_time := '2000-01-01 00:00:00'::TIMESTAMP;
      end_time := '2100-01-01 00:00:00'::TIMESTAMP;
    ELSE
      -- Default to monthly
      start_time := DATE_TRUNC('month', p_reference_time);
      end_time := DATE_TRUNC('month', p_reference_time + INTERVAL '1 month');
  END CASE;
  
  RETURN QUERY SELECT start_time, end_time;
END;
$$ LANGUAGE plpgsql;

-- Function to check quota limit before inserting usage (updated for timestamp-based queries)
CREATE OR REPLACE FUNCTION check_quota_limit(
  p_customer_id UUID,
  p_metric_name TEXT,
  p_new_quantity INT,
  p_quota_plan_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  current_usage INT;
  quota_limit INT;
  billing_type TEXT;
  reset_period TEXT;
  period_boundaries RECORD;
BEGIN
  -- Get quota limit, billing type, and reset period for this metric
  SELECT 
    (quotas->>p_metric_name)::INT,
    billing_type,
    reset_period
  INTO quota_limit, billing_type, reset_period
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
  
  -- Get current period boundaries
  SELECT * INTO period_boundaries
  FROM get_current_period_boundaries(reset_period);
  
  -- Calculate current usage in this period using timestamp queries
  SELECT COALESCE(SUM(quantity), 0) INTO current_usage
  FROM usage
  WHERE customer_id = p_customer_id
    AND metric_name = p_metric_name
    AND quota_plan_id = p_quota_plan_id
    AND timestamp >= period_boundaries.period_start
    AND timestamp <= period_boundaries.period_end;
  
  -- Check if new usage would exceed quota
  RETURN (current_usage + p_new_quantity) <= quota_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate effective quota limit including carry-over (updated for timestamp-based queries)
CREATE OR REPLACE FUNCTION get_effective_quota_limit(
  p_customer_id UUID,
  p_metric_name TEXT,
  p_quota_plan_id UUID
) RETURNS INT AS $$
DECLARE
  base_limit INT;
  carry_over_amount INT;
  effective_limit INT;
  reset_period TEXT;
  period_boundaries RECORD;
BEGIN
  -- Get base quota limit and reset period
  SELECT 
    (quotas->>p_metric_name)::INT,
    reset_period
  INTO base_limit, reset_period
  FROM quota_plans
  WHERE id = p_quota_plan_id;
  
  -- If no base limit, return unlimited
  IF base_limit IS NULL THEN
    RETURN 2147483647; -- Max INT value
  END IF;
  
  -- Get current period boundaries
  SELECT * INTO period_boundaries
  FROM get_current_period_boundaries(reset_period);
  
  -- Calculate carry-over amount (negative usage records in current period)
  SELECT COALESCE(SUM(ABS(quantity)), 0) INTO carry_over_amount
  FROM usage
  WHERE customer_id = p_customer_id
    AND metric_name = p_metric_name
    AND quota_plan_id = p_quota_plan_id
    AND timestamp >= period_boundaries.period_start
    AND timestamp <= period_boundaries.period_end
    AND quantity < 0; -- Negative quantities are carry-over
  
  -- Return effective limit
  effective_limit := base_limit + carry_over_amount;
  RETURN effective_limit;
END;
$$ LANGUAGE plpgsql;

-- Updated trigger function to enforce quotas (works with timestamp-based queries)
CREATE OR REPLACE FUNCTION enforce_quota_trigger() RETURNS TRIGGER AS $$
DECLARE
  effective_limit INT;
  current_usage INT;
  billing_type TEXT;
  reset_period TEXT;
  period_boundaries RECORD;
BEGIN
  -- Skip quota check if no quota plan assigned
  IF NEW.quota_plan_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Skip quota check for carry-over records (negative quantities)
  IF NEW.quantity < 0 THEN
    RETURN NEW;
  END IF;
  
  -- Get billing type and reset period
  SELECT billing_type, reset_period
  INTO billing_type, reset_period
  FROM quota_plans
  WHERE id = NEW.quota_plan_id;
  
  -- Skip quota check for pure usage billing
  IF billing_type = 'usage' THEN
    RETURN NEW;
  END IF;
  
  -- Get current period boundaries
  SELECT * INTO period_boundaries
  FROM get_current_period_boundaries(reset_period, NEW.timestamp);
  
  -- Get effective quota limit (including carry-over)
  effective_limit := get_effective_quota_limit(
    NEW.customer_id,
    NEW.metric_name,
    NEW.quota_plan_id
  );
  
  -- Calculate current usage (excluding carry-over) in the current period
  SELECT COALESCE(SUM(quantity), 0) INTO current_usage
  FROM usage
  WHERE customer_id = NEW.customer_id
    AND metric_name = NEW.metric_name
    AND quota_plan_id = NEW.quota_plan_id
    AND timestamp >= period_boundaries.period_start
    AND timestamp <= period_boundaries.period_end
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

-- Function to validate usage record consistency (updated to remove period field checks)
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

-- Create/recreate triggers
DROP TRIGGER IF EXISTS quota_enforcement_trigger ON usage;
CREATE TRIGGER quota_enforcement_trigger
  BEFORE INSERT ON usage
  FOR EACH ROW
  EXECUTE FUNCTION enforce_quota_trigger();

DROP TRIGGER IF EXISTS usage_consistency_trigger ON usage;
CREATE TRIGGER usage_consistency_trigger
  BEFORE INSERT OR UPDATE ON usage
  FOR EACH ROW
  EXECUTE FUNCTION validate_usage_consistency();

-- Updated indexes for timestamp-based queries (remove period_start/period_end references)
DROP INDEX IF EXISTS idx_usage_quota_check;
DROP INDEX IF EXISTS idx_usage_period_customer;
DROP INDEX IF EXISTS idx_usage_quota_plan_period;

-- Create new indexes optimized for timestamp-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_quota_check_timestamp 
  ON usage (customer_id, metric_name, quota_plan_id, timestamp, quantity);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_timestamp_customer
  ON usage (customer_id, timestamp);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_quota_plan_timestamp
  ON usage (quota_plan_id, timestamp);

-- Keep existing indexes that are still relevant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_app_analytics
  ON usage (app_id, metric_name, timestamp);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_carry_over
  ON usage (customer_id, metric_name, carried_over_from_period)
  WHERE quantity < 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_quota_plan
  ON subscriptions (quota_plan_id) WHERE quota_plan_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON FUNCTION get_current_period_boundaries IS 'Calculates period boundaries for quota reset periods';
COMMENT ON FUNCTION check_quota_limit IS 'Checks if new usage would exceed quota limit using timestamp queries';
COMMENT ON FUNCTION get_effective_quota_limit IS 'Calculates effective quota limit including carry-over using timestamp queries';
COMMENT ON FUNCTION enforce_quota_trigger IS 'Trigger function to enforce quota limits on usage insertion (timestamp-based)';
COMMENT ON FUNCTION validate_usage_consistency IS 'Validates usage record relationships are consistent';
COMMENT ON TRIGGER quota_enforcement_trigger ON usage IS 'Enforces quota limits at database level using timestamp queries';
COMMENT ON TRIGGER usage_consistency_trigger ON usage IS 'Ensures usage records have valid relationships';