/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscriptions]
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
 *               - price_id
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *               subscription_plan_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional subscription plan template
 *               price_id:
 *                 type: string
 *                 description: Stripe price ID
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               trial_period_days:
 *                 type: integer
 *                 minimum: 0
 *               quota_plan_id:
 *                 type: string
 *                 format: uuid
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Subscriptions]
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
 *           enum: [active, inactive, canceled, trialing, past_due]
 *     responses:
 *       200:
 *         description: List of subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 */

/**
 * @swagger
 * /subscriptions/{id}:
 *   get:
 *     summary: Get subscription by ID
 *     tags: [Subscriptions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: Subscription not found
 */

/**
 * @swagger
 * /subscriptions/{id}:
 *   put:
 *     summary: Update subscription
 *     tags: [Subscriptions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               quota_plan_id:
 *                 type: string
 *                 format: uuid
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Subscription not found
 */

/**
 * @swagger
 * /subscriptions/{id}:
 *   delete:
 *     summary: Cancel subscription
 *     tags: [Subscriptions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subscription ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancel_at_period_end:
 *                 type: boolean
 *                 default: false
 *                 description: Cancel at end of current period
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */