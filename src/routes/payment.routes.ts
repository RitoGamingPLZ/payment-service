import 'reflect-metadata';
import express from 'express';
import { validateDto } from '../middlewares/validateDto.js';
import payment_controller from '../controllers/payment.controller.js';
import { 
  CreatePaymentIntentDto, 
  RefundPaymentDto, 
  GetPaymentsQueryDto 
} from '../dto/payment.dto.js';

const router = express.Router();

router.post('/intent', 
  validateDto(CreatePaymentIntentDto),
  payment_controller.create_payment_intent
);

router.post('/refund', 
  validateDto(RefundPaymentDto),
  payment_controller.refund_payment
);

router.get('/', 
  payment_controller.get_payments
);

router.get('/:id', 
  payment_controller.get_payment_by_id
);

export default router;