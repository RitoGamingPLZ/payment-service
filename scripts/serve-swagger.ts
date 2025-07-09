#!/usr/bin/env tsx

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../src/config/swagger-auto.js';

const app = express();
const PORT = 3001;

// Serve swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Payment Service API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
}));

// Serve raw swagger spec
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.listen(PORT, () => {
  console.log(`📚 Swagger UI available at: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 Raw spec available at: http://localhost:${PORT}/swagger.json`);
  console.log(`\n💡 Tips:`);
  console.log(`  - Import swagger.json into Postman`);
  console.log(`  - Use "Try it out" in Swagger UI`);
  console.log(`  - Add X-API-Key header for authentication`);
});