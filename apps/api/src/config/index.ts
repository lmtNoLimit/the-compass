import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface Config {
  database: {
    url: string
    maxRetries: number
    retryDelay: number
  }
  server: {
    port: number
    nodeEnv: string
  }
}

export const config: Config = {
  database: {
    url: process.env.DATABASE_URL || '',
    maxRetries: 5,
    retryDelay: 1000
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development'
  }
}

// Validation
if (!config.database.url && config.server.nodeEnv !== 'test') {
  console.warn('Warning: DATABASE_URL is not set. Database connection will fail.')
}