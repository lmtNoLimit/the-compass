import type { AgentInfo, AgentFilter } from '~/types';
import { shouldFilterAgent } from './agent-categorizer';

/**
 * Simple wrapper around smart filtering for backward compatibility
 * NOTE: Main filtering now happens in agent-categorizer.ts via shouldFilterAgent()
 */
export function filterAgents(
  agents: AgentInfo[], 
  filter?: AgentFilter
): AgentInfo[] {
  return agents.filter(agent => {
    // Use the smart filtering logic
    if (shouldFilterAgent(agent.id, agent.name)) {
      return false;
    }
    
    // Check enabled flag
    if (agent.metadata?.enabled === false) {
      return false;
    }
    
    // Check health requirement (basic status check)
    if (agent.status === 'error') {
      return false;
    }
    
    return true;
  });
}

/**
 * Get count of filtered agents
 */
export function getFilteredAgentCount(
  agents: AgentInfo[], 
  filter?: AgentFilter
): number {
  return filterAgents(agents, filter).length;
}