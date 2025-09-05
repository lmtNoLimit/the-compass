import '@testing-library/jest-dom';

// Mock environment variables for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_CLERK_PUBLISHABLE_KEY: 'test_clerk_key',
  },
  writable: true,
});
