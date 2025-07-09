# Payment Service API Documentation

## Overview

This is a backend payment microservice for multi-tenant SaaS applications with comprehensive quota management and billing features.

## Authentication

All API endpoints require authentication using an API key passed in the `X-API-Key` header.

```
X-API-Key: your-api-key-here
```

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://api.paymentservice.com`

## Endpoints

### Customers

#### Create Customer
```http
POST /customers
Content-Type: application/json
X-API-Key: your-api-key

{
  "email": "customer@example.com",
  "name": "John Doe",
  "metadata": {
    "company": "Example Corp",
    "plan": "premium"
  }
}
```

**Response:**
```json
{
  "id": "cust_123",
  "app_id": "app_456",
  "stripe_customer_id": "cus_stripe123",
  "email": "customer@example.com",
  "name": "John Doe",
  "metadata": {
    "company": "Example Corp",
    "plan": "premium"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Get Customer
```http
GET /customers/{customer_id}
X-API-Key: your-api-key
```

#### Update Customer
```http
PUT /customers/{customer_id}
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "John Smith",
  "metadata": {
    "company": "Example Corp Updated"
  }
}
```

#### List Customers
```http
GET /customers?limit=20&offset=0
X-API-Key: your-api-key
```

---

### Quota Plans

#### Create Quota Plan
```http
POST /quota-plans
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "Premium Plan",
  "description": "Premium quota plan with high limits",
  "billing_type": "subscription",
  "quotas": {
    "api_calls": 10000,
    "storage_gb": 50,
    "users": 100
  },
  "overage_rates": {
    "api_calls": 0.001,
    "storage_gb": 0.1
  },
  "reset_period": "monthly",
  "carry_over": true,
  "max_carry_over": {
    "api_calls": 1000,
    "storage_gb": 5
  }
}
```

**Response:**
```json
{
  "id": "qp_789",
  "app_id": "app_456",
  "name": "Premium Plan",
  "description": "Premium quota plan with high limits",
  "billing_type": "subscription",
  "quotas": {
    "api_calls": 10000,
    "storage_gb": 50,
    "users": 100
  },
  "overage_rates": {
    "api_calls": 0.001,
    "storage_gb": 0.1
  },
  "reset_period": "monthly",
  "carry_over": true,
  "max_carry_over": {
    "api_calls": 1000,
    "storage_gb": 5
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Get Quota Plan
```http
GET /quota-plans/{quota_plan_id}
X-API-Key: your-api-key
```

#### List Quota Plans
```http
GET /quota-plans?limit=20&offset=0
X-API-Key: your-api-key
```

#### Update Quota Plan
```http
PUT /quota-plans/{quota_plan_id}
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "Premium Plan Updated",
  "quotas": {
    "api_calls": 15000,
    "storage_gb": 75,
    "users": 150
  }
}
```

#### Delete Quota Plan
```http
DELETE /quota-plans/{quota_plan_id}
X-API-Key: your-api-key
```

---

### Subscriptions

#### Create Subscription
```http
POST /subscriptions
Content-Type: application/json
X-API-Key: your-api-key

{
  "customer_id": "cust_123",
  "price_id": "price_stripe123",
  "quantity": 1,
  "quota_plan_id": "qp_789",
  "trial_period_days": 14,
  "metadata": {
    "source": "web",
    "campaign": "spring2024"
  }
}
```

**Response:**
```json
{
  "id": "sub_456",
  "app_id": "app_456",
  "customer_id": "cust_123",
  "stripe_subscription_id": "sub_stripe123",
  "status": "trialing",
  "price_id": "price_stripe123",
  "quantity": 1,
  "quota_plan_id": "qp_789",
  "trial_start": "2024-01-15T10:30:00Z",
  "trial_end": "2024-01-29T10:30:00Z",
  "current_period_start": "2024-01-15T10:30:00Z",
  "current_period_end": "2024-02-15T10:30:00Z",
  "cancel_at_period_end": false,
  "metadata": {
    "source": "web",
    "campaign": "spring2024"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Get Subscription
```http
GET /subscriptions/{subscription_id}
X-API-Key: your-api-key
```

#### Update Subscription
```http
PUT /subscriptions/{subscription_id}
Content-Type: application/json
X-API-Key: your-api-key

{
  "price_id": "price_new123",
  "quantity": 2,
  "quota_plan_id": "qp_new789"
}
```

#### Cancel Subscription
```http
DELETE /subscriptions/{subscription_id}
X-API-Key: your-api-key
```

#### List Subscriptions
```http
GET /subscriptions?customer_id=cust_123&status=active&limit=20&offset=0
X-API-Key: your-api-key
```

---

### Usage Tracking

#### Create Usage Record
```http
POST /usage
Content-Type: application/json
X-API-Key: your-api-key

{
  "customer_id": "cust_123",
  "metric_name": "api_calls",
  "quantity": 10,
  "subscription_id": "sub_456",
  "quota_plan_id": "qp_789",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "endpoint": "/api/v1/data",
    "method": "GET",
    "user_agent": "MyApp/1.0"
  }
}
```

**Response:**
```json
{
  "id": "usage_123",
  "app_id": "app_456",
  "customer_id": "cust_123",
  "subscription_id": "sub_456",
  "quota_plan_id": "qp_789",
  "metric_name": "api_calls",
  "quantity": 10,
  "timestamp": "2024-01-15T10:30:00Z",
  "carried_over_from_period": null,
  "metadata": {
    "endpoint": "/api/v1/data",
    "method": "GET",
    "user_agent": "MyApp/1.0"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Batch Create Usage Records
```http
POST /usage/batch
Content-Type: application/json
X-API-Key: your-api-key

{
  "records": [
    {
      "customer_id": "cust_123",
      "metric_name": "api_calls",
      "quantity": 5,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "customer_id": "cust_123",
      "metric_name": "storage_gb",
      "quantity": 1,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Usage Records
```http
GET /usage?customer_id=cust_123&metric_name=api_calls&start_date=2024-01-01&end_date=2024-01-31&limit=50&offset=0
X-API-Key: your-api-key
```

#### Get Usage Summary
```http
GET /usage/summary?customer_id=cust_123&start_date=2024-01-01&end_date=2024-01-31
X-API-Key: your-api-key
```

**Response:**
```json
[
  {
    "metric_name": "api_calls",
    "total_quantity": 1500,
    "record_count": 150,
    "first_usage": "2024-01-01T00:00:00Z",
    "last_usage": "2024-01-31T23:59:59Z",
    "carry_over_quantity": 100
  },
  {
    "metric_name": "storage_gb",
    "total_quantity": 25,
    "record_count": 25,
    "first_usage": "2024-01-01T00:00:00Z",
    "last_usage": "2024-01-31T23:59:59Z",
    "carry_over_quantity": 0
  }
]
```

#### Get Usage for Period
```http
GET /usage/period?customer_id=cust_123&metric_name=api_calls&period_start=2024-01-01T00:00:00Z&period_end=2024-01-31T23:59:59Z
X-API-Key: your-api-key
```

---

### Quota Management

#### Check Quota (Read-only)
```http
GET /quota/check?customer_id=cust_123&metric_name=api_calls&requested_quantity=10
X-API-Key: your-api-key
```

**Response:**
```json
{
  "allowed": true,
  "current_usage": 850,
  "quota_limit": 1000,
  "remaining": 150,
  "would_exceed": false,
  "overage_amount": 0,
  "period_start": "2024-01-01T00:00:00Z",
  "period_end": "2024-01-31T23:59:59Z"
}
```

#### Check and Consume Quota (Atomic)
```http
POST /quota/check-and-consume
Content-Type: application/json
X-API-Key: your-api-key

{
  "customer_id": "cust_123",
  "metric_name": "api_calls",
  "requested_quantity": 10,
  "quota_plan_id": "qp_789",
  "metadata": {
    "action": "api_call",
    "endpoint": "/api/v1/data"
  }
}
```

**Response:**
```json
{
  "quota_check": {
    "allowed": true,
    "current_usage": 860,
    "quota_limit": 1000,
    "remaining": 140,
    "would_exceed": false,
    "overage_amount": 0,
    "period_start": "2024-01-01T00:00:00Z",
    "period_end": "2024-01-31T23:59:59Z"
  },
  "usage_record": {
    "id": "usage_456",
    "customer_id": "cust_123",
    "metric_name": "api_calls",
    "quantity": 10,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "consumed": true
}
```

#### Batch Check and Consume Quota
```http
POST /quota/batch-check-and-consume
Content-Type: application/json
X-API-Key: your-api-key

{
  "customer_id": "cust_123",
  "checks": [
    {
      "metric_name": "api_calls",
      "requested_quantity": 5
    },
    {
      "metric_name": "storage_gb",
      "requested_quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "all_allowed": true,
  "results": [
    {
      "metric_name": "api_calls",
      "quota_check": {
        "allowed": true,
        "current_usage": 865,
        "quota_limit": 1000,
        "remaining": 135
      },
      "usage_record": {
        "id": "usage_789",
        "quantity": 5
      },
      "consumed": true
    },
    {
      "metric_name": "storage_gb",
      "quota_check": {
        "allowed": true,
        "current_usage": 26,
        "quota_limit": 50,
        "remaining": 24
      },
      "usage_record": {
        "id": "usage_790",
        "quantity": 1
      },
      "consumed": true
    }
  ]
}
```

#### Get Customer Quota Status
```http
GET /quota/customer/{customer_id}/status
X-API-Key: your-api-key
```

**Response:**
```json
{
  "customer_id": "cust_123",
  "quota_statuses": [
    {
      "metric_name": "api_calls",
      "current_usage": 865,
      "quota_limit": 1000,
      "remaining": 135,
      "period_start": "2024-01-01T00:00:00Z",
      "period_end": "2024-01-31T23:59:59Z",
      "is_over_quota": false
    },
    {
      "metric_name": "storage_gb",
      "current_usage": 26,
      "quota_limit": 50,
      "remaining": 24,
      "period_start": "2024-01-01T00:00:00Z",
      "period_end": "2024-01-31T23:59:59Z",
      "is_over_quota": false
    }
  ],
  "total_metrics": 2,
  "over_quota_count": 0
}
```

---

### Payments

#### Create Payment
```http
POST /payments
Content-Type: application/json
X-API-Key: your-api-key

{
  "customer_id": "cust_123",
  "amount": 2999,
  "currency": "usd",
  "description": "Monthly subscription - Premium Plan",
  "metadata": {
    "subscription_id": "sub_456",
    "billing_period": "2024-01"
  }
}
```

**Response:**
```json
{
  "id": "pay_123",
  "app_id": "app_456",
  "customer_id": "cust_123",
  "subscription_id": null,
  "stripe_payment_id": "pi_stripe123",
  "amount": 2999,
  "currency": "usd",
  "status": "requires_confirmation",
  "payment_method": "card",
  "description": "Monthly subscription - Premium Plan",
  "metadata": {
    "subscription_id": "sub_456",
    "billing_period": "2024-01"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Get Payment
```http
GET /payments/{payment_id}
X-API-Key: your-api-key
```

#### Refund Payment
```http
POST /payments/{payment_id}/refund
Content-Type: application/json
X-API-Key: your-api-key

{
  "amount": 2999,
  "reason": "requested_by_customer"
}
```

#### List Payments
```http
GET /payments?customer_id=cust_123&status=succeeded&limit=20&offset=0
X-API-Key: your-api-key
```

---

### Webhooks

#### Stripe Webhook Endpoint
```http
POST /webhooks/stripe
Content-Type: application/json
Stripe-Signature: webhook-signature-here

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_stripe123",
      "status": "succeeded",
      "amount": 2999,
      "currency": "usd"
    }
  }
}
```

---

### Audit Logs

#### Get Audit Logs
```http
GET /audit?action_type=CREATE_PAYMENT&target_type=payment&start_date=2024-01-01&end_date=2024-01-31&limit=50&offset=0
X-API-Key: your-api-key
```

**Response:**
```json
{
  "logs": [
    {
      "id": "audit_123",
      "app_id": "app_456",
      "actor_id": "user_789",
      "action_type": "CREATE_PAYMENT",
      "target_type": "payment",
      "target_id": "pay_123",
      "payload_snapshot": {
        "amount": 2999,
        "currency": "usd",
        "customer_id": "cust_123"
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total_count": 1,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

## Error Handling

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Invalid or missing API key
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded or quota exceeded
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "error": "Quota exceeded",
  "code": "QUOTA_EXCEEDED",
  "details": {
    "metric": "api_calls",
    "current_usage": 1000,
    "quota_limit": 1000,
    "requested_quantity": 10
  }
}
```

### Quota Error Responses

When quota is exceeded:
```json
{
  "error": "Quota exceeded",
  "quota_limit": 1000,
  "current_usage": 1000,
  "overage_amount": 10,
  "remaining": 0
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication**: 100 requests per minute per API key
- **Quota checks**: 1000 requests per minute per API key
- **Usage tracking**: 500 requests per minute per API key
- **Other endpoints**: 200 requests per minute per API key

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642608000
```

---

## Postman Collection

### Environment Variables

Set these variables in your Postman environment:

```json
{
  "baseUrl": "http://localhost:3000",
  "apiKey": "your-api-key-here",
  "customerId": "cust_123",
  "quotaPlanId": "qp_789",
  "subscriptionId": "sub_456"
}
```

### Pre-request Scripts

Add this to your collection's pre-request script:

```javascript
pm.request.headers.add({
  key: 'X-API-Key',
  value: pm.environment.get('apiKey')
});

pm.request.headers.add({
  key: 'Content-Type',
  value: 'application/json'
});
```

### Test Scripts

Add these to your requests for automated testing:

```javascript
// Test for successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has required fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('created_at');
});

// Test quota check response
pm.test("Quota check response is valid", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('allowed');
    pm.expect(jsonData).to.have.property('current_usage');
    pm.expect(jsonData).to.have.property('quota_limit');
    pm.expect(jsonData).to.have.property('remaining');
});
```

---

## Best Practices

### Usage Tracking
- Track usage immediately after the action occurs
- Include relevant metadata for debugging and analytics
- Use batch operations for high-volume usage tracking

### Quota Management
- Check quotas before performing actions
- Use atomic check-and-consume operations for critical paths
- Implement proper error handling for quota exceeded scenarios

### Error Handling
- Always check response status codes
- Handle rate limiting with exponential backoff
- Implement proper retry logic for transient failures

### Security
- Keep API keys secure and rotate them regularly
- Use HTTPS in production
- Implement proper request validation

---

This documentation provides comprehensive examples that can be directly imported into Postman for testing and integration.