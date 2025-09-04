import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config/index.js'
import { connectWithRetry, getDatabaseHealth, disconnectDatabase } from './utils/database.js'

const app = express()
const PORT = config.server.port

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await getDatabaseHealth()
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth
    }
    
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    })
  }
})

// Basic API routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Persona Compass API',
    version: '0.1.0',
    status: 'running'
  })
})

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Start server with database connection
const startServer = async () => {
  try {
    // Test database connection with retry logic
    const connected = await connectWithRetry()
    
    if (!connected) {
      console.error('Failed to connect to database. Server will not start.')
      process.exit(1)
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 API server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await disconnectDatabase()
  process.exit(0)
})

// Start the server
startServer()