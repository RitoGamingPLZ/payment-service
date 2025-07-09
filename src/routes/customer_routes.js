import express from 'express';
import { body } from 'express-validator';
import { handle_validation_errors } from '../middleware/validation_middleware.js';
import customer_controller from '../controllers/customer_controller.js';

const router = express.Router();

router.post('/', [
  body('email').isEmail().normalizeEmail(),
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('stripe_customer_id').isString().notEmpty(),
  body('metadata').optional().isObject()
], handle_validation_errors, customer_controller.create_customer);

router.get('/', customer_controller.get_customers);

router.get('/:id', customer_controller.get_customer_by_id);

router.put('/:id', [
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('metadata').optional().isObject()
], handle_validation_errors, customer_controller.update_customer);

router.delete('/:id', customer_controller.delete_customer);

export default router;