-- Payment Service Test Data
-- Run this after your database is set up

-- 1. Create test apps
INSERT INTO "App" (id, name, api_key, created_at, updated_at) VALUES
('app_test_123', 'Test SaaS App', 'sk_test_app_123_key_very_long_and_secure', NOW(), NOW()),
('app_demo_456', 'Demo E-commerce', 'sk_test_app_456_key_also_very_secure', NOW(), NOW()),
('app_beta_789', 'Beta Analytics Platform', 'sk_test_app_789_key_secure_string', NOW(), NOW());

-- 2. Create test customers
INSERT INTO "Customer" (id, app_id, email, name, stripe_customer_id, metadata, created_at, updated_at) VALUES
('cust_test_001', 'app_test_123', 'john@example.com', 'John Doe', 'cus_stripe_john123', '{"plan": "starter", "company": "Acme Corp"}', NOW(), NOW()),
('cust_test_002', 'app_test_123', 'jane@example.com', 'Jane Smith', 'cus_stripe_jane456', '{"plan": "professional", "company": "Tech Solutions"}', NOW(), NOW()),
('cust_test_003', 'app_demo_456', 'alice@demo.com', 'Alice Johnson', 'cus_stripe_alice789', '{"plan": "enterprise", "company": "Global Inc"}', NOW(), NOW()),
('cust_test_004', 'app_demo_456', 'bob@demo.com', 'Bob Wilson', 'cus_stripe_bob012', '{"plan": "starter", "company": "Startup LLC"}', NOW(), NOW()),
('cust_test_005', 'app_beta_789', 'charlie@beta.com', 'Charlie Brown', 'cus_stripe_charlie345', '{"plan": "professional", "company": "Analytics Pro"}', NOW(), NOW());

-- 3. Create subscription plan templates (what users see before subscribing)
INSERT INTO "SubscriptionPlan" (id, app_id, name, description, slug, base_price, currency, billing_period, stripe_price_id, quota_plan_id, trial_days, is_popular, is_featured, display_order, is_active, is_public, metadata, created_at, updated_at) VALUES
('subplan_starter_001', 'app_test_123', 'Starter', 'Perfect for small teams getting started', 'starter', 2999, 'usd', 'monthly', 'price_starter_monthly', 'quota_starter_001', 14, false, false, 1, true, true, '{"target_audience": "small teams", "features": ["Basic API access", "Email support"]}', NOW(), NOW()),
('subplan_pro_002', 'app_test_123', 'Professional', 'Ideal for growing businesses', 'professional', 9999, 'usd', 'monthly', 'price_pro_monthly', 'quota_pro_002', 14, true, true, 2, true, true, '{"target_audience": "growing businesses", "features": ["Advanced API access", "Priority support", "Analytics dashboard"]}', NOW(), NOW()),
('subplan_enterprise_003', 'app_demo_456', 'Enterprise', 'For large organizations with advanced needs', 'enterprise', 49999, 'usd', 'monthly', 'price_enterprise_monthly', 'quota_enterprise_003', 30, false, false, 3, true, true, '{"target_audience": "large organizations", "features": ["Unlimited API access", "24/7 support", "Custom integrations"]}', NOW(), NOW()),
('subplan_basic_004', 'app_demo_456', 'Basic', 'Simple plan for testing', 'basic', 1999, 'usd', 'monthly', 'price_basic_monthly', 'quota_basic_004', 7, false, false, 0, true, true, '{"target_audience": "testers", "features": ["Limited API access", "Community support"]}', NOW(), NOW()),
('subplan_analytics_005', 'app_beta_789', 'Analytics Pro', 'Advanced analytics and reporting', 'analytics-pro', 7999, 'usd', 'monthly', 'price_analytics_monthly', 'quota_analytics_005', 14, false, true, 1, true, true, '{"target_audience": "data teams", "features": ["Real-time analytics", "Custom reports", "Data export"]}', NOW(), NOW());

-- 4. Create quota plans
INSERT INTO "QuotaPlan" (id, app_id, name, quotas, reset_period, created_at, updated_at) VALUES
('quota_starter_001', 'app_test_123', 'Starter Plan', '{"api_calls": 10000, "storage_gb": 5, "users": 10}', 'monthly', NOW(), NOW()),
('quota_pro_002', 'app_test_123', 'Professional Plan', '{"api_calls": 100000, "storage_gb": 50, "users": 100}', 'monthly', NOW(), NOW()),
('quota_enterprise_003', 'app_demo_456', 'Enterprise Plan', '{"api_calls": 1000000, "storage_gb": 500, "users": 1000}', 'monthly', NOW(), NOW()),
('quota_basic_004', 'app_demo_456', 'Basic Plan', '{"api_calls": 5000, "storage_gb": 2, "users": 5}', 'monthly', NOW(), NOW()),
('quota_analytics_005', 'app_beta_789', 'Analytics Plan', '{"events": 50000, "reports": 100, "integrations": 20}', 'monthly', NOW(), NOW());

-- 5. Create subscriptions (linked to both subscription plans and quota plans)
INSERT INTO "Subscription" (id, app_id, customer_id, subscription_plan_id, quota_plan_id, stripe_subscription_id, status, price_id, current_period_start, current_period_end, metadata, created_at, updated_at) VALUES
('sub_test_001', 'app_test_123', 'cust_test_001', 'subplan_starter_001', 'quota_starter_001', 'sub_stripe_001', 'active', 'price_starter_monthly', '2024-01-01 00:00:00', '2024-01-31 23:59:59', '{"billing_cycle": "monthly", "selected_plan": "starter"}', NOW(), NOW()),
('sub_test_002', 'app_test_123', 'cust_test_002', 'subplan_pro_002', 'quota_pro_002', 'sub_stripe_002', 'active', 'price_pro_monthly', '2024-01-01 00:00:00', '2024-01-31 23:59:59', '{"billing_cycle": "monthly", "selected_plan": "professional"}', NOW(), NOW()),
('sub_test_003', 'app_demo_456', 'cust_test_003', 'subplan_enterprise_003', 'quota_enterprise_003', 'sub_stripe_003', 'active', 'price_enterprise_monthly', '2024-01-01 00:00:00', '2024-01-31 23:59:59', '{"billing_cycle": "monthly", "selected_plan": "enterprise"}', NOW(), NOW()),
('sub_test_004', 'app_demo_456', 'cust_test_004', 'subplan_basic_004', 'quota_basic_004', 'sub_stripe_004', 'trialing', 'price_basic_monthly', '2024-01-01 00:00:00', '2024-01-31 23:59:59', '{"billing_cycle": "monthly", "trial_end": "2024-01-15", "selected_plan": "basic"}', NOW(), NOW()),
('sub_test_005', 'app_beta_789', 'cust_test_005', 'subplan_analytics_005', 'quota_analytics_005', 'sub_stripe_005', 'active', 'price_analytics_monthly', '2024-01-01 00:00:00', '2024-01-31 23:59:59', '{"billing_cycle": "monthly", "selected_plan": "analytics-pro"}', NOW(), NOW());

-- 5. Create test payments
INSERT INTO "Payment" (id, app_id, customer_id, stripe_payment_intent_id, amount, currency, status, description, metadata, created_at, updated_at) VALUES
('pay_test_001', 'app_test_123', 'cust_test_001', 'pi_test_payment_001', 2999, 'usd', 'succeeded', 'Monthly subscription - Starter Plan', '{"subscription_id": "sub_test_001"}', NOW(), NOW()),
('pay_test_002', 'app_test_123', 'cust_test_002', 'pi_test_payment_002', 9999, 'usd', 'succeeded', 'Monthly subscription - Professional Plan', '{"subscription_id": "sub_test_002"}', NOW(), NOW()),
('pay_test_003', 'app_demo_456', 'cust_test_003', 'pi_test_payment_003', 49999, 'usd', 'succeeded', 'Monthly subscription - Enterprise Plan', '{"subscription_id": "sub_test_003"}', NOW(), NOW()),
('pay_test_004', 'app_demo_456', 'cust_test_004', 'pi_test_payment_004', 1999, 'usd', 'pending', 'Monthly subscription - Basic Plan', '{"subscription_id": "sub_test_004"}', NOW(), NOW()),
('pay_test_005', 'app_beta_789', 'cust_test_005', 'pi_test_payment_005', 7999, 'usd', 'succeeded', 'Monthly subscription - Analytics Plan', '{"subscription_id": "sub_test_005"}', NOW(), NOW());

-- 6. Create usage records
INSERT INTO "Usage" (id, app_id, customer_id, quota_plan_id, metric_name, quantity, timestamp, metadata, created_at, updated_at) VALUES
-- API calls usage
('usage_001', 'app_test_123', 'cust_test_001', 'quota_starter_001', 'api_calls', 1250, '2024-01-15 10:30:00', '{"endpoint": "/api/users", "method": "GET"}', NOW(), NOW()),
('usage_002', 'app_test_123', 'cust_test_001', 'quota_starter_001', 'api_calls', 850, '2024-01-15 14:20:00', '{"endpoint": "/api/orders", "method": "POST"}', NOW(), NOW()),
('usage_003', 'app_test_123', 'cust_test_002', 'quota_pro_002', 'api_calls', 15000, '2024-01-15 11:45:00', '{"endpoint": "/api/analytics", "method": "GET"}', NOW(), NOW()),

-- Storage usage
('usage_004', 'app_test_123', 'cust_test_001', 'quota_starter_001', 'storage_gb', 2, '2024-01-15 09:00:00', '{"file_type": "images", "upload_batch": "batch_001"}', NOW(), NOW()),
('usage_005', 'app_test_123', 'cust_test_002', 'quota_pro_002', 'storage_gb', 25, '2024-01-15 16:30:00', '{"file_type": "documents", "upload_batch": "batch_002"}', NOW(), NOW()),

-- User count usage
('usage_006', 'app_test_123', 'cust_test_001', 'quota_starter_001', 'users', 5, '2024-01-15 12:00:00', '{"action": "user_created", "user_id": "user_new_001"}', NOW(), NOW()),
('usage_007', 'app_demo_456', 'cust_test_003', 'quota_enterprise_003', 'users', 150, '2024-01-15 13:15:00', '{"action": "bulk_user_import", "batch_id": "import_001"}', NOW(), NOW()),

-- Analytics events usage
('usage_008', 'app_beta_789', 'cust_test_005', 'quota_analytics_005', 'events', 5000, '2024-01-15 08:00:00', '{"event_type": "page_view", "batch_size": 5000}', NOW(), NOW()),
('usage_009', 'app_beta_789', 'cust_test_005', 'quota_analytics_005', 'reports', 10, '2024-01-15 17:00:00', '{"report_type": "daily_summary", "period": "2024-01-14"}', NOW(), NOW());

-- 7. Create audit logs
INSERT INTO "AuditLog" (id, app_id, actor_id, action_type, target_type, target_id, payload_snapshot, created_at) VALUES
('audit_001', 'app_test_123', 'cust_test_001', 'CUSTOMER_CREATED', 'customer', 'cust_test_001', '{"email": "john@example.com", "name": "John Doe"}', NOW()),
('audit_002', 'app_test_123', 'cust_test_001', 'SUBSCRIPTION_CREATED', 'subscription', 'sub_test_001', '{"plan": "starter", "status": "active"}', NOW()),
('audit_003', 'app_test_123', 'cust_test_001', 'PAYMENT_SUCCEEDED', 'payment', 'pay_test_001', '{"amount": 2999, "currency": "usd"}', NOW()),
('audit_004', 'app_test_123', 'cust_test_001', 'CONSUME_QUOTA', 'usage', 'usage_001', '{"metric": "api_calls", "quantity": 1250}', NOW()),
('audit_005', 'app_demo_456', 'cust_test_003', 'CUSTOMER_CREATED', 'customer', 'cust_test_003', '{"email": "alice@demo.com", "name": "Alice Johnson"}', NOW()),
('audit_006', 'stripe_webhook', 'stripe_webhook', 'webhook_received', 'webhook', 'evt_test_001', '{"event_type": "payment_intent.succeeded", "livemode": false}', NOW()),
('audit_007', 'stripe_webhook', 'stripe_webhook', 'webhook_received', 'webhook', 'evt_test_002', '{"event_type": "invoice.payment_succeeded", "livemode": false}', NOW());

-- Display summary of created test data
SELECT 
  'Apps' as entity_type, 
  COUNT(*) as count 
FROM "App" 
WHERE id LIKE 'app_test_%' OR id LIKE 'app_demo_%' OR id LIKE 'app_beta_%'
UNION ALL
SELECT 
  'Customers' as entity_type, 
  COUNT(*) as count 
FROM "Customer" 
WHERE id LIKE 'cust_test_%'
UNION ALL
SELECT 
  'Subscription Plan Templates' as entity_type, 
  COUNT(*) as count 
FROM "SubscriptionPlan" 
WHERE id LIKE 'subplan_%'
UNION ALL
SELECT 
  'Quota Plans' as entity_type, 
  COUNT(*) as count 
FROM "QuotaPlan" 
WHERE id LIKE 'quota_%'
UNION ALL
SELECT 
  'Subscriptions' as entity_type, 
  COUNT(*) as count 
FROM "Subscription" 
WHERE id LIKE 'sub_test_%'
UNION ALL
SELECT 
  'Payments' as entity_type, 
  COUNT(*) as count 
FROM "Payment" 
WHERE id LIKE 'pay_test_%'
UNION ALL
SELECT 
  'Usage Records' as entity_type, 
  COUNT(*) as count 
FROM "Usage" 
WHERE id LIKE 'usage_%'
UNION ALL
SELECT 
  'Audit Logs' as entity_type, 
  COUNT(*) as count 
FROM "AuditLog" 
WHERE id LIKE 'audit_%';