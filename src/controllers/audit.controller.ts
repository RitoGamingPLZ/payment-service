import { Request, Response } from 'express';
import audit_service from '../services/audit.service.js';
import { 
  GetAuditLogsQueryDto, 
  GetAuditSummaryQueryDto 
} from '../dto/audit.dto.js';

export class AuditController {
  async get_audit_logs(req: Request, res: Response) {
    try {
      const query: GetAuditLogsQueryDto = req.query;
      
      const audit_logs = await audit_service.get_audit_logs(req.app_id, query);
      
      res.json(audit_logs);
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  }

  async get_audit_summary(req: Request, res: Response) {
    try {
      const query: GetAuditSummaryQueryDto = req.query;
      
      const summary = await audit_service.get_audit_summary(req.app_id, query);
      
      res.json(summary);
    } catch (error) {
      console.error('Get audit summary error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit summary' });
    }
  }
}

export default new AuditController();