import type { Route } from '../+types/root';

export async function loader(_args: Route.LoaderArgs) {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'unknown',
      message: null as string | null,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  };

  // Check database connection if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    try {
      // Dynamically import prisma to avoid initialization errors
      const { prisma } = await import('~/lib/prisma.server');
      // Attempt a simple query to verify database connection
      await prisma.$queryRaw`SELECT 1`;
      healthStatus.database.status = 'connected';
      healthStatus.database.message = 'Database connection successful';
    } catch (error) {
      healthStatus.status = 'degraded';
      healthStatus.database.status = 'disconnected';
      healthStatus.database.message =
        error instanceof Error ? error.message : 'Database connection failed';
    }
  } else {
    healthStatus.database.status = 'not_configured';
    healthStatus.database.message = 'DATABASE_URL not set';
  }

  return Response.json(healthStatus, {
    status: healthStatus.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}
