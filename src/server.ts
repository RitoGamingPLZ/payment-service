import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import prisma from './lib/prisma.js';
import { authenticate } from './middleware/auth.middleware.js';
import customer_routes from './routes/customer.routes.js';
import subscription_routes from './routes/subscription.routes.js';
import subscription_plan_routes from './routes/subscription-plan.routes.js';
import payment_routes from './routes/payment.routes.js';
import usage_routes from './routes/usage.routes.js';
import webhook_routes from './routes/webhook.routes.js';
import audit_routes from './routes/audit.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Webhook routes (no authentication needed)
app.use('/api/webhooks', webhook_routes);

// API routes with authentication
app.use('/api/customers', authenticate, customer_routes);
app.use('/api/subscriptions', authenticate, subscription_routes);
app.use('/api/subscription-plans', authenticate, subscription_plan_routes);
app.use('/api/payments', authenticate, payment_routes);
app.use('/api/usage', authenticate, usage_routes);
app.use('/api/audit', authenticate, audit_routes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});

export default app;