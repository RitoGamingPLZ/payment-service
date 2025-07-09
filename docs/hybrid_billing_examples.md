# Hybrid Billing Examples

This document explains how the payment service handles different billing scenarios using the Subscription + QuotaPlan architecture.

## Schema Overview

```
Customer
├── Subscription (optional) - Stripe billing relationship
│   ├── quota_plan_id (optional) - Links to quota enforcement
│   └── Usage[] - Usage records for this subscription
├── QuotaPlan (optional) - Quota rules and limits
│   ├── Subscription[] - Multiple subscriptions can use same plan
│   └── Usage[] - All usage records for this plan
└── Usage[] - Individual usage events
```

## Billing Scenarios

### 1. **Subscription-Only Billing** (No Quotas)
Traditional Stripe subscription without usage limits.

```javascript
// Setup
const subscription = {
  stripe_subscription_id: "sub_123",
  price_id: "price_basic_monthly",
  quota_plan_id: null // No quota enforcement
};

// Usage tracking (optional - for analytics only)
const usage = {
  customer_id: "cust_1",
  subscription_id: "sub_123",
  quota_plan_id: null,
  metric_name: "api_calls",
  quantity: 1
};
```

### 2. **Subscription with Hard Limits**
Stripe subscription with quota enforcement but no overage billing.

```javascript
// Setup
const subscription = {
  stripe_subscription_id: "sub_456",
  price_id: "price_basic_monthly",
  quota_plan_id: "quota_basic_limits"
};

const quotaPlan = {
  id: "quota_basic_limits",
  name: "Basic Plan - Hard Limits",
  billing_type: "subscription",
  quotas: { api_calls: 1000, storage_gb: 10 },
  overage_rates: null, // No overage - hard block
  reset_period: "monthly"
};

// Usage (will be blocked at 1000 API calls)
const usage = {
  customer_id: "cust_1",
  subscription_id: "sub_456",
  quota_plan_id: "quota_basic_limits",
  metric_name: "api_calls",
  quantity: 1 // DB trigger enforces quota
};
```

### 3. **Subscription with Overage Billing** (Hybrid)
Stripe subscription with base limits + overage charges.

```javascript
// Setup
const subscription = {
  stripe_subscription_id: "sub_789",
  price_id: "price_pro_monthly",
  quota_plan_id: "quota_pro_hybrid"
};

const quotaPlan = {
  id: "quota_pro_hybrid",
  name: "Pro Plan - Hybrid Billing",
  billing_type: "hybrid",
  quotas: { api_calls: 5000, storage_gb: 50 },
  overage_rates: { api_calls: 0.01, storage_gb: 0.10 },
  reset_period: "monthly"
};

// Usage (allows overage but bills for it)
const usage = {
  customer_id: "cust_1",
  subscription_id: "sub_789",
  quota_plan_id: "quota_pro_hybrid",
  metric_name: "api_calls",
  quantity: 1 // Allowed even over quota
};

// Monthly overage calculation
const overageUsage = 5500; // 500 over quota
const overageCharge = 500 * 0.01; // $5.00
```

### 4. **Pure Usage-Based Billing** (No Subscription)
Pay-per-use model without Stripe subscription.

```javascript
// Setup
const subscription = null; // No Stripe subscription

const quotaPlan = {
  id: "quota_payg",
  name: "Pay-as-you-go",
  billing_type: "usage",
  quotas: {}, // No limits
  overage_rates: { api_calls: 0.02, storage_gb: 0.15 },
  reset_period: "monthly"
};

// Usage (unlimited but billed)
const usage = {
  customer_id: "cust_1",
  subscription_id: null,
  quota_plan_id: "quota_payg",
  metric_name: "api_calls",
  quantity: 1
};

// Monthly billing calculation
const totalUsage = 3000;
const totalCharge = 3000 * 0.02; // $60.00
```

### 5. **Multi-Plan Customer**
Customer with multiple subscriptions using different quota plans.

```javascript
// Customer has both Basic and Pro subscriptions
const subscriptions = [
  {
    id: "sub_basic",
    stripe_subscription_id: "sub_123",
    quota_plan_id: "quota_basic"
  },
  {
    id: "sub_pro", 
    stripe_subscription_id: "sub_456",
    quota_plan_id: "quota_pro"
  }
];

// Usage can be attributed to specific subscriptions
const usage = [
  {
    customer_id: "cust_1",
    subscription_id: "sub_basic",
    quota_plan_id: "quota_basic",
    metric_name: "api_calls",
    quantity: 1
  },
  {
    customer_id: "cust_1", 
    subscription_id: "sub_pro",
    quota_plan_id: "quota_pro",
    metric_name: "storage_gb",
    quantity: 1
  }
];
```

### 6. **Carry-Over Quota**
Unused quota from previous period carries over.

```javascript
// Setup with carry-over enabled
const quotaPlan = {
  id: "quota_carry_over",
  name: "Plan with Carry-over",
  billing_type: "subscription",
  quotas: { api_calls: 1000 },
  carry_over: true,
  max_carry_over: { api_calls: 500 },
  reset_period: "monthly"
};

// End of January: Customer used 700/1000 API calls
// 300 unused, but max carry-over is 500, so carry over 300

// February 1st: Add carry-over as negative usage
const carryOverUsage = {
  customer_id: "cust_1",
  subscription_id: "sub_123",
  quota_plan_id: "quota_carry_over",
  metric_name: "api_calls",
  quantity: -300, // Negative = additional quota
  period_start: "2024-02-01",
  period_end: "2024-02-28",
  carried_over_from_period: "2024-01"
};

// February effective quota: 1000 + 300 = 1300 API calls
```

## Query Examples

### Check Current Usage
```sql
-- Get current usage for a customer's subscription
SELECT 
  metric_name,
  SUM(quantity) as total_usage,
  period_start,
  period_end
FROM usage 
WHERE customer_id = 'cust_1' 
  AND subscription_id = 'sub_123'
  AND period_start = '2024-01-01'
  AND period_end = '2024-01-31'
GROUP BY metric_name, period_start, period_end;
```

### Calculate Overage Billing
```sql
-- Calculate overage for hybrid billing
SELECT 
  u.metric_name,
  SUM(u.quantity) as total_usage,
  (qp.quotas->u.metric_name)::int as quota_limit,
  GREATEST(0, SUM(u.quantity) - (qp.quotas->u.metric_name)::int) as overage,
  GREATEST(0, SUM(u.quantity) - (qp.quotas->u.metric_name)::int) * 
    (qp.overage_rates->u.metric_name)::float as overage_charge
FROM usage u
JOIN quota_plans qp ON u.quota_plan_id = qp.id
WHERE u.customer_id = 'cust_1'
  AND u.period_start = '2024-01-01'
  AND u.period_end = '2024-01-31'
  AND qp.billing_type = 'hybrid'
GROUP BY u.metric_name, qp.quotas, qp.overage_rates;
```

### Get Subscription with Quota Info
```sql
-- Get subscription with associated quota plan
SELECT 
  s.stripe_subscription_id,
  s.price_id,
  s.status,
  qp.name as quota_plan_name,
  qp.quotas,
  qp.overage_rates,
  qp.billing_type
FROM subscriptions s
LEFT JOIN quota_plans qp ON s.quota_plan_id = qp.id
WHERE s.customer_id = 'cust_1';
```

## Database Enforcement

The database automatically enforces:

1. **Quota Limits**: Usage insertion fails if quota exceeded (for subscription/hybrid billing)
2. **Relationship Consistency**: Usage records must reference valid customer/subscription/quota combinations
3. **Carry-Over Logic**: Negative usage records represent additional quota
4. **Billing Type Awareness**: Different enforcement rules based on quota plan billing type

## Benefits

- **Flexibility**: Support all billing models with single schema
- **Consistency**: Database-level enforcement prevents quota violations
- **Scalability**: Efficient indexes for fast quota checking
- **Auditability**: Complete usage history for all billing scenarios
- **Reusability**: Multiple subscriptions can share quota plans