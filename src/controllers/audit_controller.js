import audit_service from '../services/audit_service.js';

export class AuditController {
  async get_audit_logs(req, res) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        action_type, 
        target_type, 
        target_id,
        start_date,
        end_date
      } = req.query;
      
      const audit_logs = await audit_service.get_audit_logs(req.app_id, {
        limit,
        offset,
        action_type,
        target_type,
        target_id,
        start_date,
        end_date
      });
      
      res.json(audit_logs);
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  }

  async get_audit_summary(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const summary = await audit_service.get_audit_summary(req.app_id, {
        start_date,
        end_date
      });
      
      res.json(summary);
    } catch (error) {
      console.error('Get audit summary error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit summary' });
    }
  }
}

export default new AuditController();