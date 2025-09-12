import type { AgentInfo, AgentFilter } from '~/types';

// Pre-compiled regex for performance (from research.md line 195)
const EXCLUDE_PATTERNS = /demo|test|mock|fake|dummy/i;

// Default filter configuration (from data-model.md lines 43-46)
const DEFAULT_FILTER: AgentFilter = {
  excludeCategories: ['demo', 'test'],
  excludePatterns: [EXCLUDE_PATTERNS],
  requireHealthCheck: true,
  productionOnly: true
};

/**
 * Filters agents using optimized for-loop pattern
 * Performance: 60% faster than Array.filter() (from research.md line 187)
 */
export function filterAgents(
  agents: AgentInfo[], 
  filter: AgentFilter = DEFAULT_FILTER
): AgentInfo[] {
  const result: AgentInfo[] = [];
  
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    
    // Check ID patterns (contracts/agent-list-api.yaml line 90)
    if (EXCLUDE_PATTERNS.test(agent.id)) continue;
    
    // Check category exclusions
    if (filter.excludeCategories.includes(agent.metadata?.category || '')) continue;
    
    // Check enabled flag
    if (agent.metadata?.enabled === false) continue;
    
    // Check production flag (data-model.md line 35)
    if (filter.productionOnly && agent.metadata?.isProduction === false) continue;
    
    // Check health requirement
    if (filter.requireHealthCheck && agent.status === 'error') continue;
    
    result.push(agent);
  }
  
  return result;
}

/**
 * Get count of filtered agents without creating array
 */
export function getFilteredAgentCount(
  agents: AgentInfo[], 
  filter: AgentFilter = DEFAULT_FILTER
): number {
  let count = 0;
  
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    
    if (EXCLUDE_PATTERNS.test(agent.id)) continue;
    if (filter.excludeCategories.includes(agent.metadata?.category || '')) continue;
    if (agent.metadata?.enabled === false) continue;
    if (filter.productionOnly && agent.metadata?.isProduction === false) continue;
    if (filter.requireHealthCheck && agent.status === 'error') continue;
    
    count++;
  }
  
  return count;
}