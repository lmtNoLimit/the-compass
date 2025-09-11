import { describe, it, expect } from 'vitest';
import type { AgentInfo } from '../../app/types';

describe('Contract: GET /api/agents/:id', () => {
  it('should return single agent matching AgentInfo schema', async () => {
    // This test MUST FAIL until the API endpoint is implemented
    const agentId = 'demo-agent-123';
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(200);
    
    const agent: AgentInfo = await response.json();

    // Validate AgentInfo structure
    expect(agent).toHaveProperty('id');
    expect(agent).toHaveProperty('name');
    expect(agent).toHaveProperty('description');
    expect(agent).toHaveProperty('status');
    expect(agent).toHaveProperty('capabilities');

    // Validate required field types and constraints
    expect(typeof agent.id).toBe('string');
    expect(agent.id).toBe(agentId);
    expect(typeof agent.name).toBe('string');
    expect(agent.name.length).toBeGreaterThan(0);
    expect(agent.name.length).toBeLessThanOrEqual(100);
    
    expect(typeof agent.description).toBe('string');
    expect(agent.description.length).toBeGreaterThan(0);
    expect(agent.description.length).toBeLessThanOrEqual(500);
    
    expect(['active', 'inactive', 'error']).toContain(agent.status);
    expect(Array.isArray(agent.capabilities)).toBe(true);
    expect(agent.capabilities.length).toBeLessThanOrEqual(20);

    // Validate capability string constraints
    agent.capabilities.forEach(capability => {
      expect(typeof capability).toBe('string');
      expect(capability.length).toBeGreaterThan(0);
      expect(capability.length).toBeLessThanOrEqual(50);
    });

    // Validate optional fields when present
    if (agent.endpoint) {
      expect(typeof agent.endpoint).toBe('string');
      expect(agent.endpoint).toMatch(/^https?:\/\/.+/);
    }
    
    if (agent.projectId) {
      expect(typeof agent.projectId).toBe('string');
      expect(agent.projectId.length).toBeGreaterThan(0);
    }
    
    if (agent.location) {
      expect(typeof agent.location).toBe('string');
      expect(agent.location.length).toBeGreaterThan(0);
    }
    
    if (agent.version) {
      expect(typeof agent.version).toBe('string');
      expect(agent.version.length).toBeGreaterThan(0);
    }
    
    if (agent.lastUpdated) {
      expect(agent.lastUpdated).toBeInstanceOf(Date);
    }

    // Validate metadata structure if present
    if (agent.metadata) {
      if (agent.metadata.modelType) {
        expect(typeof agent.metadata.modelType).toBe('string');
      }
      if (agent.metadata.maxTokens) {
        expect(typeof agent.metadata.maxTokens).toBe('number');
        expect(agent.metadata.maxTokens).toBeGreaterThan(0);
      }
      if (agent.metadata.responseTime) {
        expect(typeof agent.metadata.responseTime).toBe('number');
        expect(agent.metadata.responseTime).toBeGreaterThan(0);
      }
      if (agent.metadata.supportedLanguages) {
        expect(Array.isArray(agent.metadata.supportedLanguages)).toBe(true);
      }
      if (agent.metadata.category) {
        expect(['general', 'specialized', 'enterprise', 'demo', 'experimental'])
          .toContain(agent.metadata.category);
      }
      if (agent.metadata.priority !== undefined) {
        expect(typeof agent.metadata.priority).toBe('number');
        expect(agent.metadata.priority).toBeGreaterThanOrEqual(0);
        expect(agent.metadata.priority).toBeLessThanOrEqual(999);
      }
    }
  });

  it('should return 404 for non-existent agent', async () => {
    const response = await fetch('/api/agents/non-existent-agent-999', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(404);
    
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('Agent not found');
  });

  it('should validate agent ID format', async () => {
    // Test with invalid characters
    const response = await fetch('/api/agents/invalid@agent#id', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(400);
    
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('Invalid agent ID format');
  });

  it('should handle empty or null agent ID', async () => {
    const response = await fetch('/api/agents/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    // Should either redirect to agent list or return 404
    expect([302, 404]).toContain(response.status);
  });

  it('should include all required fields in response', async () => {
    const agentId = 'general-assistant-789';
    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(200);
    
    const agent: AgentInfo = await response.json();

    // Every required field must be present
    const requiredFields = ['id', 'name', 'description', 'status', 'capabilities'];
    requiredFields.forEach(field => {
      expect(agent).toHaveProperty(field);
      expect(agent[field as keyof AgentInfo]).toBeDefined();
      expect(agent[field as keyof AgentInfo]).not.toBeNull();
    });
  });
});