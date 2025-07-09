import express from 'express';
import { body } from 'express-validator';
import { handle_validation_errors } from '../middleware/validation_middleware.js';
import subscription_controller from '../controllers/subscription_controller.js';

const router = express.Router();

router.post('/', [
  body('customer_id').isString().notEmpty(),
  body('price_id').isString().notEmpty(),
  body('quantity').optional().isInt({ min: 1 }),
  body('trial_period_days').optional().isInt({ min: 0 }),
  body('quota_plan_id').optional().isString(),
  body('metadata').optional().isObject()
], handle_validation_errors, subscription_controller.create_subscription);

router.get('/', subscription_controller.get_subscriptions);

router.get('/:id', subscription_controller.get_subscription_by_id);

router.put('/:id', [
  body('price_id').optional().isString(),
  body('quantity').optional().isInt({ min: 1 }),
  body('quota_plan_id').optional().isString(),
  body('metadata').optional().isObject()
], handle_validation_errors, subscription_controller.update_subscription);

router.delete('/:id', [
  body('cancel_at_period_end').optional().isBoolean()
], handle_validation_errors, subscription_controller.cancel_subscription);

export default router;