import 'reflect-metadata';
import express from 'express';
import { validateDto } from '../middlewares/validateDto.js';
import subscription_controller from '../controllers/subscription.controller.js';
import { 
  CreateSubscriptionDto, 
  UpdateSubscriptionDto, 
  CancelSubscriptionDto, 
  GetSubscriptionsQueryDto 
} from '../dto/subscription.dto.js';

const router = express.Router();

router.post('/', 
  validateDto(CreateSubscriptionDto),
  subscription_controller.create_subscription
);

router.get('/', 
  subscription_controller.get_subscriptions
);

router.get('/:id', 
  subscription_controller.get_subscription_by_id
);

router.put('/:id', 
  validateDto(UpdateSubscriptionDto),
  subscription_controller.update_subscription
);

router.delete('/:id', 
  validateDto(CancelSubscriptionDto),
  subscription_controller.cancel_subscription
);

export default router;