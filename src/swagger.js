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
        name: 'Alberto Iong',
        email: 'albert0i@hotmail.com',
        url: 'https://github.com/Albert0i/XE21c',
      }
    },
    servers: [
      { url: 'http://localhost:1522', description: 'Local development (docker)' },
      { url: 'http://pxeserver:1522', description: 'Production (docker)' },   
      { url: 'http://localhost:3000', description: 'Local development' },
      { url: 'http://pxeserver:3000', description: 'Production' }
    ],
     tags: [
      { name: 'YRunner RESTful', description: 'RESTful API endpoints' },
      { name: 'YRunner Direct', description: 'Run SQL commands' },
    ],
  },
  apis: ['./src/routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

export { swaggerSpec }
