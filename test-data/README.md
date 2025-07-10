# Payment Service Test Data

This directory contains comprehensive test data and tools for testing your payment service.

## Files Overview

### 1. `seed-data.sql`
Database seed file with realistic test data including:
- **3 Test Apps** with different configurations
- **5 Test Customers** across different apps
- **5 Quota Plans** with various limits
- **5 Subscriptions** in different states
- **5 Test Payments** with various statuses
- **9 Usage Records** showing quota consumption
- **7 Audit Logs** for tracking activities

### 2. `webhook-test-payloads.json`
Complete Stripe webhook event payloads for testing:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.payment_succeeded`
- `subscription.created`
- `subscription.updated`
- `subscription.deleted`

### 3. `api-test-requests.http`
HTTP client test file with 20+ API endpoint tests:
- Customer management
- Payment processing
- Subscription handling
- Usage/quota tracking
- Audit logging
- Authentication testing

### 4. `webhook-test.js`
Node.js tool for testing webhook endpoints with proper Stripe signatures.

## Getting Started

### 1. Set up the database
```bash
# Make sure your database is running
npm run db:push

# Seed test data
psql -h localhost -U your_user -d payment_service -f test-data/seed-data.sql
```

### 2. Set environment variables
```bash
# Copy .env.example to .env and fill in:
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
DATABASE_URL=postgresql://user:password@localhost:5432/payment_service
```

### 3. Start the server
```bash
npm run dev
```

### 4. Test API endpoints
Use VS Code with REST Client extension or any HTTP client:
```bash
# Open api-test-requests.http in VS Code
# Click "Send Request" on any endpoint
```

### 5. Test webhooks
```bash
# Test all webhook events
node test-data/webhook-test.js test-all

# Test specific event
node test-data/webhook-test.js test-event payment_intent_succeeded

# Get help
node test-data/webhook-test.js help
```

## Test Scenarios

### Customer Management
- Create customers with metadata
- Link customers to Stripe
- Update customer information
- Handle customer deletion

### Payment Processing
- Create payment intents
- Handle successful payments
- Process failed payments
- Manage refunds

### Subscription Management
- Create subscriptions with trials
- Handle subscription updates
- Process cancellations
- Manage plan changes

### Usage Tracking
- Check quota limits
- Consume quotas
- Batch quota operations
- Handle overage scenarios

### Webhook Processing
- Verify Stripe signatures
- Process payment events
- Handle subscription events
- Audit webhook calls

## Test Data Structure

### Apps
- `app_test_123` - Main testing app
- `app_demo_456` - Demo e-commerce app  
- `app_beta_789` - Beta analytics platform

### Customers
- `cust_test_001` - John Doe (Starter plan)
- `cust_test_002` - Jane Smith (Professional plan)
- `cust_test_003` - Alice Johnson (Enterprise plan)
- `cust_test_004` - Bob Wilson (Basic plan, trial)
- `cust_test_005` - Charlie Brown (Analytics plan)

### Quota Plans
- **Starter**: 10K API calls, 5GB storage, 10 users
- **Professional**: 100K API calls, 50GB storage, 100 users
- **Enterprise**: 1M API calls, 500GB storage, 1000 users
- **Basic**: 5K API calls, 2GB storage, 5 users
- **Analytics**: 50K events, 100 reports, 20 integrations

## Security Testing

### Authentication
- Test valid API keys
- Test invalid API keys
- Test missing API keys
- Test expired tokens

### Webhook Security
- Test valid Stripe signatures
- Test invalid signatures
- Test replay attacks
- Test malformed payloads

### Rate Limiting
- Test API rate limits
- Test webhook rate limits
- Test quota enforcement
- Test overage handling

## Monitoring & Debugging

### Audit Logs
All test actions are logged with:
- Event type and timestamp
- Actor and target information
- Detailed payload snapshots
- Error tracking

### Usage Metrics
Track consumption of:
- API calls
- Storage usage
- User seats
- Custom metrics

### Payment Tracking
Monitor:
- Payment success/failure rates
- Revenue metrics
- Subscription churn
- Refund patterns

## Best Practices

1. **Always test with realistic data**
2. **Use proper Stripe test keys**
3. **Verify webhook signatures**
4. **Test error scenarios**
5. **Monitor audit logs**
6. **Validate quota enforcement**
7. **Test edge cases**

## Troubleshooting

### Common Issues
- **Database connection errors**: Check DATABASE_URL
- **Stripe API errors**: Verify STRIPE_SECRET_KEY
- **Webhook signature failures**: Check STRIPE_WEBHOOK_SECRET
- **Rate limiting**: Adjust limits in middleware

### Debug Commands
```bash
# Check database connection
npm run db:studio

# View logs
npm run dev

# Test specific endpoint
curl -H "X-API-Key: your_key" http://localhost:3000/customers

# Validate webhook signature
node test-data/webhook-test.js test-event payment_intent_succeeded
```

## Next Steps

1. **Run the seed data** to populate your database
2. **Test API endpoints** using the HTTP file
3. **Validate webhook processing** with the webhook tester
4. **Monitor audit logs** for all activities
5. **Extend test cases** for your specific use cases

Happy testing! 🚀