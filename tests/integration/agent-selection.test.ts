import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { AgentSelectionRequest, AgentSelectionResponse, AgentListResponse } from '../../app/types';

describe('Integration: Agent Selection Flow', () => {
  let availableAgents: string[] = [];

  beforeEach(async () => {
    // Get available agents for testing
    // This test MUST FAIL until selection implementation exists
    const listResponse = await fetch('/api/agents', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (listResponse.ok) {
      const agentList: AgentListResponse = await listResponse.json();
      availableAgents = agentList.agents.map(agent => agent.id);
    }
  });

  afterEach(async () => {
    // Cleanup any test state
  });

  it('should complete agent selection workflow: select → session update → UI update', async () => {
    // Step 1: Get current agent list
    expect(availableAgents.length).toBeGreaterThan(0);
    const targetAgentId = availableAgents[0];

    // Step 2: Select an agent
    const selectionRequest: AgentSelectionRequest = {
      agentId: targetAgentId,
      context: {
        source: 'agents-page',
        preserveHistory: true
      }
    };

    const selectionResponse = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectionRequest)
    });

    expect(selectionResponse.status).toBe(200);
    const selectionData: AgentSelectionResponse = await selectionResponse.json();

    // Step 3: Verify selection response
    expect(selectionData.success).toBe(true);
    expect(selectionData.agent.id).toBe(targetAgentId);
    expect(selectionData.timestamp).toBeInstanceOf(Date);

    // Step 4: Verify agent details are included
    expect(selectionData.agent.name).toBeDefined();
    expect(selectionData.agent.description).toBeDefined();
    expect(selectionData.agent.capabilities).toBeDefined();
    expect(Array.isArray(selectionData.agent.capabilities)).toBe(true);
  });

  it('should handle agent switching between different agents', async () => {
    if (availableAgents.length < 2) {
      console.warn('Need at least 2 agents for switching test');
      return;
    }

    // Step 1: Select first agent
    const firstAgent = availableAgents[0];
    const firstSelection: AgentSelectionRequest = {
      agentId: firstAgent,
      context: {
        source: 'chat',
        preserveHistory: false
      }
    };

    const firstResponse = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firstSelection)
    });

    expect(firstResponse.status).toBe(200);
    const firstData: AgentSelectionResponse = await firstResponse.json();
    expect(firstData.agent.id).toBe(firstAgent);

    // Step 2: Switch to second agent
    const secondAgent = availableAgents[1];
    const secondSelection: AgentSelectionRequest = {
      agentId: secondAgent,
      context: {
        source: 'quick-switch',
        preserveHistory: true
      }
    };

    const secondResponse = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secondSelection)
    });

    expect(secondResponse.status).toBe(200);
    const secondData: AgentSelectionResponse = await secondResponse.json();

    // Step 3: Verify agent switch
    expect(secondData.agent.id).toBe(secondAgent);
    expect(secondData.previousAgent?.id).toBe(firstAgent);
  });

  it('should validate context-aware agent selection', async () => {
    const targetAgent = availableAgents[0];
    
    // Test different selection contexts
    const contexts = [
      { source: 'agents-page' as const, preserveHistory: true },
      { source: 'chat' as const, preserveHistory: false },
      { source: 'quick-switch' as const, preserveHistory: true }
    ];

    for (const context of contexts) {
      const selectionRequest: AgentSelectionRequest = {
        agentId: targetAgent,
        context
      };

      const response = await fetch('/api/agents/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectionRequest)
      });

      expect(response.status).toBe(200);
      const data: AgentSelectionResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.agent.id).toBe(targetAgent);
    }
  });

  it('should maintain session state according to preserveHistory setting', async () => {
    const targetAgent = availableAgents[0];

    // Test with preserveHistory: false
    const clearHistoryRequest: AgentSelectionRequest = {
      agentId: targetAgent,
      context: {
        source: 'chat',
        preserveHistory: false
      }
    };

    const clearResponse = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clearHistoryRequest)
    });

    expect(clearResponse.status).toBe(200);
    const clearData: AgentSelectionResponse = await clearResponse.json();
    expect(clearData.success).toBe(true);

    // Test with preserveHistory: true
    const preserveHistoryRequest: AgentSelectionRequest = {
      agentId: targetAgent,
      context: {
        source: 'quick-switch',
        preserveHistory: true
      }
    };

    const preserveResponse = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preserveResponse)
    });

    expect(preserveResponse.status).toBe(200);
    const preserveData: AgentSelectionResponse = await preserveResponse.json();
    expect(preserveData.success).toBe(true);
  });

  it('should handle agent selection performance targets', async () => {
    const targetAgent = availableAgents[0];
    const startTime = Date.now();

    const selectionRequest: AgentSelectionRequest = {
      agentId: targetAgent,
      context: {
        source: 'quick-switch',
        preserveHistory: true
      }
    };

    const response = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectionRequest)
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status).toBe(200);
    
    // Should meet performance target: < 100ms for agent selection
    expect(responseTime).toBeLessThan(100);

    const data: AgentSelectionResponse = await response.json();
    expect(data.success).toBe(true);
  });

  it('should validate agent selection with session context', async () => {
    const targetAgent = availableAgents[0];
    const sessionId = 'test-session-123';

    const selectionRequest: AgentSelectionRequest = {
      agentId: targetAgent,
      context: {
        source: 'chat',
        sessionId: sessionId,
        preserveHistory: true
      }
    };

    const response = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectionRequest)
    });

    expect(response.status).toBe(200);
    const data: AgentSelectionResponse = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.agent.id).toBe(targetAgent);
  });

  it('should handle concurrent agent selections gracefully', async () => {
    const agents = availableAgents.slice(0, 3); // Use first 3 agents
    
    // Make concurrent selection requests
    const promises = agents.map(agentId => {
      const request: AgentSelectionRequest = {
        agentId,
        context: {
          source: 'quick-switch',
          preserveHistory: true
        }
      };

      return fetch('/api/agents/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
    });

    const responses = await Promise.all(promises);

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Parse responses
    const results = await Promise.all(responses.map(r => r.json()));
    
    results.forEach((data: AgentSelectionResponse, index) => {
      expect(data.success).toBe(true);
      expect(data.agent.id).toBe(agents[index]);
    });
  });

  it('should provide appropriate error handling for invalid selections', async () => {
    // Test non-existent agent
    const invalidRequest: AgentSelectionRequest = {
      agentId: 'non-existent-agent-999',
      context: {
        source: 'agents-page',
        preserveHistory: true
      }
    };

    const response = await fetch('/api/agents/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRequest)
    });

    expect(response.status).toBe(404);
    
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('not found');
  });
});