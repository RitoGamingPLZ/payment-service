import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit.service.js';

interface CreateCustomerData {
  email: string;
  name?: string;
  stripe_customer_id: string;
  metadata?: Record<string, any>;
}

interface UpdateCustomerData {
  email?: string;
  name?: string;
  metadata?: Record<string, any>;
}

interface GetCustomersOptions {
  limit?: number;
  offset?: number;
  email?: string;
  name?: string;
}

export class CustomerService {
  async create_customer(app_id: string, customer_data: CreateCustomerData) {
    try {
      const customer = await prisma.customer.create({
        data: {
          app_id,
          email: customer_data.email,
          name: customer_data.name,
          stripe_customer_id: customer_data.stripe_customer_id,
          metadata: customer_data.metadata
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'CREATE_CUSTOMER',
        target_type: 'customer',
        target_id: customer.id,
        payload_snapshot: customer
      });
      
      return customer;
    } catch (error) {
      console.error('Customer service create error:', error);
      throw error;
    }
  }

  async get_customers(app_id: string, options: GetCustomersOptions = {}) {
    try {
      const { limit = 50, offset = 0, email, name } = options;
      
      const where: any = { app_id };
      if (email) {
        where.email = { contains: email, mode: 'insensitive' };
      }
      if (name) {
        where.name = { contains: name, mode: 'insensitive' };
      }
      
      return await prisma.customer.findMany({
        where,
        skip: parseInt(offset.toString()),
        take: parseInt(limit.toString()),
        orderBy: { created_at: 'desc' },
        include: {
          subscriptions: {
            select: { id: true, status: true, price_id: true }
          },
          payments: {
            select: { id: true, status: true, amount: true }
          }
        }
      });
    } catch (error) {
      console.error('Customer service get customers error:', error);
      throw error;
    }
  }

  async get_customer_by_id(app_id: string, customer_id: string) {
    try {
      return await prisma.customer.findFirst({
        where: { id: customer_id, app_id },
        include: {
          subscriptions: {
            include: {
              quota_plan: {
                select: { id: true, name: true, billing_type: true }
              }
            }
          },
          payments: true,
          usage: {
            take: 10,
            orderBy: { timestamp: 'desc' }
          }
        }
      });
    } catch (error) {
      console.error('Customer service get customer error:', error);
      throw error;
    }
  }

  async update_customer(app_id: string, customer_id: string, update_data: UpdateCustomerData) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: customer_id, app_id }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const updated_customer = await prisma.customer.update({
        where: { id: customer_id },
        data: {
          email: update_data.email || customer.email,
          name: update_data.name || customer.name,
          metadata: update_data.metadata || customer.metadata || {}
        }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'UPDATE_CUSTOMER',
        target_type: 'customer',
        target_id: customer_id,
        payload_snapshot: updated_customer
      });
      
      return updated_customer;
    } catch (error) {
      console.error('Customer service update error:', error);
      throw error;
    }
  }

  async delete_customer(app_id: string, customer_id: string) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: customer_id, app_id }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      await prisma.customer.delete({
        where: { id: customer_id }
      });
      
      await create_audit_log({
        app_id,
        actor_id: app_id,
        action_type: 'DELETE_CUSTOMER',
        target_type: 'customer',
        target_id: customer_id,
        payload_snapshot: customer
      });
      
      return { message: 'Customer deleted successfully' };
    } catch (error) {
      console.error('Customer service delete error:', error);
      throw error;
    }
  }

  async get_customer_by_stripe_id(app_id: string, stripe_customer_id: string) {
    try {
      return await prisma.customer.findFirst({
        where: { stripe_customer_id, app_id }
      });
    } catch (error) {
      console.error('Customer service get by stripe id error:', error);
      throw error;
    }
  }
}

export default new CustomerService();