import { describe, it, expect } from 'vitest';
import type { AgentSelectionRequest, AgentSelectionResponse, SelectionContext } from '../../app/types';

describe('Contract: POST /api/agents/select', () => {
  it('should handle agent selection with valid request', async () => {
    // This test MUST FAIL until the API endpoint is implemented
    const requestBody: AgentSelectionRequest = {
      agentId: 'demo-agent-123',
      context: {
        source: 'agents-page',
        preserveHistory: true
      }
    };

    const response = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(200);
    
    const data: AgentSelectionResponse = await response.json();

    // Validate AgentSelectionResponse structure
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('agent');
    expect(data).toHaveProperty('timestamp');

    expect(typeof data.success).toBe('boolean');
    expect(data.success).toBe(true);
    expect(data.timestamp).toBeInstanceOf(Date);

    // Validate agent structure
    expect(data.agent).toHaveProperty('id');
    expect(data.agent).toHaveProperty('name');
    expect(data.agent).toHaveProperty('description');
    expect(data.agent).toHaveProperty('status');
    expect(data.agent.id).toBe(requestBody.agentId);

    // Previous agent should be included if available
    if (data.previousAgent) {
      expect(data.previousAgent).toHaveProperty('id');
      expect(data.previousAgent).toHaveProperty('name');
    }
  });

  it('should validate required fields in request body', async () => {
    // Test missing agentId
    const invalidRequest = {
      context: {
        source: 'chat',
        preserveHistory: false
      }
    };

    const response = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRequest)
    });

    expect(response.status).toBe(400);
    
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('agentId');
  });

  it('should handle non-existent agent ID', async () => {
    const requestBody: AgentSelectionRequest = {
      agentId: 'non-existent-agent-999',
      context: {
        source: 'quick-switch',
        preserveHistory: true
      }
    };

    const response = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(404);
    
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('Agent not found');
  });

  it('should accept optional context fields', async () => {
    // Test minimal request (only required fields)
    const minimalRequest: AgentSelectionRequest = {
      agentId: 'demo-agent-123'
    };

    const response = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minimalRequest)
    });

    expect(response.status).toBe(200);
    
    const data: AgentSelectionResponse = await response.json();
    expect(data.success).toBe(true);
    expect(data.agent.id).toBe(minimalRequest.agentId);
  });

  it('should validate context source values', async () => {
    const requestWithInvalidSource = {
      agentId: 'demo-agent-123',
      context: {
        source: 'invalid-source' as any,
        preserveHistory: true
      }
    };

    const response = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestWithInvalidSource)
    });

    expect(response.status).toBe(400);
    
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('source');
  });
});