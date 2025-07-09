import { Request, Response } from 'express';
import customer_service from '../services/customer.service.js';
import { CreateCustomerDto, UpdateCustomerDto, GetCustomersQueryDto } from '../dto/customer.dto.js';

export class CustomerController {
  async create_customer(req: Request, res: Response) {
    try {
      const customer_data: CreateCustomerDto = req.body;
      
      const customer = await customer_service.create_customer(req.app_id, customer_data);
      
      res.status(201).json(customer);
    } catch (error) {
      console.error('Create customer error:', error);
      if (error instanceof Error && error.message === 'Customer already exists') {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }

  async get_customers(req: Request, res: Response) {
    try {
      const query: GetCustomersQueryDto = req.query;
      
      const customers = await customer_service.get_customers(req.app_id, query);
      
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Failed to retrieve customers' });
    }
  }

  async get_customer_by_id(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const customer = await customer_service.get_customer_by_id(req.app_id, id);
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ error: 'Failed to retrieve customer' });
    }
  }

  async update_customer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const update_data: UpdateCustomerDto = req.body;
      
      const updated_customer = await customer_service.update_customer(req.app_id, id, update_data);
      
      res.json(updated_customer);
    } catch (error) {
      console.error('Update customer error:', error);
      if (error instanceof Error && error.message === 'Customer not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update customer' });
    }
  }

  async delete_customer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const result = await customer_service.delete_customer(req.app_id, id);
      
      res.json(result);
    } catch (error) {
      console.error('Delete customer error:', error);
      if (error instanceof Error && error.message === 'Customer not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  }
}

export default new CustomerController();