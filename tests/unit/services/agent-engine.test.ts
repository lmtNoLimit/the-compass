/**
 * Tests for Agent Engine Service Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentEngineService } from '~/lib/agent-engine.server';

// Mock Google Auth
vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getClient: vi.fn().mockResolvedValue({
      getAccessToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
    }),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('AgentEngineService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Set test environment variables
    process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project-id';
    process.env.GOOGLE_CLOUD_REGION = 'us-central1';
    process.env.VERTEX_AGENT_ID = 'test-agent-id';
    process.env.VERTEX_AGENT_ENDPOINT = 'https://test-endpoint.com';

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with environment variables', () => {
      const service = new AgentEngineService();

      expect(service).toBeDefined();
      expect(service.isInitialized()).toBe(true);
      expect(service.getMode()).toBe('Agent Engine');
    });

    it('throws error when required environment variables are missing', () => {
      delete process.env.GOOGLE_CLOUD_PROJECT_ID;

      expect(() => new AgentEngineService()).toThrow(
        'Both GOOGLE_CLOUD_PROJECT_ID and VERTEX_AGENT_ID environment variables are required.'
      );
    });
  });

  describe('Agent Management', () => {
    it('returns available agents', async () => {
      const service = new AgentEngineService();
      const agents = await service.getAvailableAgents();

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents[0]).toHaveProperty('id');
      expect(agents[0]).toHaveProperty('name');
      expect(agents[0]).toHaveProperty('capabilities');
    });

    it('includes enterprise admin agent when configured', async () => {
      process.env.VERTEX_ENTERPRISE_ADMIN_AGENT_ID = 'enterprise-admin-id';
      process.env.VERTEX_ENTERPRISE_ADMIN_ENDPOINT = 'https://enterprise-endpoint.com';

      const service = new AgentEngineService();
      const agents = await service.getAvailableAgents();

      const enterpriseAgent = agents.find(a => a.id === 'enterprise-admin');
      expect(enterpriseAgent).toBeDefined();
      expect(enterpriseAgent?.name).toBe('Enterprise Admin');
      expect(enterpriseAgent?.capabilities).toContain('persona-simulation');
    });
  });

  describe('Session Management', () => {
    let service: AgentEngineService;

    beforeEach(() => {
      service = new AgentEngineService();
      vi.mocked(fetch).mockClear();
    });

    describe('createSession', () => {
      it('creates a session successfully', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            output: { id: 'session-123' },
          }),
        } as Response);

        const result = await service.createSession('user-123', 'demo-agent');

        expect(result).toEqual({ sessionId: 'session-123' });
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(':query'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer mock-token',
            }),
            body: expect.stringContaining('async_create_session'),
          })
        );
      });

      it('generates fallback session ID on error', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        const result = await service.createSession('user-123');

        expect(result.sessionId).toMatch(/^session_user-123_/);
      });
    });

    describe('listSessions', () => {
      it('lists sessions successfully', async () => {
        const mockSessions = [
          { sessionId: 'session-1', agentId: 'demo-agent', createdAt: '2024-01-01' },
          { sessionId: 'session-2', agentId: 'demo-agent', createdAt: '2024-01-02' },
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            output: mockSessions,
          }),
        } as Response);

        const result = await service.listSessions('user-123');

        expect(result.sessions).toEqual(mockSessions);
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(':query'),
          expect.objectContaining({
            body: expect.stringContaining('async_list_sessions'),
          })
        );
      });

      it('returns empty list on error', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        const result = await service.listSessions('user-123');

        expect(result.sessions).toEqual([]);
      });
    });

    describe('getSession', () => {
      it('gets session details successfully', async () => {
        const mockSession = {
          sessionId: 'session-123',
          userId: 'user-123',
          agentId: 'demo-agent',
          createdAt: '2024-01-01',
        };

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            output: mockSession,
          }),
        } as Response);

        const result = await service.getSession('session-123', 'user-123');

        expect(result.session).toEqual(mockSession);
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(':query'),
          expect.objectContaining({
            body: expect.stringContaining('async_get_session'),
          })
        );
      });

      it('returns null on error', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        const result = await service.getSession('session-123', 'user-123');

        expect(result.session).toBeNull();
      });
    });

    describe('deleteSession', () => {
      it('deletes session successfully', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            output: { success: true, message: 'Session deleted' },
          }),
        } as Response);

        const result = await service.deleteSession('session-123', 'user-123');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Session deleted');
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(':query'),
          expect.objectContaining({
            body: expect.stringContaining('async_delete_session'),
          })
        );
      });

      it('returns failure on error', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        const result = await service.deleteSession('session-123', 'user-123');

        expect(result.success).toBe(false);
        expect(result.message).toContain('Network error');
      });
    });

    describe('streamQuery', () => {
      it('handles SSE streaming response', async () => {
        const mockReader = {
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"output": "Hello from agent"}\n\n'),
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined,
            }),
          releaseLock: vi.fn(),
        };

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'text/event-stream' }),
          body: {
            getReader: () => mockReader,
          },
        } as unknown as Response);

        const result = await service.streamQuery({
          sessionId: 'session-123',
          prompt: 'Hello',
          userId: 'user-123',
          agentId: 'demo-agent',
        });

        expect(result.response).toBe('Hello from agent');
        expect(result.sessionId).toBe('session-123');
      });

      it('handles JSON response fallback', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => JSON.stringify({ output: 'JSON response' }),
        } as unknown as Response);

        const result = await service.streamQuery({
          sessionId: 'session-123',
          prompt: 'Hello',
          userId: 'user-123',
        });

        expect(result.response).toBe('JSON response');
      });

      it('throws error on API failure', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error',
        } as unknown as Response);

        await expect(
          service.streamQuery({
            sessionId: 'session-123',
            prompt: 'Hello',
            userId: 'user-123',
          })
        ).rejects.toThrow('API error (500)');
      });
    });
  });
});