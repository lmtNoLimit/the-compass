import type { AgentMetadata } from '~/types';

/**
 * Smart agent categorization based on displayName patterns
 * Eliminates need for static configuration files
 */
export function categorizeAgent(displayName: string, description?: string): AgentMetadata {
  const name = displayName.toLowerCase();
  const desc = (description || '').toLowerCase();
  
  // Enterprise/Admin agents
  if (name.includes('admin') || name.includes('enterprise') || 
      desc.includes('administration') || desc.includes('enterprise')) {
    return {
      category: 'enterprise',
      priority: 10,
      icon: 'settings',
      enabled: true,
      isProduction: true
    };
  }
  
  // Health check / monitoring agents
  if (name.includes('health') || name.includes('check') || name.includes('monitor') ||
      desc.includes('health') || desc.includes('diagnostic') || desc.includes('monitoring')) {
    return {
      category: 'specialized',
      priority: 1,
      icon: 'activity',
      enabled: true,
      isProduction: true
    };
  }
  
  // Assistant/General purpose agents
  if (name.includes('assistant') || name.includes('general') ||
      desc.includes('assistant') || desc.includes('general')) {
    return {
      category: 'general',
      priority: 50,
      icon: 'message-circle',
      enabled: true,
      isProduction: true
    };
  }
  
  // Default fallback for unknown agents
  return {
    category: 'general',
    priority: 999,
    icon: 'cpu',
    enabled: true,
    isProduction: true
  };
}

/**
 * Check if agent should be filtered out based on name patterns
 */
export function shouldFilterAgent(agentId: string, displayName: string): boolean {
  const demoTestPattern = /demo|test|mock|fake|dummy/i;
  
  // Filter by ID pattern
  if (demoTestPattern.test(agentId)) return true;
  
  // Filter by display name pattern
  if (demoTestPattern.test(displayName)) return true;
  
  return false;
}