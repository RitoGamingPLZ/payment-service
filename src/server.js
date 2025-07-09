import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import prisma from './lib/prisma.js';
import { authenticate } from './middleware/auth_middleware.js';
import customer_routes from './routes/customer_routes.js';
import subscription_routes from './routes/subscription_routes.js';
import payment_routes from './routes/payment_routes.js';
import usage_routes from './routes/usage_routes.js';
import webhook_routes from './routes/webhook_routes.js';
import audit_routes from './routes/audit_routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

app.use(helmet());
app.use(cors());
app.use(limiter);

// Webhooks need raw body, so it comes before JSON parsing
app.use('/webhooks', webhook_routes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// All API routes require authentication
app.use('/api/customers', authenticate, customer_routes);
app.use('/api/subscriptions', authenticate, subscription_routes);
app.use('/api/payments', authenticate, payment_routes);
app.use('/api/usage', authenticate, usage_routes);
app.use('/api/audit', authenticate, audit_routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
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

export default app;