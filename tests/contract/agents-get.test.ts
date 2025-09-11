import { describe, it, expect } from 'vitest';
import type { AgentListResponse, AgentInfo, AgentStatus } from '../../app/types';

describe('Contract: GET /api/agents', () => {
  it('should return agent list matching AgentListResponse schema', async () => {
    // This test MUST FAIL until the API endpoint is implemented
    const response = await fetch('/api/agents', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(200);
    
    const data: AgentListResponse = await response.json();

    // Validate AgentListResponse structure
    expect(data).toHaveProperty('agents');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('cached');
    expect(data).toHaveProperty('totalCount');

    expect(Array.isArray(data.agents)).toBe(true);
    expect(typeof data.cached).toBe('boolean');
    expect(typeof data.totalCount).toBe('number');
    expect(data.totalCount).toBeGreaterThanOrEqual(0);
    expect(data.timestamp).toBeInstanceOf(Date);

    // Validate individual agents match AgentInfo schema
    data.agents.forEach((agent: AgentInfo) => {
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('description');
      expect(agent).toHaveProperty('status');
      expect(agent).toHaveProperty('capabilities');

      expect(typeof agent.id).toBe('string');
      expect(agent.id.length).toBeGreaterThan(0);
      expect(typeof agent.name).toBe('string');
      expect(agent.name.length).toBeGreaterThan(0);
      expect(typeof agent.description).toBe('string');
      expect(agent.description.length).toBeGreaterThan(0);
      expect(['active', 'inactive', 'error']).toContain(agent.status);
      expect(Array.isArray(agent.capabilities)).toBe(true);

      // Optional fields validation
      if (agent.endpoint) {
        expect(typeof agent.endpoint).toBe('string');
        expect(agent.endpoint).toMatch(/^https?:\/\//);
      }
      if (agent.projectId) {
        expect(typeof agent.projectId).toBe('string');
      }
      if (agent.location) {
        expect(typeof agent.location).toBe('string');
      }
      if (agent.version) {
        expect(typeof agent.version).toBe('string');
      }
      if (agent.lastUpdated) {
        expect(agent.lastUpdated).toBeInstanceOf(Date);
      }
    });
  });

  it('should handle empty agent list correctly', async () => {
    // Test edge case of no agents
    const response = await fetch('/api/agents', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(200);
    
    const data: AgentListResponse = await response.json();
    
    // Should still return valid structure even if empty
    expect(data).toHaveProperty('agents');
    expect(data).toHaveProperty('totalCount');
    expect(Array.isArray(data.agents)).toBe(true);
    expect(data.totalCount).toBe(data.agents.length);
  });

  it('should include cache information', async () => {
    const response = await fetch('/api/agents', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(200);
    
    const data: AgentListResponse = await response.json();
    
    // Cache information should be included
    expect(typeof data.cached).toBe('boolean');
    expect(data.timestamp).toBeInstanceOf(Date);
  });
});