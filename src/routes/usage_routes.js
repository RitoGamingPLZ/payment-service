import express from 'express';
import { body } from 'express-validator';
import { handle_validation_errors } from '../middleware/validation_middleware.js';
import usage_controller from '../controllers/usage_controller.js';

const router = express.Router();

router.post('/', [
  body('customer_id').isString().notEmpty(),
  body('metric_name').isString().notEmpty(),
  body('quantity').isInt(),
  body('subscription_id').optional().isString(),
  body('quota_plan_id').optional().isString(),
  body('timestamp').optional().isISO8601(),
  body('period_start').optional().isISO8601(),
  body('period_end').optional().isISO8601(),
  body('carried_over_from_period').optional().isString(),
  body('metadata').optional().isObject()
], handle_validation_errors, usage_controller.create_usage);

router.post('/batch', [
  body('records').isArray().notEmpty(),
  body('records.*.customer_id').isString().notEmpty(),
  body('records.*.metric_name').isString().notEmpty(),
  body('records.*.quantity').isInt(),
  body('records.*.subscription_id').optional().isString(),
  body('records.*.quota_plan_id').optional().isString(),
  body('records.*.timestamp').optional().isISO8601(),
  body('records.*.period_start').optional().isISO8601(),
  body('records.*.period_end').optional().isISO8601(),
  body('records.*.carried_over_from_period').optional().isString(),
  body('records.*.metadata').optional().isObject()
], handle_validation_errors, usage_controller.create_batch_usage);

router.post('/carry-over', [
  body('customer_id').isString().notEmpty(),
  body('metric_name').isString().notEmpty(),
  body('carry_over_quantity').isInt({ min: 1 }),
  body('new_period_start').isISO8601(),
  body('new_period_end').isISO8601(),
  body('previous_period_id').isString().notEmpty()
], handle_validation_errors, usage_controller.create_carry_over_usage);

router.get('/', usage_controller.get_usage);

router.get('/summary', usage_controller.get_usage_summary);

router.get('/period', usage_controller.get_usage_for_period);

export default router;