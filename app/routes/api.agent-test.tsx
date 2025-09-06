/**
 * API Endpoint for Testing Vertex AI Agent Connection
 *
 * This endpoint provides health check and test functionality
 * for the Vertex AI integration and deployed agents.
 */

import type { Route } from '../+types/root';
import { getAuth } from '@clerk/react-router/ssr.server';
import { getVertexAIService } from '~/lib/vertex-ai.server';
import type { AIAgentRequest, AIAgentResponse, VertexAIHealthCheck } from '~/types';

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 60;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// In-memory rate limit tracking (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limits for a given user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimits = requestCounts.get(userId);

  if (!userLimits || now > userLimits.resetTime) {
    // Reset or initialize rate limit
    requestCounts.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimits.count >= RATE_LIMIT_REQUESTS) {
    return false; // Rate limit exceeded
  }

  userLimits.count++;
  return true;
}

/**
 * GET /api/agent-test
 * Health check endpoint for Vertex AI connection
 */
export async function loader(args: Route.LoaderArgs) {
  try {
    // Check authentication
    const auth = await getAuth(args);
    const userId = auth.userId;

    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check rate limits
    if (!checkRateLimit(userId)) {
      return Response.json(
        {
          error: 'Rate limit exceeded',
          message: 'Maximum 60 requests per minute allowed',
        },
        { status: 429 }
      );
    }

    // Get Vertex AI service instance
    const vertexAI = getVertexAIService();

    // Test the connection
    const healthCheck = await vertexAI.testConnection();

    const response: VertexAIHealthCheck = {
      success: healthCheck.success,
      message: healthCheck.message,
      details: {
        projectId: healthCheck.details?.projectId || 'not-configured',
        location: healthCheck.details?.location || 'us-central1',
        testResponse: healthCheck.details?.testResponse,
        error: healthCheck.details?.error,
      },
    };

    return Response.json(response, {
      status: healthCheck.success ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);

    // Handle authentication failures specifically
    if (error instanceof Error && error.message.includes('authentication')) {
      return Response.json(
        {
          success: false,
          message: 'Authentication failed',
          error: error.message,
        },
        { status: 401 }
      );
    }

    return Response.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent-test
 * Test agent communication endpoint
 */
export async function action(args: Route.ActionArgs) {
  try {
    // Check authentication
    const auth = await getAuth(args);
    const userId = auth.userId;

    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check rate limits
    if (!checkRateLimit(userId)) {
      return Response.json(
        {
          error: 'Rate limit exceeded',
          message: 'Maximum 60 requests per minute allowed',
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = (await args.request.json()) as AIAgentRequest;

    if (!body.prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get Vertex AI service instance
    const vertexAI = getVertexAIService();

    // Call the agent
    const agentResponse = await vertexAI.callAgent({
      prompt: body.prompt,
      context: {
        ...body.context,
        userId,
        requestTime: new Date().toISOString(),
      },
      agentName: body.agentName || 'test-agent',
      parameters: body.parameters,
    });

    const response: AIAgentResponse = {
      agent: agentResponse.agent,
      version: agentResponse.version,
      timestamp: agentResponse.timestamp,
      response: agentResponse.response,
      status: agentResponse.status,
      metadata: agentResponse.metadata,
      error: agentResponse.error,
    };

    return Response.json(response, {
      status: agentResponse.status === 'success' ? 200 : 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Agent call error:', error);

    // Handle authentication failures specifically
    if (error instanceof Error && error.message.includes('authentication')) {
      return Response.json(
        {
          agent: 'unknown',
          version: '0.0.0',
          timestamp: new Date().toISOString(),
          response: '',
          status: 'error' as const,
          error: 'Authentication failed',
        },
        { status: 401 }
      );
    }

    return Response.json(
      {
        agent: 'unknown',
        version: '0.0.0',
        timestamp: new Date().toISOString(),
        response: '',
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
