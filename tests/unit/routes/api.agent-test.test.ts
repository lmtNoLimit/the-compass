/**
 * Tests for the Vertex AI Agent Test API Endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';

// Create mock functions that will be configured in each test
const mockGetAuth = vi.fn();
const mockTestConnection = vi.fn();
const mockCallAgent = vi.fn();

// Mock Clerk authentication
vi.mock('@clerk/react-router/ssr.server', () => ({
  getAuth: () => mockGetAuth(),
}));

// Mock Vertex AI service
vi.mock('~/lib/vertex-ai.server', () => ({
  getVertexAIService: vi.fn(() => ({
    testConnection: mockTestConnection,
    callAgent: mockCallAgent,
    isInitialized: vi.fn(() => true),
  })),
}));

// Mock react-router json function
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    json: (data: any, init?: ResponseInit) => {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
    },
  };
});

// Import the actual functions after mocks are set up
import { loader, action } from '~/routes/api.agent-test';

describe('GET /api/agent-test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('successfully connects to deployed agent', async () => {
    // Mock authenticated user
    mockGetAuth.mockResolvedValue({ userId: 'test-user-123' });

    // Mock successful connection
    mockTestConnection.mockResolvedValue({
      success: true,
      message: 'Vertex AI connection successful',
      details: {
        projectId: 'test-project',
        location: 'us-central1',
        testResponse: 'Connection successful',
      },
    });

    // Create mock request
    const mockRequest = new Request('http://localhost:5173/api/agent-test', {
      method: 'GET',
    });

    const response = await loader({
      request: mockRequest,
      params: {},
      context: {},
    } as LoaderFunctionArgs);

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Vertex AI connection successful');
    expect(data.details.projectId).toBe('test-project');
    expect(mockTestConnection).toHaveBeenCalledTimes(1);
  });

  it('handles authentication failures gracefully', async () => {
    // Mock unauthenticated user
    mockGetAuth.mockResolvedValue({ userId: null });

    const mockRequest = new Request('http://localhost:5173/api/agent-test', {
      method: 'GET',
    });

    const response = await loader({
      request: mockRequest,
      params: {},
      context: {},
    } as LoaderFunctionArgs);

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
    expect(mockTestConnection).not.toHaveBeenCalled();
  });

  it('handles connection failures gracefully', async () => {
    // Mock authenticated user
    mockGetAuth.mockResolvedValue({ userId: 'test-user-123' });

    // Mock connection failure
    mockTestConnection.mockResolvedValue({
      success: false,
      message: 'Connection test failed: Invalid credentials',
      details: {
        projectId: 'test-project',
        location: 'us-central1',
        error: 'Invalid credentials',
      },
    });

    const mockRequest = new Request('http://localhost:5173/api/agent-test', {
      method: 'GET',
    });

    const response = await loader({
      request: mockRequest,
      params: {},
      context: {},
    } as LoaderFunctionArgs);

    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.message).toContain('Connection test failed');
  });

  it('handles rate limiting correctly', async () => {
    // Mock authenticated user
    mockGetAuth.mockResolvedValue({ userId: 'rate-limit-test-user' });

    // Mock successful connection
    mockTestConnection.mockResolvedValue({
      success: true,
      message: 'Vertex AI connection successful',
      details: {},
    });

    const mockRequest = new Request('http://localhost:5173/api/agent-test', {
      method: 'GET',
    });

    // Make multiple requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 65; i++) {
      requests.push(
        loader({
          request: mockRequest,
          params: {},
          context: {},
        } as LoaderFunctionArgs)
      );
    }

    const responses = await Promise.all(requests);

    // First 60 should succeed
    for (let i = 0; i < 60; i++) {
      expect(responses[i].status).toBe(200);
    }

    // 61st and beyond should be rate limited
    for (let i = 60; i < 65; i++) {
      expect(responses[i].status).toBe(429);
      const data = await responses[i].json();
      expect(data.error).toBe('Rate limit exceeded');
    }
  });
});

describe('POST /api/agent-test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully calls deployed agent', async () => {
    // Mock authenticated user
    mockGetAuth.mockResolvedValue({ userId: 'test-user-123' });

    // Mock successful agent call
    mockCallAgent.mockResolvedValue({
      agent: 'test-agent',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      response: 'Test response from agent',
      status: 'success',
      metadata: {
        projectId: 'test-project',
        location: 'us-central1',
      },
    });

    const mockRequest = new Request('http://localhost:5173/api/agent-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test prompt',
        context: { session: 'test-session' },
      }),
    });

    const response = await action({
      request: mockRequest,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.agent).toBe('test-agent');
    expect(data.response).toBe('Test response from agent');
    expect(mockCallAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Test prompt',
        context: expect.objectContaining({
          session: 'test-session',
          userId: 'test-user-123',
        }),
      })
    );
  });

  it('requires authentication for POST requests', async () => {
    // Mock unauthenticated user
    mockGetAuth.mockResolvedValue({ userId: null });

    const mockRequest = new Request('http://localhost:5173/api/agent-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test prompt',
      }),
    });

    const response = await action({
      request: mockRequest,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
    expect(mockCallAgent).not.toHaveBeenCalled();
  });

  it('validates prompt is required', async () => {
    // Mock authenticated user
    mockGetAuth.mockResolvedValue({ userId: 'test-user-123' });

    const mockRequest = new Request('http://localhost:5173/api/agent-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing prompt
        context: { session: 'test-session' },
      }),
    });

    const response = await action({
      request: mockRequest,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Prompt is required');
    expect(mockCallAgent).not.toHaveBeenCalled();
  });

  it('handles agent call failures', async () => {
    // Mock authenticated user
    mockGetAuth.mockResolvedValue({ userId: 'test-user-123' });

    // Mock agent call failure
    mockCallAgent.mockResolvedValue({
      agent: 'test-agent',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      response: '',
      status: 'error',
      error: 'Agent processing failed',
    });

    const mockRequest = new Request('http://localhost:5173/api/agent-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test prompt',
      }),
    });

    const response = await action({
      request: mockRequest,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.status).toBe('error');
    expect(data.error).toBe('Agent processing failed');
  });
});