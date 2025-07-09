import 'reflect-metadata';
import express from 'express';
import { validateDto } from '../middleware/validation.middleware.js';
import usage_controller from '../controllers/usage.controller.js';
import { 
  CreateUsageDto, 
  CreateBatchUsageDto, 
  CreateCarryOverUsageDto, 
  GetUsageQueryDto, 
  GetUsageForPeriodQueryDto 
} from '../dto/usage.dto.js';

const router = express.Router();

router.post('/', 
  validateDto(CreateUsageDto),
  usage_controller.create_usage
);

router.post('/batch', 
  validateDto(CreateBatchUsageDto),
  usage_controller.create_batch_usage
);

router.post('/carry-over', 
  validateDto(CreateCarryOverUsageDto),
  usage_controller.create_carry_over_usage
);

router.get('/', 
  usage_controller.get_usage
);

router.get('/summary', 
  usage_controller.get_usage_summary
);

router.get('/period', 
  usage_controller.get_usage_for_period
);

export default router;