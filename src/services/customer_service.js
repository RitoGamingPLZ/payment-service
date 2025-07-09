import prisma from '../lib/prisma.js';
import { create_audit_log } from './audit_service.js';

export class CustomerService {
  async create_customer(app_id, customer_data) {
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

  async get_customers(app_id, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      return await prisma.customer.findMany({
        where: { app_id },
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      });
    } catch (error) {
      console.error('Customer service get customers error:', error);
      throw error;
    }
  }

  async get_customer_by_id(app_id, customer_id) {
    try {
      return await prisma.customer.findFirst({
        where: { id: customer_id, app_id },
        include: {
          subscriptions: true,
          payments: true,
          usage_records: true,
          grace_periods: true
        }
      });
    } catch (error) {
      console.error('Customer service get customer error:', error);
      throw error;
    }
  }

  async update_customer(app_id, customer_id, update_data) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: customer_id, app_id }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const updated_customer = await prisma.customer.update({
        where: { id: customer_id },
        data: update_data
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

  async delete_customer(app_id, customer_id) {
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
      
      return { success: true };
    } catch (error) {
      console.error('Customer service delete error:', error);
      throw error;
    }
  }
}

export default new CustomerService();