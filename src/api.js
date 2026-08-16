/**
 * api.js
 */
import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import path from 'path'
import cors from 'cors' // 1. 引入 cors 套件

import { router as yrunnerRouter } from './routes/yrunnerRoute.js'
import { handle404 } from './middleware/handle404.js'

import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger.js'

const app = express()

// 2. 啟用 CORS（必須放在解析 body 和路由之前）
// 這樣做能允許不論是本機 localhost、遠端 pxeserver 還是不同的 Port 都能正常發送 API 請求
app.use(cors())

// Parse JSON bodies
app.use(express.json())

// Log requests
app.use(morgan('dev'))

// Mount yrunner routes under /api/v1/yr
app.use('/api/v1/yr', yrunnerRouter)

// Serve the raw Swagger spec
app.get('/swagger.json', (req, res) => {
  res.json(swaggerSpec)
})

// Serve custom Swagger UI wrapper with footer
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src', 'swagger.html'))
})

// Catch all route
app.use(handle404)

// Start server
const PORT = process.env.API_PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ API server running at http://localhost:${PORT}/api/v1/yr`)
  console.log(`📖 Swagger docs available at http://localhost:${PORT}/`)
})

/*
XE21c/
  ├── package.json
  ├── .env                     # Environment variables (DB connection, secrets)
  ├── docker-compose.yml       # Container orchestration
  ├── Makefile                 # Automation tasks
  ├── init.sql                 # Initialization script executed on first boot
  ├── prometheus.yml           # Configuration file for Prometheus
  ├── src/
  │   ├── api.js               # Main Express app entry
  │   ├── swagger.js           # Swagger configuration
  │   ├── swagger.html         # Custom footer
  │   ├── yrunner.js           # YRunner utility
  │   ├── runSqlPlus.js        # SQLPlus wrapper 
  │   ├── testConn.js          # Test connection
  │   ├── config/              # Configuration folder
  │   │   └── dbConfig.js      # Oracle database config
  │   ├── routes/              # Route definitions
  │   │   └── yrunnerRoute.js  # YRunner route
  │   ├── middleware/          # Custom middleware
  │   │   └── handle404.js     # Catch-all 404 handler
  │   └── utils/               # Utility folder
  │       └── lowerKeys.js     # Convert keys to lowercase
  ├── sample/                  # Sample data folder
  ├── tool/                    # Tool folder
  └── docs/                    # Documentation folder
*/