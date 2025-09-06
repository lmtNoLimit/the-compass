/**
 * Tests for Vertex AI Service Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VertexAIService } from '~/lib/vertex-ai.server';

// Mock Google Cloud Vertex AI
vi.mock('@google-cloud/vertexai', () => ({
  VertexAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockImplementation(() => ({
      generateContent: vi.fn(),
    })),
  })),
}));

describe('VertexAIService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set test environment variables
    process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project-id';
    process.env.GOOGLE_CLOUD_REGION = 'us-central1';
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with environment variables', () => {
      const service = new VertexAIService();
      
      expect(service).toBeDefined();
      expect(service.isInitialized()).toBe(true);
      
      const config = service.getConfig();
      expect(config.projectId).toBe('test-project-id');
      expect(config.location).toBe('us-central1');
    });

    it('initializes with provided config', () => {
      const service = new VertexAIService({
        projectId: 'custom-project',
        location: 'europe-west1',
      });
      
      const config = service.getConfig();
      expect(config.projectId).toBe('custom-project');
      expect(config.location).toBe('europe-west1');
    });

    it('throws error when project ID is missing', () => {
      delete process.env.GOOGLE_CLOUD_PROJECT_ID;
      
      expect(() => new VertexAIService()).toThrow('GOOGLE_CLOUD_PROJECT_ID is required');
    });

    it('uses default region when not specified', () => {
      delete process.env.GOOGLE_CLOUD_REGION;
      
      const service = new VertexAIService();
      const config = service.getConfig();
      
      expect(config.location).toBe('us-central1');
    });

    it('handles JSON credentials from environment', () => {
      const mockCredentials = {
        type: 'service_account',
        project_id: 'test-project',
        private_key: 'fake-key',
      };
      
      process.env.GOOGLE_CLOUD_KEY_JSON = JSON.stringify(mockCredentials);
      
      const service = new VertexAIService();
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('testConnection', () => {
    it('returns success when connection is established', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                text: 'Connection successful',
              }],
            },
          }],
        },
      });

      const { VertexAI } = await import('@google-cloud/vertexai');
      (VertexAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const service = new VertexAIService();
      const result = await service.testConnection();
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Vertex AI connection successful');
      expect(result.details?.projectId).toBe('test-project-id');
      expect(result.details?.location).toBe('us-central1');
      expect(result.details?.testResponse).toBe('Connection successful');
    });

    it('returns failure when connection fails', async () => {
      const mockError = new Error('Network error');
      const mockGenerateContent = vi.fn().mockRejectedValue(mockError);

      const { VertexAI } = await import('@google-cloud/vertexai');
      (VertexAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const service = new VertexAIService();
      const result = await service.testConnection();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection test failed');
      expect(result.message).toContain('Network error');
    });

    it('returns failure when service not initialized', async () => {
      const service = new VertexAIService();
      // Manually set initialized to false for testing
      (service as any).initialized = false;
      
      const result = await service.testConnection();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Vertex AI client not initialized');
    });
  });

  describe('callAgent', () => {
    it('successfully calls agent and returns response', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                text: 'Agent response to test prompt',
              }],
            },
          }],
        },
      });

      const { VertexAI } = await import('@google-cloud/vertexai');
      (VertexAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const service = new VertexAIService();
      const response = await service.callAgent({
        prompt: 'Test prompt',
        context: { userId: 'test-user' },
        agentName: 'test-agent',
      });
      
      expect(response.status).toBe('success');
      expect(response.agent).toBe('test-agent');
      expect(response.version).toBe('1.0.0');
      expect(response.response).toBe('Agent response to test prompt');
      expect(response.metadata?.context).toEqual({ userId: 'test-user' });
    });

    it('handles agent call errors gracefully', async () => {
      const mockError = new Error('Agent processing failed');
      const mockGenerateContent = vi.fn().mockRejectedValue(mockError);

      const { VertexAI } = await import('@google-cloud/vertexai');
      (VertexAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const service = new VertexAIService();
      const response = await service.callAgent({
        prompt: 'Test prompt',
      });
      
      expect(response.status).toBe('error');
      expect(response.error).toContain('Agent call failed');
      expect(response.error).toContain('Agent processing failed');
      expect(response.response).toBe('');
    });

    it('returns error when service not initialized', async () => {
      const service = new VertexAIService();
      // Manually set initialized to false for testing
      (service as any).initialized = false;
      
      const response = await service.callAgent({
        prompt: 'Test prompt',
      });
      
      expect(response.status).toBe('error');
      expect(response.error).toBe('Vertex AI client not initialized');
    });

    it('handles missing response content', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          candidates: [],
        },
      });

      const { VertexAI } = await import('@google-cloud/vertexai');
      (VertexAI as any).mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const service = new VertexAIService();
      const response = await service.callAgent({
        prompt: 'Test prompt',
        agentName: 'test-agent',
      });
      
      expect(response.status).toBe('success');
      expect(response.response).toBe('No response generated');
    });
  });

  describe('Singleton Pattern', () => {
    it('returns same instance when getVertexAIService called multiple times', async () => {
      // Import fresh module to test singleton
      vi.resetModules();
      const module = await import('~/lib/vertex-ai.server');
      
      const instance1 = module.getVertexAIService();
      const instance2 = module.getVertexAIService();
      
      expect(instance1).toBe(instance2);
    });
  });
});