import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action, loader } from '~/routes/api.chat';
import { getAuth } from '@clerk/react-router/ssr.server';
import { getAgentEngineService } from '~/lib/agent-engine.server';

// Mock dependencies
vi.mock('@clerk/react-router/ssr.server');
vi.mock('~/lib/agent-engine.server');

describe('Chat API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/chat (loader)', () => {
    it('returns available agents when service is initialized', async () => {
      const mockAgents = [
        {
          id: 'demo-agent',
          name: 'Demo Agent',
          description: 'Demo health check agent',
          status: 'active' as const,
          capabilities: ['health-check'],
        },
        {
          id: 'enterprise-admin',
          name: 'Enterprise Admin',
          description: 'Enterprise IT Administrator persona',
          status: 'active' as const,
          capabilities: ['persona-simulation'],
        },
      ];

      const mockAgentEngine = {
        isInitialized: vi.fn().mockReturnValue(true),
        getMode: vi.fn().mockReturnValue('Agent Engine'),
        getAvailableAgents: vi.fn().mockResolvedValue(mockAgents),
      };

      vi.mocked(getAgentEngineService).mockReturnValue(mockAgentEngine as any);

      const response = await loader({} as any);
      const data = await response.json();

      expect(data.status).toBe('ok');
      expect(data.agents).toEqual(mockAgents);
      expect(data.mode).toBe('Agent Engine');
    });

    it('returns error when service fails to initialize', async () => {
      const mockAgentEngine = {
        isInitialized: vi.fn().mockReturnValue(false),
      };

      vi.mocked(getAgentEngineService).mockReturnValue(mockAgentEngine as any);

      const response = await loader({} as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
    });
  });

  describe('POST /api/chat (action)', () => {
    describe('create_session action', () => {
      it('creates session with Clerk user ID', async () => {
        vi.mocked(getAuth).mockResolvedValue({ userId: 'user_123' } as any);

        const mockAgentEngine = {
          createSession: vi.fn().mockResolvedValue({ sessionId: 'vertex_session_123' }),
        };
        vi.mocked(getAgentEngineService).mockReturnValue(mockAgentEngine as any);


        const request = new Request('http://localhost/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create_session',
            agentId: 'enterprise-admin',
          }),
        });

        const response = await action({ request } as any);
        const data = await response.json();

        expect(data.sessionId).toBe('vertex_session_123');
        expect(data.userId).toBe('user_123');
        expect(data.agentId).toBe('enterprise-admin');
        expect(mockAgentEngine.createSession).toHaveBeenCalledWith('user_123', 'enterprise-admin');
      });

      it('uses anonymous user when not authenticated', async () => {
        vi.mocked(getAuth).mockResolvedValue({ userId: null } as any);

        const mockAgentEngine = {
          createSession: vi.fn().mockResolvedValue({ sessionId: 'session_123' }),
        };
        vi.mocked(getAgentEngineService).mockReturnValue(mockAgentEngine as any);


        const request = new Request('http://localhost/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create_session',
          }),
        });

        const response = await action({ request } as any);
        const data = await response.json();

        expect(data.userId).toBe('anonymous');
        expect(mockAgentEngine.createSession).toHaveBeenCalledWith('anonymous', 'demo-agent');
      });
    });

    describe('query_session action', () => {
      it('routes query to specific agent', async () => {
        vi.mocked(getAuth).mockResolvedValue({ userId: 'user_123' } as any);

        const mockAgentEngine = {
          streamQuery: vi.fn().mockResolvedValue({
            response: 'What are your main security concerns?',
            sessionId: 'session_123',
          }),
        };
        vi.mocked(getAgentEngineService).mockReturnValue(mockAgentEngine as any);


        const request = new Request('http://localhost/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            action: 'query_session',
            agentId: 'enterprise-admin',
            sessionId: 'session_123',
            prompt: 'Tell me about your security policies',
          }),
        });

        const response = await action({ request } as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.response).toBe('What are your main security concerns?');
        expect(mockAgentEngine.streamQuery).toHaveBeenCalledWith({
          sessionId: 'session_123',
          prompt: 'Tell me about your security policies',
          userId: 'user_123',
          agentId: 'enterprise-admin',
        });
      });

      it('returns error when sessionId or prompt is missing', async () => {
        vi.mocked(getAuth).mockResolvedValue({ userId: 'user_123' } as any);

        const request = new Request('http://localhost/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            action: 'query_session',
            sessionId: 'session_123',
          }),
        });

        const response = await action({ request } as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('required');
      });
    });

    describe('list_sessions action', () => {
      it('lists user sessions for specific agent', async () => {
        vi.mocked(getAuth).mockResolvedValue({ userId: 'user_123' } as any);

        const mockSessions = [
          {
            sessionId: 'session_1',
            userId: 'user_123',
            agentId: 'enterprise-admin',
            createdAt: new Date().toISOString(),
            messageCount: 5,
          },
        ];

        const mockAgentEngine = {
          listSessions: vi.fn().mockResolvedValue({ sessions: mockSessions }),
        };
        vi.mocked(getAgentEngineService).mockReturnValue(mockAgentEngine as any);

        const request = new Request('http://localhost/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            action: 'list_sessions',
            agentId: 'enterprise-admin',
          }),
        });

        const response = await action({ request } as any);
        const data = await response.json();

        expect(data.sessions).toEqual(mockSessions);
        expect(data.count).toBe(1);
        expect(mockAgentEngine.listSessions).toHaveBeenCalledWith(
          'user_123',
          'enterprise-admin'
        );
      });
    });

    describe('invalid action', () => {
      it('returns error for invalid action', async () => {
        vi.mocked(getAuth).mockResolvedValue({ userId: 'user_123' } as any);

        const request = new Request('http://localhost/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            action: 'invalid_action',
          }),
        });

        const response = await action({ request } as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid action');
      });
    });
  });
});