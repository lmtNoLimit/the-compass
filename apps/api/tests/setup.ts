import { beforeAll, afterAll, beforeEach } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Test database setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  
  // Use test database URL if available
  if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/persona_compass_test'
  }
})

// Cleanup after all tests
afterAll(async () => {
  // Cleanup code if needed
})

// Reset database state before each test (if using real DB)
beforeEach(async () => {
  // This would reset the test database between tests
  // Only run if TEST_DATABASE_URL is set to avoid affecting real DB
})