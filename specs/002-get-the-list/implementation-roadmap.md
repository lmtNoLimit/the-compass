# Implementation Roadmap: Dynamic Agent Discovery and Selection

**Branch**: `002-get-the-list`  
**Date**: 2025-09-11  
**Purpose**: Step-by-step implementation guide with cross-references

## Overview

This roadmap provides the exact sequence of implementation steps, referencing specific sections in our design documents and existing codebase files.

## File Mapping

### New Files to Create
| File | Purpose | References |
|------|---------|------------|
| `app/routes/agents.tsx` | Agent list page | [data-model.md](./data-model.md#agent) |
| `app/routes/api.agents.tsx` | Agent discovery API | [contracts/openapi.yaml](./contracts/openapi.yaml#/paths/~1agents) |
| `app/components/features/AgentSelector/` | Agent selection UI | [data-model.md](./data-model.md#agentselectionevent) |
| `app/config/agent-metadata.json` | Agent metadata mapping | [contracts/agent-metadata-config.json](./contracts/agent-metadata-config.json) |

### Files to Modify
| File | Current Location | Changes Required |
|------|------------------|------------------|
| `app/lib/agent-engine.server.ts` | Lines 86-113 `initializeAgents()` | Replace with `discoverAgents()` method |
| `app/types/index.ts` | Existing AgentInfo type | Extend with new fields from [data-model.md](./data-model.md#agent) |

## Implementation Phases

### Phase 1: Core Infrastructure

#### Step 1.1: Update Agent Service Discovery
**File**: `app/lib/agent-engine.server.ts`  
**Current**: Lines 86-113 `initializeAgents()` method  
**Action**: Replace with dynamic discovery

**Implementation Details**:
```typescript
// Replace initializeAgents() with:
async discoverAgents(): Promise<AgentInfo[]> {
  // 1. Fetch from Vertex AI (research.md: Authentication section)
  // 2. Load metadata config (contracts/agent-metadata-config.json)
  // 3. Merge data (data-model.md: Agent entity)
  // 4. Cache results (research.md: Caching Strategy)
}
```

**References**:
- Authentication pattern: [research.md](./research.md#vertex-ai-authentication-google-auth-library-10x)
- Data structure: [data-model.md](./data-model.md#agent)
- API endpoint: [research.md](./research.md#api-discovery)

#### Step 1.2: Create Agent Metadata Configuration
**File**: `app/config/agent-metadata.json`  
**Schema**: [contracts/agent-metadata-config.json](./contracts/agent-metadata-config.json)  
**Sample Data**:
```json
{
  "agents": {
    "demo-agent": {
      "name": "Demo Agent",
      "description": "Demo health check agent for testing",
      "capabilities": ["health-check", "basic-query"],
      "category": "demo",
      "priority": 100
    }
  }
}
```

**Validation**: JSON Schema validation using [contracts/agent-metadata-config.json](./contracts/agent-metadata-config.json)

#### Step 1.3: Extend Type Definitions
**File**: `app/types/index.ts`  
**Current**: Existing AgentInfo interface  
**Action**: Extend with fields from [data-model.md](./data-model.md#agent)

**Required Fields**:
- `status: AgentStatus` (enum from data-model.md)
- `category?: string` (from metadata config)
- `priority?: number` (for display ordering)
- `lastUpdated?: Date` (for cache management)

### Phase 2: API Implementation

#### Step 2.1: Create Agent Discovery API Route
**File**: `app/routes/api.agents.tsx`  
**Contract**: [contracts/openapi.yaml](./contracts/openapi.yaml#/paths/~1agents)  
**Response Type**: [data-model.md](./data-model.md#agentlistresponse)

**Implementation Pattern**:
```typescript
import { json } from 'react-router';
import { getAgentEngineService } from '~/lib/agent-engine.server';

export async function loader() {
  const service = getAgentEngineService();
  const agents = await service.discoverAgents();
  
  return json({
    agents,
    timestamp: new Date().toISOString(),
    cached: false, // Implement caching logic
    totalCount: agents.length
  });
}
```

**Error Handling**: [contracts/openapi.yaml](./contracts/openapi.yaml#/components/schemas/ErrorResponse)

#### Step 2.2: Create Agent Selection API
**File**: `app/routes/api.agents.tsx` (add action function)  
**Contract**: [contracts/openapi.yaml](./contracts/openapi.yaml#/paths/~1agents~1select)  
**Request Type**: [data-model.md](./data-model.md#agentselectionrequest)

### Phase 3: UI Implementation

#### Step 3.1: Create Agent List Page
**File**: `app/routes/agents.tsx`  
**Data Loading**: React Router v7 loader pattern ([research.md](./research.md#react-router-v7-implementation-details))  
**UI Components**: Reference existing patterns in `app/routes/chat.tsx`

**Loader Implementation**:
```typescript
export async function loader() {
  // Use pattern from research.md: React Router v7 section
  const response = await fetch('/api/agents');
  return response.json();
}

export default function AgentsPage() {
  const { agents } = useLoaderData<typeof loader>();
  // Render agent cards with data from data-model.md
}
```

#### Step 3.2: Create Agent Selector Components
**Directory**: `app/components/features/AgentSelector/`  
**Components**:
- `AgentCard.tsx` - Individual agent display
- `AgentList.tsx` - List container with search/filter
- `AgentSelector.tsx` - Main selection interface

**Integration**: Use in existing `app/routes/chat.tsx` for agent switching

### Phase 4: Integration & Testing

#### Step 4.1: Update Existing Chat Routes
**Files**: 
- `app/routes/chat.tsx` - Add agent selector component
- `app/routes/chat.$id.tsx` - Handle agent switching

**Integration Points**:
- Agent selection state management
- Session preservation (research.md: Conversation History Preservation)
- UI updates for selected agent display

#### Step 4.2: Implement Caching Strategy
**Approach**: TanStack Query integration ([research.md](./research.md#tanstack-query-v5-vs-manual-caching-decision))  
**Configuration**: 5-minute staleTime, optimistic updates  
**Fallback**: Cached data on API failures

## Testing Strategy

### Contract Tests
**Location**: `tests/contract/`  
**Files**: 
- `agents.contract.test.ts` - Validate API responses against [contracts/openapi.yaml](./contracts/openapi.yaml)
- `agent-metadata.schema.test.ts` - Validate config against [contracts/agent-metadata-config.json](./contracts/agent-metadata-config.json)

### Integration Tests
**Location**: `tests/integration/`  
**Files**:
- `agent-discovery.test.ts` - Test Vertex AI integration
- `agent-selection.test.ts` - Test agent switching flow
- `agents-page.test.ts` - Test UI interactions

**Test Scenarios**: Based on [quickstart.md](./quickstart.md#integration-tests)

### End-to-End Tests
**Framework**: Playwright (existing setup)  
**Scenarios**: [quickstart.md](./quickstart.md#feature-validation-steps)

## Migration Strategy

### Safe Deployment
1. **Feature Flag**: Control rollout of new agent discovery
2. **Backward Compatibility**: Keep `initializeAgents()` as fallback
3. **Gradual Migration**: Start with agent list page, then integrate into chat
4. **Monitoring**: Track performance metrics against targets in [research.md](./research.md#performance-benchmarks-and-targets)

### Rollback Plan
1. **Disable feature flag** to revert to static agents
2. **Restore original `initializeAgents()`** method
3. **Remove new routes** if needed
4. **Clear caches** to ensure clean state

## Success Criteria

### Performance Targets
- Agent list fetch: <500ms (p95)
- UI agent switching: <50ms
- Cache hit ratio: >80%

**Measurement**: [quickstart.md](./quickstart.md#performance-validation)

### Functional Requirements
All requirements from [spec.md](./spec.md#functional-requirements) must pass:
- FR-001 through FR-013 validation
- Error handling scenarios
- User acceptance criteria

## Cross-Reference Index

| Document | Primary Content | Key References |
|----------|----------------|----------------|
| [spec.md](./spec.md) | Requirements & user stories | FR-001 to FR-013, acceptance scenarios |
| [research.md](./research.md) | Technical decisions & patterns | Authentication, caching, performance |
| [data-model.md](./data-model.md) | Entity definitions & relationships | Agent, AgentStatus, cache models |
| [contracts/openapi.yaml](./contracts/openapi.yaml) | API specifications | Request/response schemas, error handling |
| [contracts/agent-metadata-config.json](./contracts/agent-metadata-config.json) | Configuration schema | Metadata structure, validation rules |
| [quickstart.md](./quickstart.md) | Testing & validation procedures | Test scenarios, troubleshooting, success criteria |

This roadmap provides the missing implementation bridge between our design documents and actual code development.