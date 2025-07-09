import 'reflect-metadata';
import express from 'express';
import { validateDto } from '../middleware/validation.middleware.js';
import customer_controller from '../controllers/customer.controller.js';
import { CreateCustomerDto, UpdateCustomerDto, GetCustomersQueryDto } from '../dto/customer.dto.js';

const router = express.Router();

router.post('/', 
  validateDto(CreateCustomerDto, 'body'),
  customer_controller.create_customer
);

router.get('/', 
  validateDto(GetCustomersQueryDto, 'query'),
  customer_controller.get_customers
);

router.get('/:id', 
  customer_controller.get_customer_by_id
);

router.put('/:id', 
  validateDto(UpdateCustomerDto, 'body'),
  customer_controller.update_customer
);

router.delete('/:id', 
  customer_controller.delete_customer
);

export default router;