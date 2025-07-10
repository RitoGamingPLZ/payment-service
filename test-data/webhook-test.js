const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Test webhook signature generation and validation
class WebhookTester {
  constructor(webhookSecret) {
    this.webhookSecret = webhookSecret;
  }

  // Generate Stripe signature for testing
  generateStripeSignature(payload) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex');
    
    return `t=${timestamp},v1=${signature}`;
  }

  // Test all webhook payloads
  async testWebhooks() {
    const payloadsPath = path.join(__dirname, 'webhook-test-payloads.json');
    const payloads = JSON.parse(fs.readFileSync(payloadsPath, 'utf8'));
    
    console.log('🧪 Testing Webhook Payloads\n');
    
    for (const [eventType, payload] of Object.entries(payloads)) {
      console.log(`📨 Testing: ${eventType}`);
      
      const payloadString = JSON.stringify(payload);
      const signature = this.generateStripeSignature(payloadString);
      
      console.log(`  📝 Payload size: ${payloadString.length} bytes`);
      console.log(`  🔐 Signature: ${signature.substring(0, 50)}...`);
      
      // Test curl command
      const curlCommand = this.generateCurlCommand(payloadString, signature);
      console.log(`  🌐 Test with curl:`);
      console.log(`    ${curlCommand}\n`);
    }
  }

  // Generate curl command for testing
  generateCurlCommand(payload, signature) {
    const baseUrl = 'http://localhost:3000';
    const endpoint = `${baseUrl}/webhook/stripe`;
    
    return `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "User-Agent: Stripe/1.0 (+https://stripe.com/docs/webhooks)" \\
  -H "Stripe-Signature: ${signature}" \\
  -d '${payload.replace(/'/g, "'\\''")}' \\
  -v`;
  }

  // Test specific webhook event
  testSpecificEvent(eventType) {
    const payloadsPath = path.join(__dirname, 'webhook-test-payloads.json');
    const payloads = JSON.parse(fs.readFileSync(payloadsPath, 'utf8'));
    
    if (!payloads[eventType]) {
      console.error(`❌ Event type '${eventType}' not found in test payloads`);
      return;
    }
    
    const payload = JSON.stringify(payloads[eventType]);
    const signature = this.generateStripeSignature(payload);
    
    console.log(`🧪 Testing specific event: ${eventType}`);
    console.log(`🔐 Signature: ${signature}`);
    console.log(`📝 Payload:`);
    console.log(JSON.stringify(payloads[eventType], null, 2));
    
    return {
      payload,
      signature,
      curlCommand: this.generateCurlCommand(payload, signature)
    };
  }
}

// Usage examples
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_key_for_testing';
const tester = new WebhookTester(webhookSecret);

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'test-all':
    tester.testWebhooks();
    break;
  
  case 'test-event':
    const eventType = args[1];
    if (!eventType) {
      console.error('❌ Please specify an event type');
      console.log('Available events: payment_intent_succeeded, payment_intent_failed, invoice_payment_succeeded, subscription_created, subscription_updated, subscription_deleted');
      process.exit(1);
    }
    tester.testSpecificEvent(eventType);
    break;
  
  case 'help':
  default:
    console.log(`
🧪 Webhook Testing Tool

Usage:
  node webhook-test.js test-all              # Test all webhook events
  node webhook-test.js test-event <type>     # Test specific event type
  node webhook-test.js help                  # Show this help

Environment Variables:
  STRIPE_WEBHOOK_SECRET                      # Your Stripe webhook secret

Examples:
  node webhook-test.js test-event payment_intent_succeeded
  STRIPE_WEBHOOK_SECRET=whsec_123 node webhook-test.js test-all

Available Event Types:
  - payment_intent_succeeded
  - payment_intent_failed
  - invoice_payment_succeeded
  - subscription_created
  - subscription_updated
  - subscription_deleted
    `);
    break;
}

module.exports = WebhookTester;