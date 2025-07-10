import 'reflect-metadata';
import express from 'express';
import { validateDto } from '../middleware/validation.middleware.js';
import subscription_plan_controller from '../controllers/subscription-plan.controller.js';
import { 
  CreateSubscriptionPlanDto, 
  UpdateSubscriptionPlanDto
} from '../dto/subscription-plan.dto.js';

const router = express.Router();

router.post('/', 
  validateDto(CreateSubscriptionPlanDto),
  subscription_plan_controller.create_subscription_plan
);

router.get('/', 
  subscription_plan_controller.get_subscription_plans
);

router.get('/public', 
  subscription_plan_controller.get_public_plans
);

router.get('/public/:slug', 
  subscription_plan_controller.get_subscription_plan_by_slug
);

router.get('/:id', 
  subscription_plan_controller.get_subscription_plan_by_id
);

router.put('/:id', 
  validateDto(UpdateSubscriptionPlanDto),
  subscription_plan_controller.update_subscription_plan
);

router.delete('/:id', 
  subscription_plan_controller.delete_subscription_plan
);

export default router;