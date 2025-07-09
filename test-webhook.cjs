// Simple webhook test script
const crypto = require('crypto');

// Test webhook signature generation (for testing purposes only)
function generateTestSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

// Test payload
const testPayload = JSON.stringify({
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_payment_intent',
      object: 'payment_intent',
      amount: 2000,
      currency: 'usd',
      status: 'succeeded',
      customer: 'cus_test_customer',
      metadata: {
        app_id: 'test_app_123'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_request',
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
});

console.log('Test webhook payload:');
console.log(testPayload);
console.log('\nTo test the webhook endpoint, you would:');
console.log('1. Set STRIPE_WEBHOOK_SECRET in your environment');
console.log('2. Use the generateTestSignature function to create a signature');
console.log('3. Send a POST request to /webhook/stripe with the payload and signature');
console.log('\nExample curl command:');
console.log('curl -X POST http://localhost:3000/webhook/stripe \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -H "User-Agent: Stripe/1.0 (+https://stripe.com/docs/webhooks)" \\');
console.log('  -H "Stripe-Signature: GENERATED_SIGNATURE" \\');
console.log('  -d \'' + testPayload + '\'');
console.log('\nSecurity features implemented:');
console.log('✓ Stripe signature verification');
console.log('✓ Timestamp validation (prevents replay attacks)');
console.log('✓ User-Agent validation');
console.log('✓ Content-Type validation');
console.log('✓ Rate limiting per IP');
console.log('✓ Idempotency protection');
console.log('✓ Comprehensive audit logging');
console.log('✓ Security headers');
console.log('✓ Error handling with audit trails');