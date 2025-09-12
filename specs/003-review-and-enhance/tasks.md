# Tasks: Review and Enhance Agent List

**Feature**: Remove fake/mock agents, display only real agents from Agent Engine  
**Branch**: `003-review-and-enhance`  
**Created**: 2025-09-11  

## Task Overview

This feature removes all mock/fake agents from the AgentList component and ensures only real agents from Vertex AI Agent Engine are displayed. The implementation follows TDD principles with tests written before code changes.

**Total Tasks**: 12  
**Parallel Groups**: 3  
**Estimated Time**: 4-6 hours  

## Task Execution Order

### Phase 1: Tests First (TDD) - PARALLEL GROUP A
These test tasks can be executed in parallel as they modify different files.

#### T001: Contract Test - Agent List API Filtering [P]
**File**: `/tests/contract/agent-filter.test.ts` (NEW)  
**Dependencies**: None  
**Reference**: `contracts/agent-list-api.yaml` lines 88-90 (ID pattern validation)  
**Description**: Write contract test to verify API returns only production agents without demo/test agents

**Implementation Details**:
```typescript
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
```

#### T002: Integration Test - No Demo Agents in UI [P]
**File**: `/tests/integration/agent-no-demo.test.ts` (NEW)  
**Dependencies**: None  
**Reference**: `spec.md` acceptance scenarios lines 50-53  
**Description**: Write integration test to verify UI doesn't display mock agents

**Implementation Details**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AgentList } from '~/components/features/AgentSelector/AgentList';
import type { AgentInfo } from '~/types';

// Mock data for testing
const mockAgentsWithDemo: AgentInfo[] = [
  {
    id: 'demo-agent-123',
    name: 'Demo Agent',
    description: 'Demo health check agent',
    status: 'active',
    capabilities: ['health-check'],
    metadata: { category: 'demo', enabled: true, isProduction: false }
  },
  {
    id: 'enterprise-admin-456',
    name: 'Enterprise Admin',
    description: 'Enterprise IT Administrator',
    status: 'active',
    capabilities: ['persona-simulation'],
    metadata: { category: 'enterprise', enabled: true, isProduction: true }
  }
];

describe('Agent UI Demo Filtering Integration', () => {
  // Test scenario 1: AgentList component filters demo agents (spec.md line 50)
  it('should only display production agents from Agent Engine', async () => {
    render(<AgentList agents={mockAgentsWithDemo} />);
    
    // Should see production agent
    expect(screen.getByText('Enterprise Admin')).toBeInTheDocument();
    
    // Should NOT see demo agent (filtered by API)
    expect(screen.queryByText('Demo Agent')).not.toBeInTheDocument();
  });

  // Test scenario 2: Empty state when no agents available (spec.md line 51) 
  it('should show appropriate empty state when no agents available', () => {
    render(<AgentList agents={[]} />);
    
    expect(screen.getByText('No production agents found')).toBeInTheDocument();
    expect(screen.getByText(/No production agents are currently available/)).toBeInTheDocument();
  });

  // Test scenario 3: Multiple production agents display correctly (spec.md line 52)
  it('should display all real agents with actual names and descriptions', () => {
    const productionAgents = mockAgentsWithDemo.filter(a => a.metadata?.isProduction);
    render(<AgentList agents={productionAgents} />);
    
    expect(screen.getByText('Enterprise Admin')).toBeInTheDocument();
    expect(screen.getByText('Enterprise IT Administrator')).toBeInTheDocument();
  });

  // Test scenario 4: No fake/mock agents appear anywhere (spec.md line 53)
  it('should not display any agents with demo/test patterns', () => {
    const allAgents = [
      ...mockAgentsWithDemo,
      {
        id: 'test-assistant',
        name: 'Test Assistant',
        description: 'Test agent',
        status: 'active' as const,
        capabilities: ['test'],
        metadata: { category: 'general', enabled: true, isProduction: true }
      }
    ];
    
    render(<AgentList agents={allAgents} />);
    
    // Should not see any agents with test/demo in name or ID
    expect(screen.queryByText('Demo Agent')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Assistant')).not.toBeInTheDocument();
  });
});
```

#### T003: Unit Test - Filter Validation Logic [P]
**File**: `/tests/unit/agent-filter-validator.test.ts` (NEW)  
**Dependencies**: None  
**Reference**: `data-model.md` validation rules lines 78-85  
**Description**: Write unit test for agent filtering functions

**Implementation Details**:
```typescript
import { describe, it, expect } from 'vitest';
import { filterAgents, getFilteredAgentCount } from '~/lib/agent-filter';
import type { AgentInfo, AgentStatus } from '~/types';

// Test data based on data-model.md samples
const createTestAgent = (overrides: Partial<AgentInfo> = {}): AgentInfo => ({
  id: 'test-agent',
  name: 'Test Agent',
  description: 'Test description',
  status: 'active' as AgentStatus,
  capabilities: ['test'],
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
```

### Phase 2: Configuration Updates

#### T004: Remove Demo Agents from Metadata
**File**: `/app/config/agent-metadata.json`  
**Dependencies**: T001, T002, T003 must be failing  
**Reference**: `quickstart.md` lines 27-49 (updated config), current config has `demo-agent-123`  
**Description**: Update configuration to remove all demo/test agents and add isProduction field

**Implementation Details**:
**REPLACE entire file content** with:
```json
{
  "agents": {
    "enterprise-admin-456": {
      "name": "Enterprise Admin",
      "description": "Enterprise IT Administrator persona for conducting user interviews and understanding enterprise workflows",
      "capabilities": ["persona-simulation", "interview", "enterprise-context", "workflow-analysis"],
      "category": "enterprise",
      "priority": 10,
      "icon": "briefcase",
      "enabled": true,
      "isProduction": true
    },
    "general-assistant-789": {
      "name": "General Assistant",
      "description": "General-purpose AI assistant for everyday tasks and conversations",
      "capabilities": ["general-purpose", "conversation", "task-assistance"],
      "category": "general",
      "priority": 1,
      "icon": "message-circle",
      "enabled": true,
      "isProduction": true
    }
  },
  "defaults": {
    "fallbackName": "Vertex AI Agent",
    "fallbackDescription": "An AI agent deployed in Vertex AI Agent Engine",
    "fallbackCapabilities": ["general-purpose"]
  }
}
```

**Changes Made**:
- ❌ **REMOVED**: `demo-agent-123` entry (was at line 3-11 in current config)
- ✅ **ADDED**: `isProduction: true` to all remaining agents
- ✅ **KEPT**: `enterprise-admin-456` and `general-assistant-789` as production agents

### Phase 3: Core Implementation

#### T005: Add Agent Filter Type Definition
**File**: `/app/types/index.ts`  
**Dependencies**: T004  
**Reference**: `data-model.md` lines 37-46 (AgentFilter definition)  
**Description**: Add AgentFilter interface and update AgentMetadata type

**Implementation Details**:
1. **Add after line 68** (before AgentInfo interface):
```typescript
export interface AgentFilter {
  excludeCategories: string[];
  excludePatterns: RegExp[];
  requireHealthCheck: boolean;
  productionOnly: boolean;
}
```

2. **Update AgentMetadata interface** (line 58-68) to add:
```typescript
// Add this field to existing AgentMetadata interface at line 67
isProduction?: boolean;
```

**Expected Result**: 
- AgentFilter interface added before AgentInfo
- AgentMetadata.isProduction field added
- All imports using these types should work without changes

#### T006: Implement Optimized Filter Function
**File**: `/app/lib/agent-filter.ts` (NEW)  
**Dependencies**: T005  
**Reference**: `research.md` lines 192-207 (optimized implementation)  
**Description**: Create optimized filtering function using for-loop pattern (60% faster than Array.filter)

**Implementation Details**:
```typescript
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
```

#### T007: Update Agent Discovery Filtering
**File**: `/app/lib/agent-engine.server.ts`  
**Dependencies**: T006  
**Reference**: Current implementation lines 210-285 (mergeAgentsWithMetadata)  
**Description**: Enhance mergeAgentsWithMetadata() to use new filter

**Implementation Details**:
1. **Add import at top of file** (after line 14):
```typescript
import { filterAgents } from './agent-filter';
```

2. **Update mergeAgentsWithMetadata method** at line 210:
   - **BEFORE filtering at line 283** (before sort), add:
```typescript
// Apply production agent filtering (filter demo/test agents)
console.log(`Pre-filter agent count: ${mergedAgents.length}`);
const filteredAgents = filterAgents(mergedAgents);
console.log(`Post-filter agent count: ${filteredAgents.length}`);
const excludedCount = mergedAgents.length - filteredAgents.length;
if (excludedCount > 0) {
  console.log(`Excluded ${excludedCount} demo/test agents from display`);
}

// Sort filtered agents by priority (lower numbers first) - KEEP EXISTING SORT
filteredAgents.sort((a, b) => {
  const priorityA = a.metadata?.priority || 999;
  const priorityB = b.metadata?.priority || 999;
  return priorityA - priorityB;
});

return filteredAgents; // Return filtered instead of mergedAgents
```

3. **Update isProduction handling** in metadata creation (line 239):
```typescript
// Add isProduction to metadata object
metadata: {
  category: metadata?.category || 'general',
  priority: metadata?.priority || 999,
  icon: metadata?.icon,
  enabled: metadata?.enabled !== false,
  isProduction: metadata?.isProduction !== false, // Default to true
  ...metadata,
},
```

#### T008: Update API Route Filtering
**File**: `/app/routes/api.agents.tsx`  
**Dependencies**: T007  
**Reference**: Current API route implementation  
**Description**: Ensure API endpoint applies filtering (should already work via T007)

**Implementation Details**:
**VERIFY that filtering is applied** - this task may be **NO-OP** if T007 correctly filters in `getAvailableAgents()`.

1. **Check current implementation** - the API route likely calls `agentEngineService.getAvailableAgents()`
2. **If filtering is already applied in T007**, this task is complete
3. **If additional filtering needed**, add at response level:

```typescript
// Only add if filtering not applied in agent-engine.server.ts
import { filterAgents } from '~/lib/agent-filter';

// In the loader/action function:
const agentList = await agentEngineService.getAvailableAgents(forceRefresh);

// Apply additional filtering if needed (likely not necessary after T007)
// const filteredAgents = filterAgents(agentList.agents);

return {
  ...agentList,
  // agents: filteredAgents, // Only if T007 didn't handle it
};
```

**Expected Result**: API returns only production agents, no demo/test agents in response

### Phase 4: Validation & Polish - PARALLEL GROUP B

#### T009: Update Empty State Message [P]
**File**: `/app/components/features/AgentSelector/AgentList.tsx`  
**Dependencies**: T008  
**Reference**: Current implementation lines 108-119 (empty state)  
**Description**: Update empty state text for clarity when no production agents available

**Implementation Details**:
**Update line 117** in the empty state section:

**BEFORE**:
```typescript
<p className="mt-2 text-sm text-gray-500">
  {searchTerm || selectedCategory !== 'all'
    ? 'Try adjusting your search filters.'
    : 'No agents are currently available.'}
</p>
```

**AFTER**:
```typescript
<p className="mt-2 text-sm text-gray-500">
  {searchTerm || selectedCategory !== 'all'
    ? 'Try adjusting your search filters.'
    : 'No production agents are currently available. Demo and test agents are now hidden.'}
</p>
```

**Also update the h3 text** at line 113:
```typescript
<h3 className="mt-4 text-sm font-medium text-gray-900">No production agents found</h3>
```

#### T010: Add Debug Logging [P]
**File**: `/app/lib/agent-engine.server.ts`  
**Dependencies**: T008  
**Reference**: Already partially implemented in T007  
**Description**: Enhance logging for filter operations and agent discovery

**Implementation Details**:
**ADD additional logging** in the `getAvailableAgents` method around line 392:

```typescript
// Add after line 396 (after vertexAgents discovery)
console.log(`[Agent Discovery] Discovered ${vertexAgents.length} agents from Vertex AI:`, 
  vertexAgents.map(a => ({ id: a.id, name: a.name })));

// Add after mergeAgentsWithMetadata call (around line 399)
const mergedAgents = this.mergeAgentsWithMetadata(vertexAgents);
console.log(`[Agent Filtering] Pre-filter: ${mergedAgents.length} agents`);

// The filtering logs from T007 should be here

// Add after health checks (around line 404)
console.log(`[Health Checks] Completed health checks for ${healthCheckedAgents.length} agents`);
const activeAgents = healthCheckedAgents.filter(a => a.status === 'active').length;
const errorAgents = healthCheckedAgents.filter(a => a.status === 'error').length;
console.log(`[Health Status] Active: ${activeAgents}, Error: ${errorAgents}, Inactive: ${healthCheckedAgents.length - activeAgents - errorAgents}`);

// Add summary logging
console.log(`[Agent Summary] Final agent list:`, 
  healthCheckedAgents.map(a => ({ 
    id: a.id, 
    name: a.name, 
    status: a.status, 
    category: a.metadata?.category,
    isProduction: a.metadata?.isProduction
  })));
```

### Phase 5: Verification - PARALLEL GROUP C

#### T011: Run All Tests [P]
**Dependencies**: T001-T010  
**Description**: Execute test suite and verify all tests pass

```bash
npm test -- tests/contract/agent-filter.test.ts
npm test -- tests/integration/agent-no-demo.test.ts
npm test -- tests/unit/agent-filter-validator.test.ts
npm test -- tests/integration/agent-*.test.ts
```

#### T012: Manual Verification [P]
**Dependencies**: T001-T010  
**Reference**: `quickstart.md` verification steps lines 14-89  
**Description**: Follow quickstart.md verification steps and acceptance criteria

**Implementation Checklist**:
```bash
# 1. Start dev server
npm run dev

# 2. Navigate to agents page
open http://localhost:3000/agents
```

**Verification Steps** (from quickstart.md and spec.md):

✅ **Scenario 1: Only Real Agents Displayed** (spec.md line 50)
- [ ] Navigate to `/agents`
- [ ] Observe agent list
- [ ] **Expected**: No demo/test/mock agents visible
- [ ] **Expected**: Only enterprise-admin-456 and general-assistant-789 shown

✅ **Scenario 2: Empty State Handling** (spec.md line 51)
- [ ] If no real agents available, check empty state
- [ ] **Expected**: "No production agents are currently available" message

✅ **Scenario 3: Agent Details Correct** (spec.md line 52) 
- [ ] Verify agent names match metadata config
- [ ] **Expected**: "Enterprise Admin" and "General Assistant" with correct descriptions

✅ **Scenario 4: No Fake Agents Anywhere** (spec.md line 53)
- [ ] Search UI for "demo", "test", "mock"
- [ ] Check agent selector in chat: `/chat`
- [ ] **Expected**: No fake agents found

✅ **API Direct Testing**:
```bash
# Test API directly
curl http://localhost:3000/api/agents | jq '.agents[] | {id, name, category: .metadata.category}'

# Should NOT see agents with:
# - id containing "demo", "test", "mock"
# - category of "demo" or "test"
```

✅ **Console Log Verification**:
- [ ] Check browser console for debug logs from T010
- [ ] **Expected**: "Pre-filter agent count" and "Post-filter agent count" logs
- [ ] **Expected**: "Excluded N demo/test agents" if any were filtered

✅ **Performance Check**:
- [ ] Navigate to `/agents?refresh=true` multiple times
- [ ] **Expected**: Page loads in <500ms (performance goal from plan.md line 41)
- [ ] **Expected**: Subsequent loads use 5-minute cache

## Parallel Execution Examples

### Execute Test Tasks (Group A)
```bash
# Run in parallel using Task agent
Task "Contract test for agent filtering" "Create test file at /tests/contract/agent-filter.test.ts" &
Task "Integration test for UI filtering" "Create test file at /tests/integration/agent-no-demo.test.ts" &
Task "Unit test for filter logic" "Create test file at /tests/unit/agent-filter-validator.test.ts" &
wait
```

### Execute Polish Tasks (Group B)
```bash
# Run after implementation
Task "Update empty state message" "Modify AgentList.tsx line 117" &
Task "Add debug logging" "Add console.log statements to agent-engine.server.ts" &
wait
```

### Execute Verification (Group C)
```bash
# Final validation
npm test -- tests/**/*filter*.test.ts &
npm run dev &
wait
```

## Success Criteria

- [ ] All contract tests pass
- [ ] All integration tests pass
- [ ] No agents with "demo", "test", "mock", "fake" in ID appear
- [ ] No agents with category "demo" or "test" appear
- [ ] Empty state shows appropriate message
- [ ] Performance: Filtering completes in <10ms
- [ ] Manual verification confirms no demo agents visible

## Rollback Plan

If issues occur:
```bash
# Revert configuration
git checkout -- app/config/agent-metadata.json

# Revert code changes
git checkout -- app/lib/agent-engine.server.ts
git checkout -- app/routes/api.agents.tsx

# Remove new files
rm -f app/lib/agent-filter.ts
rm -f tests/contract/agent-filter.test.ts
rm -f tests/integration/agent-no-demo.test.ts
rm -f tests/unit/agent-filter-validator.test.ts
```

## Notes

- Tests MUST be written and failing before implementation (TDD)
- Use for-loops instead of Array.filter() for 60% performance gain
- Cache filtered results for 5 minutes to reduce API calls
- Maintain backward compatibility - only filter display, not data structure