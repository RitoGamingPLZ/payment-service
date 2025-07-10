/**
 * @swagger
 * /usage:
 *   post:
 *     summary: Record usage for a customer
 *     tags: [Usage]
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
 *               - metric_name
 *               - quantity
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *               metric_name:
 *                 type: string
 *                 example: api_calls
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Usage recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usage'
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /usage/batch:
 *   post:
 *     summary: Record batch usage for a customer
 *     tags: [Usage]
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
 *               - items
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - metric_name
 *                     - quantity
 *                   properties:
 *                     metric_name:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     metadata:
 *                       type: object
 *     responses:
 *       201:
 *         description: Batch usage recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usage'
 */

/**
 * @swagger
 * /usage/carry-over:
 *   post:
 *     summary: Create carry-over usage for a customer
 *     tags: [Usage]
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
 *               - metric_name
 *               - quantity
 *               - carried_over_from_period
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *               metric_name:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               carried_over_from_period:
 *                 type: string
 *                 description: Previous period identifier
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Carry-over usage created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usage'
 */

/**
 * @swagger
 * /usage:
 *   get:
 *     summary: Get usage records
 *     tags: [Usage]
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
 *         name: metric_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of usage records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usage'
 */

/**
 * @swagger
 * /usage/summary:
 *   get:
 *     summary: Get usage summary for a customer
 *     tags: [Usage]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: metric_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: period_start
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: period_end
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Usage summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer_id:
 *                   type: string
 *                 period_start:
 *                   type: string
 *                   format: date-time
 *                 period_end:
 *                   type: string
 *                   format: date-time
 *                 metrics:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       total_usage:
 *                         type: integer
 *                       quota_limit:
 *                         type: integer
 *                       remaining:
 *                         type: integer
 *                       usage_percentage:
 *                         type: number
 */

/**
 * @swagger
 * /usage/period:
 *   get:
 *     summary: Get usage for a specific period
 *     tags: [Usage]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: period_start
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: period_end
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: metric_name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usage records for the period
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usage'
 */