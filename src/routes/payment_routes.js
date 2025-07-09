import express from 'express';
import { body } from 'express-validator';
import { handle_validation_errors } from '../middleware/validation_middleware.js';
import payment_controller from '../controllers/payment_controller.js';

const router = express.Router();

router.post('/intent', [
  body('customer_id').isString().notEmpty(),
  body('amount').isInt({ min: 1 }),
  body('currency').isString().isLength({ min: 3, max: 3 }),
  body('description').optional().isString(),
  body('metadata').optional().isObject()
], handle_validation_errors, payment_controller.create_payment_intent);

router.post('/refund', [
  body('payment_id').isString().notEmpty(),
  body('amount').optional().isInt({ min: 1 }),
  body('reason').optional().isString()
], handle_validation_errors, payment_controller.refund_payment);

router.get('/', payment_controller.get_payments);

router.get('/:id', payment_controller.get_payment_by_id);

export default router;