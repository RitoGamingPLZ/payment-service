/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [Webhooks]
 *     description: |
 *       Endpoint for receiving Stripe webhook events. This endpoint:
 *       - Verifies the webhook signature using Stripe's signature verification
 *       - Validates the request comes from Stripe (User-Agent, Content-Type)
 *       - Implements idempotency to prevent duplicate event processing
 *       - Logs all webhook events for audit purposes
 *       - Processes payment-related events and updates local records
 *       
 *       **Security Features:**
 *       - Stripe signature verification (required)
 *       - User-Agent validation
 *       - Content-Type validation
 *       - Rate limiting protection
 *       - Security headers (CSP, HSTS, etc.)
 *       
 *       **Supported Events:**
 *       - payment_intent.succeeded
 *       - payment_intent.payment_failed
 *       - subscription.created
 *       - subscription.updated
 *       - subscription.deleted
 *       - customer.created
 *       - customer.updated
 *       - customer.deleted
 *     parameters:
 *       - in: header
 *         name: Stripe-Signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe webhook signature for verification
 *         example: "t=1642723200,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd"
 *       - in: header
 *         name: User-Agent
 *         required: true
 *         schema:
 *           type: string
 *         description: Must be from Stripe
 *         example: "Stripe/1.0 (+https://stripe.com/docs/webhooks)"
 *       - in: header
 *         name: Content-Type
 *         required: true
 *         schema:
 *           type: string
 *         description: Must be application/json
 *         example: "application/json"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - object
 *               - type
 *               - data
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique identifier for the event
 *                 example: "evt_1234567890"
 *               object:
 *                 type: string
 *                 enum: [event]
 *                 description: Object type (always "event")
 *               type:
 *                 type: string
 *                 description: Event type
 *                 example: "payment_intent.succeeded"
 *               data:
 *                 type: object
 *                 properties:
 *                   object:
 *                     type: object
 *                     description: The Stripe object that triggered the event
 *               created:
 *                 type: integer
 *                 description: Unix timestamp of when the event was created
 *               livemode:
 *                 type: boolean
 *                 description: Whether the event was created in live mode
 *               pending_webhooks:
 *                 type: integer
 *                 description: Number of pending webhook deliveries
 *               request:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   id:
 *                     type: string
 *                   idempotency_key:
 *                     type: string
 *           examples:
 *             payment_success:
 *               summary: Payment Intent Succeeded
 *               value:
 *                 id: "evt_1234567890"
 *                 object: "event"
 *                 type: "payment_intent.succeeded"
 *                 data:
 *                   object:
 *                     id: "pi_1234567890"
 *                     object: "payment_intent"
 *                     amount: 2999
 *                     currency: "usd"
 *                     status: "succeeded"
 *                     metadata:
 *                       app_id: "app_test_123"
 *                       customer_id: "cust_test_001"
 *             subscription_created:
 *               summary: Subscription Created
 *               value:
 *                 id: "evt_0987654321"
 *                 object: "event"
 *                 type: "subscription.created"
 *                 data:
 *                   object:
 *                     id: "sub_1234567890"
 *                     object: "subscription"
 *                     customer: "cus_1234567890"
 *                     status: "active"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 event_id:
 *                   type: string
 *                   description: The processed event ID
 *                 processed_at:
 *                   type: string
 *                   format: date-time
 *                   description: When the event was processed
 *       400:
 *         description: Bad request - invalid payload or signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_signature:
 *                 summary: Invalid Signature
 *                 value:
 *                   error: "Webhook signature verification failed"
 *                   code: "INVALID_SIGNATURE"
 *               invalid_payload:
 *                 summary: Invalid Payload
 *                 value:
 *                   error: "Invalid webhook payload"
 *                   code: "INVALID_PAYLOAD"
 *       401:
 *         description: Unauthorized - signature verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - duplicate event (idempotency)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Event already processed"
 *                 event_id:
 *                   type: string
 *                 processed_at:
 *                   type: string
 *                   format: date-time
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */