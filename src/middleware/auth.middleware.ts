import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

// Extend the Request interface to include app_id
declare global {
  namespace Express {
    interface Request {
      app_id: string;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const api_key = req.headers['x-api-key'] as string;
    
    if (!api_key) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    const app = await prisma.app.findUnique({
      where: { api_key }
    });
    
    if (!app) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    req.app_id = app.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};