import { Request, Response } from 'express';
import payment_service from '../services/payment.service.js';
import { 
  CreatePaymentIntentDto, 
  RefundPaymentDto, 
  GetPaymentsQueryDto 
} from '../dto/payment.dto.js';

export class PaymentController {
  async create_payment_intent(req: Request, res: Response) {
    try {
      const payment_data: CreatePaymentIntentDto = req.body;
      
      const payment = await payment_service.create_payment_intent(req.app_id, payment_data);
      
      res.status(201).json(payment);
    } catch (error) {
      console.error('Create payment intent error:', error);
      if (error instanceof Error && error.message === 'Customer not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }

  async refund_payment(req: Request, res: Response) {
    try {
      const refund_data: RefundPaymentDto = req.body;
      
      const refunded_payment = await payment_service.refund_payment(req.app_id, refund_data);
      
      res.json(refunded_payment);
    } catch (error) {
      console.error('Refund payment error:', error);
      if (error instanceof Error && error.message === 'Payment not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to refund payment' });
    }
  }

  async get_payments(req: Request, res: Response) {
    try {
      const query: GetPaymentsQueryDto = req.query;
      
      const payments = await payment_service.get_payments(req.app_id, query);
      
      res.json(payments);
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ error: 'Failed to retrieve payments' });
    }
  }

  async get_payment_by_id(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const payment = await payment_service.get_payment_by_id(req.app_id, id);
      
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      res.json(payment);
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({ error: 'Failed to retrieve payment' });
    }
  }
}

export default new PaymentController();