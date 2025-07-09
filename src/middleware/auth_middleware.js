import prisma from '../lib/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const api_key = req.headers['x-api-key'];
    
    if (!api_key) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    const app = await prisma.app.findUnique({
      where: { api_key }
    });
    
    if (!app) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    req.app = app;
    req.app_id = app.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};