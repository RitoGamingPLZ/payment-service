import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit.service.js';
import stripe_service from './stripe.service.js';

interface CreatePaymentIntentData {
  customer_id: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface RefundPaymentData {
  payment_id: string;
  amount?: number;
  reason?: string;
}

interface GetPaymentsOptions {
  limit?: number;
  offset?: number;
  customer_id?: string;
  status?: string;
}

export class PaymentService {
  async create_payment_intent(app_id: string, payment_data: CreatePaymentIntentData) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: payment_data.customer_id, app_id }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const stripe_payment_intent = await stripe_service.create_payment_intent(
        payment_data.amount,
        payment_data.currency,
        customer.stripe_customer_id,
        payment_data.description,
        payment_data.metadata
      );
      
      const payment = await prisma.payment.create({
        data: {
          app_id,
          customer_id: payment_data.customer_id,
          stripe_payment_intent_id: stripe_payment_intent.id,
          amount: payment_data.amount,
          currency: payment_data.currency,
          status: stripe_payment_intent.status,
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
        ...payment,
        client_secret: stripe_payment_intent.client_secret
      };
    } catch (error) {
      console.error('Payment service create payment intent error:', error);
      throw error;
    }
  }

  async refund_payment(app_id: string, refund_data: RefundPaymentData) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { id: refund_data.payment_id, app_id }
      });
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      const stripe_refund = await stripe_service.refund_payment(
        payment.stripe_payment_intent_id,
        refund_data.amount,
        refund_data.reason
      );
      
      const updated_payment = await prisma.payment.update({
        where: { id: refund_data.payment_id },
        data: {
          status: 'refunded',
          refunded_amount: stripe_refund.amount
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'REFUND_PAYMENT',
        target_type: 'payment',
        target_id: refund_data.payment_id,
        payload_snapshot: { refund_amount: stripe_refund.amount, reason: refund_data.reason }
      });
      
      return updated_payment;
    } catch (error) {
      console.error('Payment service refund payment error:', error);
      throw error;
    }
  }

  async get_payments(app_id: string, options: GetPaymentsOptions = {}) {
    try {
      const { limit = 50, offset = 0, customer_id, status } = options;
      
      const where: any = { app_id };
      if (customer_id) {
        where.customer_id = customer_id;
      }
      if (status) {
        where.status = status;
      }
      
      return await prisma.payment.findMany({
        where,
        skip: parseInt(offset.toString()),
        take: parseInt(limit.toString()),
        orderBy: { created_at: 'desc' },
        include: {
          customer: {
            select: { id: true, email: true, name: true }
          },
          subscription: {
            select: { id: true, price_id: true, status: true }
          }
        }
      });
    } catch (error) {
      console.error('Payment service get payments error:', error);
      throw error;
    }
  }

  async get_payment_by_id(app_id: string, payment_id: string) {
    try {
      return await prisma.payment.findFirst({
        where: { id: payment_id, app_id },
        include: {
          customer: {
            select: { id: true, email: true, name: true }
          },
          subscription: {
            select: { id: true, price_id: true, status: true }
          }
        }
      });
    } catch (error) {
      console.error('Payment service get payment error:', error);
      throw error;
    }
  }

  async update_payment_from_webhook(stripe_payment_intent_id: string, status: string, metadata?: Record<string, any>) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { stripe_payment_intent_id }
      });
      
      if (!payment) {
        console.warn(`Payment not found for Stripe payment intent: ${stripe_payment_intent_id}`);
        return null;
      }
      
      const updated_payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          metadata: metadata || payment.metadata
        }
      });
      
      await create_audit_log({
        app_id: payment.app_id,
        actor_id: 'stripe_webhook',
        action_type: 'UPDATE_PAYMENT_FROM_WEBHOOK',
        target_type: 'payment',
        target_id: payment.id,
        payload_snapshot: { status, metadata }
      });
      
      return updated_payment;
    } catch (error) {
      console.error('Payment service update from webhook error:', error);
      throw error;
    }
  }
}

export default new PaymentService();