/**
 * src/api.js
 */
import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'

import { router as yrunnerRouter } from './routes/yrunnerRoute.js'
import { handle404 } from './middleware/handle404.js'

import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger.js'

const app = express()

// Parse JSON bodies
app.use(express.json())

// Log requests
app.use(morgan('dev'))

// Mount yrunner routes under /api/v1/yr
app.use('/api/v1/yr', yrunnerRouter)

// Serve Swagger UI at /
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Catch all route
app.use(handle404)

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ API server running at http://localhost:${PORT}/api/v1/yr`)
  console.log(`📖 Swagger docs available at http://localhost:${PORT}/`)
})
