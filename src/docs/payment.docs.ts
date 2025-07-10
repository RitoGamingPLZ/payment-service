/**
 * @swagger
 * /payments/intent:
 *   post:
 *     summary: Create a payment intent
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - amount
 *               - currency
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Amount in cents
 *               currency:
 *                 type: string
 *                 enum: [usd, eur, gbp, cad, aud]
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /payments/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_id
 *             properties:
 *               payment_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Refund amount in cents (optional, defaults to full amount)
 *               reason:
 *                 type: string
 *                 enum: [duplicate, fraudulent, requested_by_customer]
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refund_id:
 *                   type: string
 *                 amount:
 *                   type: integer
 *                 status:
 *                   type: string
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Payment not found
 */

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [requires_payment_method, requires_confirmation, requires_action, processing, succeeded, requires_capture, canceled]
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 */