import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Payment Service API',
    version: '1.0.0',
    description: 'A backend payment microservice for multi-tenant SaaS applications with quota management',
    contact: {
      name: 'Lin Fung Chiu',
      email: 'support@paymentservice.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.paymentservice.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          code: {
            type: 'string',
            description: 'Error code'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        },
        required: ['error']
      },
      Customer: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Customer ID'
          },
          app_id: {
            type: 'string',
            format: 'uuid',
            description: 'Application ID'
          },
          stripe_customer_id: {
            type: 'string',
            description: 'Stripe customer ID'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Customer email'
          },
          name: {
            type: 'string',
            description: 'Customer name'
          },
          metadata: {
            type: 'object',
            description: 'Additional customer metadata'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        },
        required: ['id', 'app_id', 'stripe_customer_id', 'email']
      },
      QuotaPlan: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Quota plan ID'
          },
          app_id: {
            type: 'string',
            format: 'uuid',
            description: 'Application ID'
          },
          name: {
            type: 'string',
            description: 'Quota plan name'
          },
          description: {
            type: 'string',
            description: 'Quota plan description'
          },
          billing_type: {
            type: 'string',
            enum: ['subscription', 'usage', 'hybrid'],
            description: 'Billing type'
          },
          quotas: {
            type: 'object',
            description: 'Quota limits per metric',
            example: {
              api_calls: 1000,
              storage_gb: 5,
              users: 10
            }
          },
          overage_rates: {
            type: 'object',
            description: 'Overage rates per metric',
            example: {
              api_calls: 0.001,
              storage_gb: 0.1
            }
          },
          reset_period: {
            type: 'string',
            enum: ['monthly', 'yearly', 'weekly', 'daily', 'none'],
            description: 'Quota reset period'
          },
          carry_over: {
            type: 'boolean',
            description: 'Allow unused quota to carry over'
          },
          max_carry_over: {
            type: 'object',
            description: 'Maximum carry-over per metric'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        },
        required: ['id', 'app_id', 'name', 'billing_type', 'quotas', 'reset_period']
      },
      Subscription: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Subscription ID'
          },
          app_id: {
            type: 'string',
            format: 'uuid',
            description: 'Application ID'
          },
          customer_id: {
            type: 'string',
            format: 'uuid',
            description: 'Customer ID'
          },
          stripe_subscription_id: {
            type: 'string',
            description: 'Stripe subscription ID'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'canceled', 'trialing', 'past_due'],
            description: 'Subscription status'
          },
          price_id: {
            type: 'string',
            description: 'Stripe price ID'
          },
          quantity: {
            type: 'integer',
            description: 'Subscription quantity'
          },
          quota_plan_id: {
            type: 'string',
            format: 'uuid',
            description: 'Associated quota plan ID'
          },
          trial_start: {
            type: 'string',
            format: 'date-time',
            description: 'Trial start date'
          },
          trial_end: {
            type: 'string',
            format: 'date-time',
            description: 'Trial end date'
          },
          current_period_start: {
            type: 'string',
            format: 'date-time',
            description: 'Current billing period start'
          },
          current_period_end: {
            type: 'string',
            format: 'date-time',
            description: 'Current billing period end'
          },
          cancel_at_period_end: {
            type: 'boolean',
            description: 'Cancel at period end'
          },
          metadata: {
            type: 'object',
            description: 'Additional subscription metadata'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        },
        required: ['id', 'app_id', 'customer_id', 'stripe_subscription_id', 'status', 'price_id']
      },
      Usage: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Usage record ID'
          },
          app_id: {
            type: 'string',
            format: 'uuid',
            description: 'Application ID'
          },
          customer_id: {
            type: 'string',
            format: 'uuid',
            description: 'Customer ID'
          },
          subscription_id: {
            type: 'string',
            format: 'uuid',
            description: 'Subscription ID'
          },
          quota_plan_id: {
            type: 'string',
            format: 'uuid',
            description: 'Quota plan ID'
          },
          metric_name: {
            type: 'string',
            description: 'Metric name',
            example: 'api_calls'
          },
          quantity: {
            type: 'integer',
            description: 'Usage quantity'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Usage timestamp'
          },
          carried_over_from_period: {
            type: 'string',
            description: 'Previous period ID if carried over'
          },
          metadata: {
            type: 'object',
            description: 'Additional usage metadata'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          }
        },
        required: ['id', 'app_id', 'customer_id', 'metric_name', 'quantity', 'timestamp']
      },
      QuotaStatus: {
        type: 'object',
        properties: {
          allowed: {
            type: 'boolean',
            description: 'Whether the quota allows the requested usage'
          },
          current_usage: {
            type: 'integer',
            description: 'Current usage in the period'
          },
          quota_limit: {
            type: 'integer',
            description: 'Quota limit for the metric'
          },
          remaining: {
            type: 'integer',
            description: 'Remaining quota'
          },
          would_exceed: {
            type: 'boolean',
            description: 'Whether the request would exceed quota'
          },
          overage_amount: {
            type: 'integer',
            description: 'Amount of overage if exceeded'
          },
          period_start: {
            type: 'string',
            format: 'date-time',
            description: 'Current period start'
          },
          period_end: {
            type: 'string',
            format: 'date-time',
            description: 'Current period end'
          }
        },
        required: ['allowed', 'current_usage', 'quota_limit', 'remaining', 'would_exceed', 'overage_amount']
      },
      Payment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Payment ID'
          },
          app_id: {
            type: 'string',
            format: 'uuid',
            description: 'Application ID'
          },
          customer_id: {
            type: 'string',
            format: 'uuid',
            description: 'Customer ID'
          },
          subscription_id: {
            type: 'string',
            format: 'uuid',
            description: 'Subscription ID'
          },
          stripe_payment_id: {
            type: 'string',
            description: 'Stripe payment intent ID'
          },
          amount: {
            type: 'integer',
            description: 'Payment amount in cents'
          },
          currency: {
            type: 'string',
            description: 'Payment currency'
          },
          status: {
            type: 'string',
            enum: ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'requires_capture', 'canceled'],
            description: 'Payment status'
          },
          payment_method: {
            type: 'string',
            description: 'Payment method'
          },
          description: {
            type: 'string',
            description: 'Payment description'
          },
          metadata: {
            type: 'object',
            description: 'Additional payment metadata'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        },
        required: ['id', 'app_id', 'customer_id', 'stripe_payment_id', 'amount', 'currency', 'status']
      }
    }
  },
  security: [
    {
      ApiKeyAuth: []
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;