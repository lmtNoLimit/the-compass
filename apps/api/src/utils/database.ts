import { PrismaClient } from '@prisma/client'
import { config } from '../config/index.js'

// Global prisma instance for connection reuse
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Connection configuration with pooling and error handling
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: config.server.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })
}

// Singleton pattern for database connection
export const prisma = globalThis.__prisma ?? createPrismaClient()

if (config.server.nodeEnv !== 'production') {
  globalThis.__prisma = prisma
}

// Database connection testing utility
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect()
    // Test with a simple query
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Database health check utility
export const getDatabaseHealth = async () => {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - start
    
    return {
      status: 'healthy',
      connection: 'active',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      connection: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// Connection retry logic with exponential backoff
export const connectWithRetry = async (maxRetries = 5, baseDelay = 1000): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect()
      console.log('Database connected successfully')
      return true
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        console.error('Max retry attempts reached. Database connection failed.')
        return false
      }
      
      // Exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`Retrying connection in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return false
}

// Graceful shutdown utility
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    console.log('Database connection closed gracefully')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Process event handlers for graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase()
})

process.on('SIGINT', async () => {
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectDatabase()
  process.exit(0)
})