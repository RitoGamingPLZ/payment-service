import payment_service from '../services/payment_service.js';

export class PaymentController {
  async create_payment_intent(req, res) {
    try {
      const { customer_id, amount, currency, description, metadata } = req.body;
      
      const result = await payment_service.create_payment_intent(req.app_id, {
        customer_id,
        amount,
        currency,
        description,
        metadata
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Create payment intent error:', error);
      if (error.message === 'Customer not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }

  async refund_payment(req, res) {
    try {
      const { payment_id, amount, reason } = req.body;
      
      const result = await payment_service.refund_payment(req.app_id, payment_id, {
        amount,
        reason
      });
      
      res.json(result);
    } catch (error) {
      console.error('Refund payment error:', error);
      if (error.message === 'Payment not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to refund payment' });
    }
  }

  async get_payments(req, res) {
    try {
      const { limit = 50, offset = 0, customer_id } = req.query;
      
      const payments = await payment_service.get_payments(req.app_id, {
        limit,
        offset,
        customer_id
      });
      
      res.json(payments);
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ error: 'Failed to retrieve payments' });
    }
  }

  async get_payment_by_id(req, res) {
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