/**
 * swagger.js
 */
import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'YRunner API',
      version: '1.0.0',
      description: 'Oracle SQL Runner REST API',
      contact: {
        name: 'API Support',
        email: 'albert0i@hotmail.com',
        url: 'https://github.com/Albert0i/XE21c',
      }
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' },
      { url: 'http://pxeserver:3000', description: 'Production' },
    ],
  },
  apis: ['./src/routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

export { swaggerSpec }
