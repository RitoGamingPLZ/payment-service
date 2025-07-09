#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-detect DTOs and generate schemas
function generateSchemasFromDTOs(): any {
  try {
    // Import all DTO files to register class-validator metadata
    const dtoDir = path.join(__dirname, '../src/dto');
    const dtoFiles = fs.readdirSync(dtoDir).filter(file => file.endsWith('.dto.ts'));
    
    console.log('📝 Found DTO files:', dtoFiles);
    
    // Dynamic import all DTOs
    const schemas = validationMetadatasToSchemas({
      refPointerPrefix: '#/components/schemas/',
      classTransformerMetadataStorage: undefined,
    });
    
    return schemas;
  } catch (error) {
    console.warn('⚠️  Could not auto-generate schemas from DTOs:', error);
    return {};
  }
}

// Auto-detect routes from existing route files
function scanRoutes(): any {
  const routesDir = path.join(__dirname, '../src/routes');
  const paths: any = {};
  
  if (!fs.existsSync(routesDir)) {
    console.warn('⚠️  Routes directory not found');
    return paths;
  }
  
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.routes.ts'));
  console.log('🛣️  Found route files:', routeFiles);
  
  routeFiles.forEach(file => {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    const resourceName = file.replace('.routes.ts', '');
    
    // Simple patterns to detect common routes
    const patterns = [
      { method: 'get', path: '/', summary: `List ${resourceName}` },
      { method: 'post', path: '/', summary: `Create ${resourceName}` },
      { method: 'get', path: '/:id', summary: `Get ${resourceName}` },
      { method: 'put', path: '/:id', summary: `Update ${resourceName}` },
      { method: 'delete', path: '/:id', summary: `Delete ${resourceName}` },
    ];
    
    patterns.forEach(pattern => {
      const regex = new RegExp(`router\\.${pattern.method}\\s*\\(\\s*['"\`]${pattern.path.replace('/', '\\/')}['"\`]`, 'i');
      if (regex.test(content)) {
        const fullPath = `/${resourceName}${pattern.path === '/' ? '' : pattern.path}`;
        const pathKey = fullPath.replace(':id', '{id}');
        
        if (!paths[pathKey]) {
          paths[pathKey] = {};
        }
        
        paths[pathKey][pattern.method] = {
          summary: pattern.summary,
          tags: [resourceName.charAt(0).toUpperCase() + resourceName.slice(1)],
          parameters: pattern.path.includes(':id') ? [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ] : undefined,
          requestBody: ['post', 'put', 'patch'].includes(pattern.method) ? {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          } : undefined,
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
            '400': {
              description: 'Bad Request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '404': {
              description: 'Not Found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        };
      }
    });
  });
  
  return paths;
}

// Generate minimal swagger spec
function generateMinimalSpec(): any {
  const schemas = generateSchemasFromDTOs();
  const paths = scanRoutes();
  
  return {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API',
      version: '1.0.0',
      description: 'Auto-generated API documentation for Payment Service',
      contact: {
        name: 'API Support',
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
          name: 'X-API-Key',
          description: 'API key for authentication'
        }
      },
      schemas: {
        ...schemas,
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
            }
          },
          required: ['error']
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
      }
    },
    security: [{ ApiKeyAuth: [] }],
    paths: Object.keys(paths).length > 0 ? paths : {
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['System'],
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
}

// Main execution
function main() {
  console.log('🚀 Auto-generating Swagger documentation...\n');
  
  const spec = generateMinimalSpec();
  
  // Write JSON file
  const jsonPath = path.join(__dirname, '../docs/swagger-auto.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(spec, null, 2));
  
  // Write TypeScript file
  const tsPath = path.join(__dirname, '../src/config/swagger-generated.ts');
  fs.mkdirSync(path.dirname(tsPath), { recursive: true });
  fs.writeFileSync(tsPath, `// Auto-generated swagger spec
export default ${JSON.stringify(spec, null, 2)};`);
  
  console.log('✅ Swagger documentation generated successfully!');
  console.log(`📄 JSON: ${jsonPath}`);
  console.log(`📄 TypeScript: ${tsPath}`);
  console.log(`\n🔗 To view:`);
  console.log(`   npm run swagger:serve`);
  console.log(`   Then open: http://localhost:3001/api-docs`);
  console.log(`\n💡 Import into Postman:`);
  console.log(`   Use: http://localhost:3001/swagger.json`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}