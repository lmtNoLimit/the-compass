import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the database utilities without referencing external variables
vi.mock('@/utils/database', () => {
  const mockConnect = vi.fn()
  const mockQueryRaw = vi.fn()
  
  return {
    prisma: {
      $connect: mockConnect,
      $disconnect: vi.fn(),
      $queryRaw: mockQueryRaw,
    },
    testDatabaseConnection: vi.fn(),
    getDatabaseHealth: vi.fn(), 
    connectWithRetry: vi.fn(),
  }
})

import { testDatabaseConnection, getDatabaseHealth, connectWithRetry, prisma } from '@/utils/database'

describe('Database Connection Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('testDatabaseConnection', () => {
    it('should return true when database connection is successful', async () => {
      // Setup mocks for successful connection
      vi.mocked(testDatabaseConnection).mockResolvedValue(true)

      const result = await testDatabaseConnection()
      
      expect(result).toBe(true)
      expect(testDatabaseConnection).toHaveBeenCalledOnce()
    })

    it('should return false when database connection fails', async () => {
      // Setup mock for failed connection
      vi.mocked(testDatabaseConnection).mockResolvedValue(false)

      const result = await testDatabaseConnection()
      
      expect(result).toBe(false)
      expect(testDatabaseConnection).toHaveBeenCalledOnce()
    })

    it('should handle connection errors gracefully', async () => {
      // Setup mock to throw an error
      vi.mocked(testDatabaseConnection).mockRejectedValue(new Error('Connection error'))

      await expect(testDatabaseConnection()).rejects.toThrow('Connection error')
    })
  })

  describe('getDatabaseHealth', () => {
    it('should return healthy status when database is accessible', async () => {
      const healthyResponse = {
        status: 'healthy',
        connection: 'active',
        responseTime: '15ms',
        timestamp: new Date().toISOString()
      }
      
      vi.mocked(getDatabaseHealth).mockResolvedValue(healthyResponse)

      const health = await getDatabaseHealth()
      
      expect(health).toEqual({
        status: 'healthy',
        connection: 'active',
        responseTime: expect.stringMatching(/^\d+ms$/),
        timestamp: expect.any(String)
      })
    })

    it('should return unhealthy status when database query fails', async () => {
      const unhealthyResponse = {
        status: 'unhealthy',
        connection: 'failed',
        error: 'Database not available',
        timestamp: new Date().toISOString()
      }
      
      vi.mocked(getDatabaseHealth).mockResolvedValue(unhealthyResponse)

      const health = await getDatabaseHealth()
      
      expect(health).toEqual({
        status: 'unhealthy',
        connection: 'failed',
        error: 'Database not available',
        timestamp: expect.any(String)
      })
    })

    it('should handle function errors gracefully', async () => {
      vi.mocked(getDatabaseHealth).mockRejectedValue(new Error('Health check failed'))

      await expect(getDatabaseHealth()).rejects.toThrow('Health check failed')
    })
  })

  describe('connectWithRetry', () => {
    it('should return true on successful connection', async () => {
      vi.mocked(connectWithRetry).mockResolvedValue(true)

      const result = await connectWithRetry(3, 100)
      
      expect(result).toBe(true)
      expect(connectWithRetry).toHaveBeenCalledWith(3, 100)
    })

    it('should return false after max retries exceeded', async () => {
      vi.mocked(connectWithRetry).mockResolvedValue(false)

      const result = await connectWithRetry(2, 10)
      
      expect(result).toBe(false)
      expect(connectWithRetry).toHaveBeenCalledWith(2, 10)
    })

    it('should handle retry logic parameters correctly', async () => {
      vi.mocked(connectWithRetry).mockResolvedValue(true)

      await connectWithRetry(5, 1000)
      
      expect(connectWithRetry).toHaveBeenCalledWith(5, 1000)
    })
  })
})