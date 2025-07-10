/**
 * @swagger
 * /subscription-plans:
 *   post:
 *     summary: Create a new subscription plan template
 *     tags: [Subscription Plans]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubscriptionPlan'
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionPlan'
 *       400:
 *         description: Bad request - validation error or slug already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /subscription-plans:
 *   get:
 *     summary: Get all subscription plans (admin)
 *     tags: [Subscription Plans]
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
 *         description: Number of plans to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of plans to skip
 *       - in: query
 *         name: is_public
 *         schema:
 *           type: boolean
 *         description: Filter by public visibility
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: billing_period
 *         schema:
 *           type: string
 *           enum: [monthly, yearly, weekly, daily]
 *         description: Filter by billing period
 *     responses:
 *       200:
 *         description: List of subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubscriptionPlan'
 */

/**
 * @swagger
 * /subscription-plans/public:
 *   get:
 *     summary: Get public subscription plans (customer-facing)
 *     tags: [Subscription Plans]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: billing_period
 *         schema:
 *           type: string
 *           enum: [monthly, yearly, weekly, daily]
 *         description: Filter by billing period
 *     responses:
 *       200:
 *         description: List of public subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubscriptionPlan'
 */

/**
 * @swagger
 * /subscription-plans/public/{slug}:
 *   get:
 *     summary: Get public subscription plan by slug
 *     tags: [Subscription Plans]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan slug
 *     responses:
 *       200:
 *         description: Subscription plan details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionPlan'
 *       404:
 *         description: Plan not found
 */

/**
 * @swagger
 * /subscription-plans/{id}:
 *   get:
 *     summary: Get subscription plan by ID
 *     tags: [Subscription Plans]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Subscription plan details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionPlan'
 *       404:
 *         description: Plan not found
 */

/**
 * @swagger
 * /subscription-plans/{id}:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Subscription Plans]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSubscriptionPlan'
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionPlan'
 *       400:
 *         description: Bad request - validation error or plan not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /subscription-plans/{id}:
 *   delete:
 *     summary: Delete subscription plan
 *     tags: [Subscription Plans]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan deleted successfully
 *       400:
 *         description: Cannot delete plan with active subscriptions
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Internal server error
 */