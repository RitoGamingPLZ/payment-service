/**
 * @swagger
 * /audit:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
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
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of logs to skip
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *           enum: [CREATE_CUSTOMER, UPDATE_CUSTOMER, DELETE_CUSTOMER, CREATE_SUBSCRIPTION, UPDATE_SUBSCRIPTION, CANCEL_SUBSCRIPTION, CREATE_PAYMENT, REFUND_PAYMENT, CONSUME_QUOTA, CREATE_SUBSCRIPTION_PLAN, UPDATE_SUBSCRIPTION_PLAN, DELETE_SUBSCRIPTION_PLAN]
 *         description: Filter by action type
 *       - in: query
 *         name: target_type
 *         schema:
 *           type: string
 *           enum: [customer, subscription, payment, usage, subscription_plan]
 *         description: Filter by target type
 *       - in: query
 *         name: actor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by actor ID
 *       - in: query
 *         name: target_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by target ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs after this date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs before this date
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   app_id:
 *                     type: string
 *                     format: uuid
 *                   actor_id:
 *                     type: string
 *                     format: uuid
 *                   action_type:
 *                     type: string
 *                   target_type:
 *                     type: string
 *                   target_id:
 *                     type: string
 *                   payload_snapshot:
 *                     type: object
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */

/**
 * @swagger
 * /audit/summary:
 *   get:
 *     summary: Get audit summary statistics
 *     tags: [Audit]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Summary period
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Summary start date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Summary end date
 *     responses:
 *       200:
 *         description: Audit summary statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_actions:
 *                   type: integer
 *                   description: Total number of actions in period
 *                 actions_by_type:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   description: Count of actions by type
 *                 actions_by_target:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   description: Count of actions by target type
 *                 actions_by_day:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: integer
 *                   description: Daily action counts
 *                 period_start:
 *                   type: string
 *                   format: date-time
 *                 period_end:
 *                   type: string
 *                   format: date-time
 */