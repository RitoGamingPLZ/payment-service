# Payment Service – Stripe Integration for Multi-Tenant SaaS

A backend payment microservice designed for integration with multiple SaaS applications. It securely handles Stripe-based billing, multi-tenant authentication, usage tracking, and supports hybrid pricing models (subscription + usage). The service is designed to be modular, allowing multiple payment providers to be plugged in as needed.

---

## Features

### Authentication & Tenant Isolation
- API key per SaaS app (tenant).
- All requests are scoped by `app_id`.
- Audit logs record all mutating actions per tenant.

### Flexible Billing Models
Each SaaS app can define its own pricing structure:

#### 1. One-Time Payments
- Process individual charges.
- Supports refunds.

#### 2. Recurring Subscriptions
- Stripe-managed plans (monthly, yearly, etc).
- Trial support via `trial_period_days`.

#### 3. Usage-Based Billing
- Track usage metrics (e.g. API calls, messages).
- Bill based on reported usage (Stripe metered pricing).

#### 4. Hybrid Billing
- Combine base subscription + metered overages.

#### 5. Custom Plans per App
- Each SaaS app defines its own Stripe plans/products.

### Trials & Grace Periods
- **Trial:** Supported via Stripe trial period config.
- **Grace Periods:**
  - Created on over-quota or payment failure.
  - Stored in DB (`grace_periods` table).
  - Expire or resolve manually.

### Audit Logging
- Tracks every mutation (e.g., `SET_USAGE`, `CREATE_SUBSCRIPTION`).
- Captures `app_id`, `actor_id`, `action_type`, `target_type`, and `payload_snapshot`.
- Queryable by admin.

### Stripe Webhooks
- Handles events like:
  - `invoice.payment_failed`
  - `invoice.paid`
  - `customer.subscription.updated`
  - `charge.refunded`
- Keeps internal DB in sync.

### Modular Payment Providers
- Stripe (default)
- PayPal (planned)
- Extensible architecture to support additional providers

---

## Tech Stack

| Layer            | Technology               | Role                                                  |
|------------------|--------------------------|--------------------------------------------------------|
| Backend          | Node.js + Express        | Core API + routing                                     |
| Payments         | Stripe Node SDK          | Charges, subscriptions, webhooks                       |
| ORM / DB         | Prisma + PostgreSQL      | Store tenants, payments, subscriptions, etc.           |
| Auth             | API Key Middleware       | Secure app-to-service access                           |
| Scheduler (opt.) | Node-cron / Temporal     | Handle retries, usage sync, etc.                       |
| Deployment       | Docker / Fly.io / Vercel | Portable, scalable deployment                          |

---

## Requirements

### Development
- Node.js 22 LTS
- PostgreSQL
- Stripe account

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/payment_db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_SECRET=your_random_secret
```

### Next Steps
- Define DB schema in Prisma
- Implement API routes with middleware
- Setup Stripe webhook receiver
- Build admin CLI/dashboard
- Launch SaaS integration for app1/app2/app3# payment-service
