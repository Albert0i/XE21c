// src/swagger.js
import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'YRunner API',
      version: '1.0.0',
      description: 'Oracle SQL Runner REST API',
      'x-footer': '© 2026 All Rights Reserved. Built with help from Microsoft Copilot',
    }
  },
  apis: ['./src/routes/*.js'], // path to your route files with JSDoc comments
}

const swaggerSpec = swaggerJsdoc(options)

export { swaggerSpec }
