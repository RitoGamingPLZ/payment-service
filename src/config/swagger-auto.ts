import swaggerJSDoc from 'swagger-jsdoc';

// Define actual endpoints based on your services
const paths = {
  '/customers': {
    post: {
      summary: 'Create customer',
      tags: ['Customers'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'name'],
              properties: {
                email: { type: 'string', format: 'email', example: 'customer@example.com' },
                name: { type: 'string', example: 'John Doe' },
                metadata: { type: 'object', example: { company: 'Example Corp' } }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Customer created' },
        '400': { $ref: '#/components/responses/BadRequest' },
        '409': { description: 'Customer already exists' }
      }
    },
    get: {
      summary: 'List customers',
      tags: ['Customers'],
      parameters: [
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
        { in: 'query', name: 'email', schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'List of customers' }
      }
    }
  },
  '/customers/{customer_id}': {
    get: {
      summary: 'Get customer',
      tags: ['Customers'],
      parameters: [
        { in: 'path', name: 'customer_id', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Customer found' },
        '404': { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      summary: 'Update customer',
      tags: ['Customers'],
      parameters: [
        { in: 'path', name: 'customer_id', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Customer updated' },
        '404': { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      summary: 'Delete customer',
      tags: ['Customers'],
      parameters: [
        { in: 'path', name: 'customer_id', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Customer deleted' },
        '404': { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/subscriptions': {
    post: {
      summary: 'Create subscription',
      tags: ['Subscriptions'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['customer_id', 'price_id'],
              properties: {
                customer_id: { type: 'string', example: 'cust_123' },
                price_id: { type: 'string', example: 'price_123' },
                quantity: { type: 'integer', default: 1 },
                quota_plan_id: { type: 'string', example: 'qp_123' },
                trial_period_days: { type: 'integer', example: 14 },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Subscription created' },
        '400': { $ref: '#/components/responses/BadRequest' }
      }
    },
    get: {
      summary: 'List subscriptions',
      tags: ['Subscriptions'],
      parameters: [
        { in: 'query', name: 'customer_id', schema: { type: 'string' } },
        { in: 'query', name: 'status', schema: { type: 'string' } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } }
      ],
      responses: {
        '200': { description: 'List of subscriptions' }
      }
    }
  },
  '/subscriptions/{subscription_id}': {
    get: {
      summary: 'Get subscription',
      tags: ['Subscriptions'],
      parameters: [
        { in: 'path', name: 'subscription_id', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Subscription found' },
        '404': { $ref: '#/components/responses/NotFound' }
      }
    },
    put: {
      summary: 'Update subscription',
      tags: ['Subscriptions'],
      parameters: [
        { in: 'path', name: 'subscription_id', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                price_id: { type: 'string' },
                quantity: { type: 'integer' },
                quota_plan_id: { type: 'string' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Subscription updated' },
        '404': { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      summary: 'Cancel subscription',
      tags: ['Subscriptions'],
      parameters: [
        { in: 'path', name: 'subscription_id', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Subscription cancelled' },
        '404': { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/usage': {
    post: {
      summary: 'Create usage record',
      tags: ['Usage'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['customer_id', 'metric_name', 'quantity'],
              properties: {
                customer_id: { type: 'string', example: 'cust_123' },
                metric_name: { type: 'string', example: 'api_calls' },
                quantity: { type: 'integer', example: 10 },
                subscription_id: { type: 'string', example: 'sub_123' },
                quota_plan_id: { type: 'string', example: 'qp_123' },
                timestamp: { type: 'string', format: 'date-time' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Usage record created' },
        '400': { $ref: '#/components/responses/BadRequest' }
      }
    },
    get: {
      summary: 'Get usage records',
      tags: ['Usage'],
      parameters: [
        { in: 'query', name: 'customer_id', schema: { type: 'string' } },
        { in: 'query', name: 'metric_name', schema: { type: 'string' } },
        { in: 'query', name: 'start_date', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'end_date', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } }
      ],
      responses: {
        '200': { description: 'List of usage records' }
      }
    }
  },
  '/usage/batch': {
    post: {
      summary: 'Create batch usage records',
      tags: ['Usage'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['records'],
              properties: {
                records: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['customer_id', 'metric_name', 'quantity'],
                    properties: {
                      customer_id: { type: 'string' },
                      metric_name: { type: 'string' },
                      quantity: { type: 'integer' },
                      timestamp: { type: 'string', format: 'date-time' },
                      metadata: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Batch usage records created' },
        '400': { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/usage/summary': {
    get: {
      summary: 'Get usage summary',
      tags: ['Usage'],
      parameters: [
        { in: 'query', name: 'customer_id', schema: { type: 'string' } },
        { in: 'query', name: 'start_date', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'end_date', schema: { type: 'string', format: 'date-time' } }
      ],
      responses: {
        '200': { description: 'Usage summary' }
      }
    }
  },
  '/quota/check': {
    get: {
      summary: 'Check quota (read-only)',
      tags: ['Quota'],
      parameters: [
        { in: 'query', name: 'customer_id', required: true, schema: { type: 'string' } },
        { in: 'query', name: 'metric_name', required: true, schema: { type: 'string' } },
        { in: 'query', name: 'requested_quantity', schema: { type: 'integer', default: 1 } }
      ],
      responses: {
        '200': {
          description: 'Quota check result',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/QuotaStatus' }
            }
          }
        },
        '429': { description: 'Quota exceeded' }
      }
    }
  },
  '/quota/check-and-consume': {
    post: {
      summary: 'Check and consume quota (atomic)',
      tags: ['Quota'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['customer_id', 'metric_name', 'requested_quantity'],
              properties: {
                customer_id: { type: 'string', example: 'cust_123' },
                metric_name: { type: 'string', example: 'api_calls' },
                requested_quantity: { type: 'integer', example: 10 },
                quota_plan_id: { type: 'string', example: 'qp_123' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Quota check and consume result',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  quota_check: { $ref: '#/components/schemas/QuotaStatus' },
                  usage_record: { type: 'object' },
                  consumed: { type: 'boolean' }
                }
              }
            }
          }
        },
        '429': { description: 'Quota exceeded' }
      }
    }
  },
  '/quota/batch-check-and-consume': {
    post: {
      summary: 'Batch check and consume quota',
      tags: ['Quota'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['customer_id', 'checks'],
              properties: {
                customer_id: { type: 'string', example: 'cust_123' },
                checks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['metric_name', 'requested_quantity'],
                    properties: {
                      metric_name: { type: 'string' },
                      requested_quantity: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Batch quota check result' },
        '429': { description: 'One or more quotas exceeded' }
      }
    }
  },
  '/payments': {
    post: {
      summary: 'Create payment',
      tags: ['Payments'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['customer_id', 'amount', 'currency'],
              properties: {
                customer_id: { type: 'string', example: 'cust_123' },
                amount: { type: 'integer', example: 2999, description: 'Amount in cents' },
                currency: { type: 'string', example: 'usd' },
                description: { type: 'string', example: 'Monthly subscription' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '201': { description: 'Payment created' },
        '400': { $ref: '#/components/responses/BadRequest' }
      }
    },
    get: {
      summary: 'List payments',
      tags: ['Payments'],
      parameters: [
        { in: 'query', name: 'customer_id', schema: { type: 'string' } },
        { in: 'query', name: 'status', schema: { type: 'string' } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } }
      ],
      responses: {
        '200': { description: 'List of payments' }
      }
    }
  },
  '/payments/{payment_id}': {
    get: {
      summary: 'Get payment',
      tags: ['Payments'],
      parameters: [
        { in: 'path', name: 'payment_id', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Payment found' },
        '404': { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/payments/{payment_id}/refund': {
    post: {
      summary: 'Refund payment',
      tags: ['Payments'],
      parameters: [
        { in: 'path', name: 'payment_id', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amount'],
              properties: {
                amount: { type: 'integer', description: 'Refund amount in cents' },
                reason: { type: 'string', example: 'requested_by_customer' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Payment refunded' },
        '404': { $ref: '#/components/responses/NotFound' }
      }
    }
  },
  '/webhooks/stripe': {
    post: {
      summary: 'Stripe webhook endpoint',
      tags: ['Webhooks'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'payment_intent.succeeded' },
                data: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': { description: 'Webhook processed' },
        '400': { description: 'Invalid webhook' }
      }
    }
  },
  '/audit': {
    get: {
      summary: 'Get audit logs',
      tags: ['Audit'],
      parameters: [
        { in: 'query', name: 'action_type', schema: { type: 'string' } },
        { in: 'query', name: 'target_type', schema: { type: 'string' } },
        { in: 'query', name: 'start_date', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'end_date', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } }
      ],
      responses: {
        '200': { description: 'List of audit logs' }
      }
    }
  }
};

// Build complete swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Payment Service API',
    version: '1.0.0',
    description: 'Auto-generated API documentation from DTOs and JSDoc comments',
    contact: {
      name: 'Lin Fung Chiu',
      email: 'support@paymentservice.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' }
        }
      },
      QuotaStatus: {
        type: 'object',
        properties: {
          allowed: { type: 'boolean' },
          current_usage: { type: 'integer' },
          quota_limit: { type: 'integer' },
          remaining: { type: 'integer' },
          would_exceed: { type: 'boolean' },
          overage_amount: { type: 'integer' },
          period_start: { type: 'string', format: 'date-time' },
          period_end: { type: 'string', format: 'date-time' }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  },
  security: [
    {
      ApiKeyAuth: []
    }
  ],
  tags: [
    {
      name: 'Customers',
      description: 'Customer management endpoints'
    },
    {
      name: 'Subscriptions',
      description: 'Subscription management endpoints'
    },
    {
      name: 'Payments',
      description: 'Payment processing endpoints'
    },
    {
      name: 'Usage',
      description: 'Usage tracking endpoints'
    },
    {
      name: 'Quota',
      description: 'Quota management endpoints'
    },
    {
      name: 'Audit',
      description: 'Audit log endpoints'
    },
    {
      name: 'Webhooks',
      description: 'Webhook endpoints'
    }
  ],
  paths: paths
};

const options = {
  definition: swaggerDefinition,
  apis: [] // No need to scan files since we define paths manually
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;