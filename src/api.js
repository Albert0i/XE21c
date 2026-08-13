/**
 * src/api.js
 */
import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

import { router as yrunnerRouter } from './routes/yrunnerRoute.js'
import { handle404 } from './middleware/handle404.js'

const app = express()

// Parse JSON bodies
app.use(express.json())

// Log requests
app.use(morgan('dev'))

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve static HTML page at /
app.use(express.static(path.join(__dirname, 'public')))

// Mount yrunner routes under /api/v1/yr
app.use('/api/v1/yr', yrunnerRouter)

// Catch all route
app.use(handle404)

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}/api/v1/yr`)
})

/*
  project-root/
  └─ src/
    ├─ api.js
    ├─ routes/
    │   └─ yrunnerRoute.js
    ├─ middleware/
    │   └─ handle404.js
    ├─ config/
    │   └─ dbConfig.js
    ├─ yrunner.js
    └─ public/
        └─ index.html
*/