import { describe, it, expect, beforeAll } from 'vitest';
import type { AgentListResponse } from '~/types';

describe('Agent List API Contract', () => {
  let agentResponse: AgentListResponse;
  
  beforeAll(async () => {
    const response = await fetch('/api/agents?refresh=true');
    agentResponse = await response.json();
  });

  it('should exclude agents with demo/test/mock/fake in ID', () => {
    const invalidAgents = agentResponse.agents.filter(agent => 
      /demo|test|mock|fake|dummy/i.test(agent.id)
    );
    expect(invalidAgents).toEqual([]);
  });

  it('should exclude agents with demo or test category', () => {
    const demoAgents = agentResponse.agents.filter(agent => 
      agent.metadata?.category === 'demo' || agent.metadata?.category === 'test'
    );
    expect(demoAgents).toEqual([]);
  });

  it('should exclude disabled agents', () => {
    const disabledAgents = agentResponse.agents.filter(agent => 
      agent.metadata?.enabled === false
    );
    expect(disabledAgents).toEqual([]);
  });
  
  // Reference: contracts/agent-list-api.yaml schema validation
  it('should match OpenAPI schema structure', () => {
    expect(agentResponse).toHaveProperty('agents');
    expect(agentResponse).toHaveProperty('timestamp');
    expect(agentResponse).toHaveProperty('cached');
    expect(agentResponse).toHaveProperty('totalCount');
  });
});