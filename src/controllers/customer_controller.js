import customer_service from '../services/customer_service.js';

export class CustomerController {
  async create_customer(req, res) {
    try {
      const { email, name, stripe_customer_id, metadata } = req.body;
      
      const customer = await customer_service.create_customer(req.app_id, {
        email,
        name,
        stripe_customer_id,
        metadata
      });
      
      res.status(201).json(customer);
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }

  async get_customers(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const customers = await customer_service.get_customers(req.app_id, {
        limit,
        offset
      });
      
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Failed to retrieve customers' });
    }
  }

  async get_customer_by_id(req, res) {
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

  async update_customer(req, res) {
    try {
      const { id } = req.params;
      const { email, name, metadata } = req.body;
      
      const updated_customer = await customer_service.update_customer(req.app_id, id, {
        email,
        name,
        metadata
      });
      
      res.json(updated_customer);
    } catch (error) {
      console.error('Update customer error:', error);
      if (error.message === 'Customer not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update customer' });
    }
  }

  async delete_customer(req, res) {
    try {
      const { id } = req.params;
      
      const result = await customer_service.delete_customer(req.app_id, id);
      
      res.json(result);
    } catch (error) {
      console.error('Delete customer error:', error);
      if (error.message === 'Customer not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  }
}

export default new CustomerController();