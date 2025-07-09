#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RouteInfo {
  method: string;
  path: string;
  handler: string;
  middleware?: string[];
}

interface EndpointSpec {
  method: string;
  path: string;
  summary: string;
  tags: string[];
  parameters?: any[];
  requestBody?: any;
  responses: any;
}

// Auto-detect routes from files
function parseRouteFile(filePath: string): RouteInfo[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const routes: RouteInfo[] = [];
  
  // Simple regex to find router methods
  const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g;
  
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const [, method, path, handlers] = match;
    
    // Extract handler and middleware
    const handlerParts = handlers.split(',').map(h => h.trim());
    const handler = handlerParts[handlerParts.length - 1];
    const middleware = handlerParts.slice(0, -1);
    
    routes.push({
      method: method.toUpperCase(),
      path,
      handler,
      middleware
    });
  }
  
  return routes;
}

// Generate swagger spec from routes
function generateSwaggerSpec(routes: RouteInfo[], routeFileName: string): EndpointSpec[] {
  const tag = routeFileName.replace('.routes.ts', '').replace(/s$/, ''); // Remove 's' for singular
  const tagCapitalized = tag.charAt(0).toUpperCase() + tag.slice(1) + 's';
  
  return routes.map(route => {
    const spec: EndpointSpec = {
      method: route.method.toLowerCase(),
      path: route.path.replace(/:([^/]+)/g, '{$1}'), // Convert :id to {id}
      summary: generateSummary(route.method, route.path, tag),
      tags: [tagCapitalized],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object'
              }
            }
          }
        },
        '400': {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        '404': {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        '500': {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    };
    
    // Add path parameters
    const pathParams = route.path.match(/:([^/]+)/g);
    if (pathParams) {
      spec.parameters = pathParams.map(param => ({
        in: 'path',
        name: param.substring(1),
        required: true,
        schema: {
          type: 'string'
        }
      }));
    }
    
    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      spec.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object'
            }
          }
        }
      };
    }
    
    // Add query parameters for GET
    if (route.method === 'GET' && route.path === '/') {
      spec.parameters = [
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 50
          }
        },
        {
          in: 'query',
          name: 'offset',
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0
          }
        }
      ];
    }
    
    return spec;
  });
}

function generateSummary(method: string, path: string, resource: string): string {
  const resourceCapitalized = resource.charAt(0).toUpperCase() + resource.slice(1);
  
  switch (method) {
    case 'GET':
      return path.includes(':') ? `Get ${resourceCapitalized}` : `List ${resourceCapitalized}s`;
    case 'POST':
      return `Create ${resourceCapitalized}`;
    case 'PUT':
      return `Update ${resourceCapitalized}`;
    case 'DELETE':
      return `Delete ${resourceCapitalized}`;
    case 'PATCH':
      return `Partially Update ${resourceCapitalized}`;
    default:
      return `${method} ${resourceCapitalized}`;
  }
}

// Generate complete swagger spec
function generateCompleteSpec(): any {
  const routesDir = path.join(__dirname, '../src/routes');
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.routes.ts'));
  
  const allPaths: any = {};
  
  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    const routes = parseRouteFile(filePath);
    const specs = generateSwaggerSpec(routes, file);
    
    specs.forEach(spec => {
      if (!allPaths[spec.path]) {
        allPaths[spec.path] = {};
      }
      
      allPaths[spec.path][spec.method] = {
        summary: spec.summary,
        tags: spec.tags,
        parameters: spec.parameters,
        requestBody: spec.requestBody,
        responses: spec.responses
      };
    });
  });
  
  return {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API',
      version: '1.0.0',
      description: 'Auto-generated from route files'
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
            error: {
              type: 'string'
            },
            code: {
              type: 'string'
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
    paths: allPaths
  };
}

// Main execution
function main() {
  const spec = generateCompleteSpec();
  const outputPath = path.join(__dirname, '../docs/swagger-generated.json');
  
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  
  console.log('✅ Swagger specification generated successfully!');
  console.log(`📄 File: ${outputPath}`);
  console.log(`🔗 View at: http://localhost:3000/api-docs`);
  
  // Also generate a TypeScript file
  const tsOutputPath = path.join(__dirname, '../src/config/swagger-generated.ts');
  const tsContent = `// Auto-generated swagger spec
export default ${JSON.stringify(spec, null, 2)};`;
  
  fs.writeFileSync(tsOutputPath, tsContent);
  console.log(`📄 TypeScript file: ${tsOutputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}