import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loader } from '~/routes/api.health';
import type { LoaderFunctionArgs } from 'react-router';

// Mock the Prisma import
vi.mock('~/lib/prisma.server', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('Health Check Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.DATABASE_URL;
  });

  it('returns 200 status with healthy response when database is not configured', async () => {
    const request = new Request('http://localhost/api/health');
    const response = await loader({ request, params: {}, context: {} } as LoaderFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('environment');
    expect(data).toHaveProperty('database');
    expect(data.database.status).toBe('not_configured');
    expect(data.database.message).toBe('DATABASE_URL not set');
  });

  it('returns correct system information', async () => {
    const request = new Request('http://localhost/api/health');
    const response = await loader({ request, params: {}, context: {} } as LoaderFunctionArgs);
    const data = await response.json();

    expect(data.system).toHaveProperty('nodeVersion');
    expect(data.system).toHaveProperty('platform');
    expect(data.system).toHaveProperty('uptime');
    expect(data.system).toHaveProperty('memoryUsage');
    expect(data.system.nodeVersion).toBe(process.version);
    expect(data.system.platform).toBe(process.platform);
  });

  it('returns 200 status with connected database when DATABASE_URL is configured and working', async () => {
    // Set DATABASE_URL
    process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';

    // Mock successful database query
    const { prisma } = await import('~/lib/prisma.server');
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }]);

    const request = new Request('http://localhost/api/health');
    const response = await loader({ request, params: {}, context: {} } as LoaderFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.database.status).toBe('connected');
    expect(data.database.message).toBe('Database connection successful');
  });

  it('returns 503 status with degraded response when database connection fails', async () => {
    // Set DATABASE_URL
    process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';

    // Mock failed database query
    const { prisma } = await import('~/lib/prisma.server');
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection refused'));

    const request = new Request('http://localhost/api/health');
    const response = await loader({ request, params: {}, context: {} } as LoaderFunctionArgs);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.database.status).toBe('disconnected');
    expect(data.database.message).toBe('Connection refused');
  });

  it('includes correct cache control headers', async () => {
    const request = new Request('http://localhost/api/health');
    const response = await loader({ request, params: {}, context: {} } as LoaderFunctionArgs);

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('response structure matches expected schema', async () => {
    const request = new Request('http://localhost/api/health');
    const response = await loader({ request, params: {}, context: {} } as LoaderFunctionArgs);
    const data = await response.json();

    // Verify structure
    expect(data).toMatchObject({
      status: expect.stringMatching(/^(healthy|degraded)$/),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      version: expect.any(String),
      environment: expect.any(String),
      database: {
        status: expect.any(String),
        message: expect.any(String),
      },
      system: {
        nodeVersion: expect.any(String),
        platform: expect.any(String),
        uptime: expect.any(Number),
        memoryUsage: {
          rss: expect.any(Number),
          heapTotal: expect.any(Number),
          heapUsed: expect.any(Number),
          external: expect.any(Number),
          arrayBuffers: expect.any(Number),
        },
      },
    });
  });
});
