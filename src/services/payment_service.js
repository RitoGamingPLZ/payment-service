import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit_service.js';
import stripe_service from './stripe_service.js';

export class PaymentService {
  async create_payment_intent(app_id, payment_data) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: payment_data.customer_id, app_id }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const payment_intent = await stripe_service.create_payment_intent(
        payment_data.amount,
        payment_data.currency,
        customer.stripe_customer_id,
        { ...payment_data.metadata, app_id }
      );
      
      const payment = await prisma.payment.create({
        data: {
          app_id,
          customer_id: payment_data.customer_id,
          stripe_payment_id: payment_intent.id,
          amount: payment_data.amount,
          currency: payment_data.currency,
          status: payment_intent.status,
          payment_method: 'card',
          description: payment_data.description,
          metadata: payment_data.metadata
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'CREATE_PAYMENT_INTENT',
        target_type: 'payment',
        target_id: payment.id,
        payload_snapshot: payment
      });
      
      return {
        payment_intent: {
          id: payment_intent.id,
          client_secret: payment_intent.client_secret,
          amount: payment_intent.amount,
          currency: payment_intent.currency,
          status: payment_intent.status
        },
        payment
      };
    } catch (error) {
      console.error('Payment service create intent error:', error);
      throw error;
    }
  }

  async refund_payment(app_id, payment_id, refund_data) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { id: payment_id, app_id }
      });
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      const refund = await stripe_service.refund_payment(
        payment.stripe_payment_id,
        refund_data.amount
      );
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'REFUND_PAYMENT',
        target_type: 'payment',
        target_id: payment.id,
        payload_snapshot: { refund, reason: refund_data.reason }
      });
      
      return { refund };
    } catch (error) {
      console.error('Payment service refund error:', error);
      throw error;
    }
  }

  async get_payments(app_id, options = {}) {
    try {
      const { limit = 50, offset = 0, customer_id } = options;
      
      const where = { app_id };
      if (customer_id) {
        where.customer_id = customer_id;
      }
      
      return await prisma.payment.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          customer: {
            select: { id: true, email: true, name: true }
          }
        }
      });
    } catch (error) {
      console.error('Payment service get payments error:', error);
      throw error;
    }
  }

  async get_payment_by_id(app_id, payment_id) {
    try {
      return await prisma.payment.findFirst({
        where: { id: payment_id, app_id },
        include: {
          customer: {
            select: { id: true, email: true, name: true }
          }
        }
      });
    } catch (error) {
      console.error('Payment service get payment error:', error);
      throw error;
    }
  }

  async update_payment_status(app_id, payment_id, status) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { id: payment_id, app_id }
      });
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      return await prisma.payment.update({
        where: { id: payment_id },
        data: { status }
      });
    } catch (error) {
      console.error('Payment service update status error:', error);
      throw error;
    }
  }
}

export default new PaymentService();