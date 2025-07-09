import express from 'express';
import audit_controller from '../controllers/audit_controller.js';

const router = express.Router();

router.get('/', audit_controller.get_audit_logs);

router.get('/summary', audit_controller.get_audit_summary);

export default router;