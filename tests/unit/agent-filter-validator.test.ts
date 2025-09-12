import { describe, it, expect } from 'vitest';
import { filterAgents, getFilteredAgentCount } from '~/lib/agent-filter';
import type { AgentInfo, AgentStatus } from '~/types';

// Test data based on data-model.md samples
const createTestAgent = (overrides: Partial<AgentInfo> = {}): AgentInfo => ({
  id: 'agent-001',
  name: 'Sample Agent',
  description: 'Sample description',
  status: 'active' as AgentStatus,
  capabilities: ['general'],
  lastUpdated: new Date(),
  metadata: {
    category: 'general',
    enabled: true,
    isProduction: true,
    priority: 100
  },
  ...overrides
});

describe('Agent Filter Validation', () => {
  describe('filterAgents', () => {
    it('should exclude agents with demo in ID', () => {
      const agents = [
        createTestAgent({ id: 'demo-agent-123' }),
        createTestAgent({ id: 'production-agent' })
      ];
      
      const filtered = filterAgents(agents);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('production-agent');
    });

    it('should exclude agents with test in ID', () => {
      const agents = [
        createTestAgent({ id: 'test-agent-456' }),
        createTestAgent({ id: 'enterprise-admin' })
      ];
      
      const filtered = filterAgents(agents);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('enterprise-admin');
    });

    it('should exclude agents with demo category', () => {
      const agents = [
        createTestAgent({ metadata: { category: 'demo', enabled: true, isProduction: true } }),
        createTestAgent({ metadata: { category: 'enterprise', enabled: true, isProduction: true } })
      ];
      
      const filtered = filterAgents(agents);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].metadata?.category).toBe('enterprise');
    });

    it('should exclude disabled agents', () => {
      const agents = [
        createTestAgent({ metadata: { enabled: false, category: 'general', isProduction: true } }),
        createTestAgent({ metadata: { enabled: true, category: 'general', isProduction: true } })
      ];
      
      const filtered = filterAgents(agents);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].metadata?.enabled).toBe(true);
    });

    it('should exclude non-production agents when productionOnly is true', () => {
      const agents = [
        createTestAgent({ metadata: { isProduction: false, enabled: true, category: 'general' } }),
        createTestAgent({ metadata: { isProduction: true, enabled: true, category: 'general' } })
      ];
      
      const filtered = filterAgents(agents);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].metadata?.isProduction).toBe(true);
    });
  });

  describe('getFilteredAgentCount', () => {
    it('should return correct count without creating array', () => {
      const agents = [
        createTestAgent({ id: 'demo-agent' }),
        createTestAgent({ id: 'production-1' }),
        createTestAgent({ id: 'production-2' })
      ];
      
      const count = getFilteredAgentCount(agents);
      expect(count).toBe(2);
    });
  });
});