import prisma from '../lib/prisma.js';

export const create_audit_log = async ({
  app_id,
  actor_id,
  action_type,
  target_type,
  target_id,
  payload_snapshot
}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        app_id,
        actor_id,
        action_type,
        target_type,
        target_id,
        payload_snapshot
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
    throw error;
  }
};

export class AuditService {
  async get_audit_logs(app_id, options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        action_type, 
        target_type, 
        target_id,
        start_date,
        end_date
      } = options;
      
      const where = { app_id };
      
      if (action_type) {
        where.action_type = action_type;
      }
      if (target_type) {
        where.target_type = target_type;
      }
      if (target_id) {
        where.target_id = target_id;
      }
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) {
          where.created_at.gte = new Date(start_date);
        }
        if (end_date) {
          where.created_at.lte = new Date(end_date);
        }
      }
      
      return await prisma.auditLog.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      });
    } catch (error) {
      console.error('Audit service get logs error:', error);
      throw error;
    }
  }

  async get_audit_summary(app_id, options = {}) {
    try {
      const { start_date, end_date } = options;
      
      const where = { app_id };
      
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) {
          where.created_at.gte = new Date(start_date);
        }
        if (end_date) {
          where.created_at.lte = new Date(end_date);
        }
      }
      
      const audit_logs = await prisma.auditLog.findMany({
        where,
        select: {
          action_type: true,
          target_type: true,
          created_at: true
        }
      });
      
      const summary = audit_logs.reduce((acc, log) => {
        const key = `${log.action_type}_${log.target_type}`;
        if (!acc[key]) {
          acc[key] = {
            action_type: log.action_type,
            target_type: log.target_type,
            count: 0,
            first_occurrence: log.created_at,
            last_occurrence: log.created_at
          };
        }
        
        acc[key].count += 1;
        
        if (log.created_at < acc[key].first_occurrence) {
          acc[key].first_occurrence = log.created_at;
        }
        if (log.created_at > acc[key].last_occurrence) {
          acc[key].last_occurrence = log.created_at;
        }
        
        return acc;
      }, {});
      
      return Object.values(summary);
    } catch (error) {
      console.error('Audit service get summary error:', error);
      throw error;
    }
  }
}

export default new AuditService();