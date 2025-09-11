# Research Findings: Dynamic Agent Discovery and Selection

**Date**: 2025-09-11  
**Feature**: 002-get-the-list  
**Purpose**: Resolve NEEDS CLARIFICATION items and establish technical decisions

## Executive Summary
This document consolidates research findings for implementing dynamic agent discovery from Vertex AI Agent Engine. All clarification points from the specification have been addressed with practical decisions based on existing codebase patterns and best practices.

## Clarification Resolutions

### 1. Agent Refresh Frequency
**Decision**: Fetch on page load with 5-minute client-side cache  
**Rationale**: Balances fresh data with API efficiency. Agents don't change frequently enough to warrant real-time updates.  
**Alternatives considered**: 
- Real-time WebSocket updates (too complex for current need)
- No caching (excessive API calls)
- Server-side only caching (doesn't help with client navigation)

### 2. User Permissions for Agent Access
**Decision**: All agents visible to all authenticated users (initial implementation)  
**Rationale**: Simplifies MVP. Permission filtering can be added later if needed.  
**Alternatives considered**:
- Role-based access control (premature optimization)
- Agent-level permissions (requires Vertex AI changes)

### 3. Agent Status Types
**Decision**: Three states - active, inactive, error  
**Rationale**: Maps directly to Vertex AI response states and connection status  
**Alternatives considered**:
- Binary active/inactive (loses error information)
- More granular states (unnecessary complexity)

### 4. Agent Capabilities Display
**Decision**: Display capabilities array as badges/tags  
**Rationale**: Capabilities already exist in current AgentInfo type, easy to surface  
**Alternatives considered**:
- Text descriptions only (less scannable)
- Hidden until hover (poor discoverability)

### 5. Conversation History Preservation
**Decision**: Preserve history client-side, warn on agent switch  
**Rationale**: Maintains user context while being transparent about limitations  
**Alternatives considered**:
- Clear history on switch (data loss)
- Server-side history merge (complex, may confuse agents)

### 6. Agent Metadata Display
**Decision**: Show name, description, status, capabilities, last updated  
**Rationale**: Provides essential information without overwhelming UI  
**Alternatives considered**:
- Minimal (name only) - insufficient for selection
- Everything available - information overload

### 7. Default Agent Selection
**Decision**: No default selection, prompt user to choose  
**Rationale**: Explicit choice prevents confusion about which agent is active  
**Alternatives considered**:
- Auto-select first agent (may not be appropriate)
- Remember last used (could be stale/removed)

### 8. Agent Grouping/Organization
**Decision**: Flat list initially, grouped by capability tags  
**Rationale**: Simple to implement, natural organization emerges from capabilities  
**Alternatives considered**:
- Hierarchical categories (needs predefinition)
- No organization (hard to scan with many agents)

### 9. Search and Filter
**Decision**: Client-side text search across name/description/capabilities  
**Rationale**: Fast, responsive, works with cached data  
**Alternatives considered**:
- Server-side search (unnecessary for small datasets)
- No search (acceptable for <10 agents, limiting for growth)

### 10. Agent Unavailability Handling
**Decision**: Show error state in UI, prevent selection, retry mechanism  
**Rationale**: Transparent to user, allows recovery without page reload  
**Alternatives considered**:
- Hide unavailable agents (confusing if previously used)
- Force page reload (poor UX)

## Technical Research Findings

### Vertex AI Agent Engine Integration
**Current Implementation Analysis**:
- Service already has `getAvailableAgents()` method returning AgentInfo[]
- AgentInfo type includes: id, name, description, status, endpoint, capabilities
- Authentication via GoogleAuth library already configured
- Session management exists but needs refactoring for dynamic agents

**API Discovery**:
The Vertex AI API for listing reasoning engines (agents) returns minimal information:
- Endpoint: `GET https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/reasoningEngines`
- Returns: List of resource names in format `projects/{project}/locations/{location}/reasoningEngines/{id}`
- Does NOT return: Agent metadata like name, description, or capabilities directly

**Required Changes**:
- Remove `initializeAgents()` private method
- Implement `discoverAgents()` method that:
  1. Lists reasoning engine resource names from Vertex AI
  2. Maps resource IDs to metadata (stored in environment or config)
  3. Enriches with runtime status by attempting a health check query
- Maintain a metadata mapping for agent details (name, description, capabilities)
- Implement caching layer for agent list
- Add retry logic for transient failures

### React Router v7 Patterns
**Data Loading Strategy**:
- Use loader functions for server-side data fetching
- Implement proper error boundaries
- Leverage built-in caching mechanisms
- Use action functions for agent selection

**Route Structure**:
- `/agents` - Main agents list page
- `/api/agents` - API endpoint for agent discovery
- Integrate agent selector into existing chat routes

### Performance Considerations
**Caching Strategy**:
- Server-side: 5-minute Redis/memory cache for agent list
- Client-side: React Query with 5-minute stale time
- Invalidation: Manual refresh button + automatic on errors

**Optimization Techniques**:
- Lazy load agent details on hover/focus
- Virtual scrolling for large agent lists (future)
- Debounced search input
- Optimistic UI updates for selection

### Error Handling Patterns
**API Failures**:
- Graceful degradation to cached data if available
- Clear error messages with retry options
- Fallback to a minimal "demo" agent if all else fails

**Network Issues**:
- Exponential backoff for retries
- Offline detection and queuing
- Service worker for resilience (future)

## Implementation Recommendations

### Priority Order
1. Implement agent discovery API endpoint
2. Create agents list UI component
3. Integrate selection into chat interface
4. Add caching layer
5. Implement search/filter
6. Add error handling and retry logic

### Testing Strategy
- Unit tests for discovery service
- Integration tests for API endpoints
- E2E tests for user flows
- Performance tests for large agent lists
- Error simulation tests

### Migration Path
1. Deploy new discovery endpoint alongside existing code
2. Feature flag for gradual rollout
3. Maintain backward compatibility during transition
4. Remove old initialization code after validation

## Risk Mitigation

### Identified Risks
1. **Vertex AI API Changes**: Mitigate with version pinning and monitoring
2. **Performance degradation**: Implement caching and pagination
3. **Authentication issues**: Comprehensive error handling and fallbacks
4. **Breaking changes**: Feature flags and gradual rollout

### Contingency Plans
- Fallback to hard-coded agents if discovery fails
- Circuit breaker for API calls
- Manual override configuration for emergencies
- Rollback procedure documented

## Additional Technical Research

### React Router v7 Implementation Details
**Version**: 7.8.2 (Latest stable, released August 2024)  
**Key Features**: Unified package, built-in SSR, automatic revalidation, full TypeScript support

**Loader Pattern for Agent Discovery**:
```typescript
// app/routes/agents.tsx
export async function loader() {
  const agents = await agentEngineService.getAvailableAgents();
  return { agents, timestamp: new Date().toISOString() };
}

// Client-side caching
export async function clientLoader({ serverLoader }) {
  const cached = await cache.get('agents');
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 min
    return cached;
  }
  const data = await serverLoader();
  cache.set('agents', data);
  return data;
}
```

### Vertex AI Authentication (Google Auth Library 10.x)
**Required Scopes**: `https://www.googleapis.com/auth/cloud-platform`  
**IAM Roles**: `roles/aiplatform.user` or `roles/aiplatform.admin`

**Production Authentication Pattern**:
```typescript
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
});

// Token refresh with retry logic
async function getValidToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}
```

### TanStack Query v5 vs Manual Caching Decision

**Current Status**: TanStack Query v5.62.11 already installed in package.json

**Benefits for Agent Discovery**:
- Eliminates 200+ lines of manual cache management (see `agent-engine.server.ts:621-844`)
- Automatic retry logic and error handling
- Optimistic updates for <50ms agent switching
- Background refresh for data freshness

**Alternative Minimal Approach**:
```typescript
// Simple cache without TanStack Query
const agentCache = new Map();
export async function getCachedAgents() {
  const cached = agentCache.get('agents');
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.data;
  }
  const agents = await discoverAgents();
  agentCache.set('agents', { data: agents, timestamp: Date.now() });
  return agents;
}
```

**Recommendation**: Use TanStack Query for automatic cache management and performance benefits, aligning with existing project dependencies.

### Agent Metadata Standards and Security

**Industry Standard**: Model Context Protocol (MCP) emerging as universal standard
- OpenAI adopted MCP in March 2025
- Google DeepMind confirmed support April 2025
- Anthropic introduced MCP November 2024

**Schema Validation**: JSON Schema Draft 2020-12 with OpenAPI 3.0 foundation
**Versioning**: SchemaVer format (MODEL-REVISION-ADDITION) preferred over SemVer for configurations

**Security Requirements**:
- Encrypt sensitive configurations (use OS-level keychain/credential manager)
- HTTPS/TLS for all metadata exchanges
- JSON Schema validation at all API boundaries
- Audit logging for configuration access

**Configuration Architecture**:
```json
{
  "agents": {
    "demo-agent-123": {
      "name": "Demo Agent",
      "description": "Demo health check agent",
      "capabilities": ["health-check", "basic-query"],
      "category": "demo",
      "priority": 100,
      "security": {
        "accessLevel": "public",
        "encryptionRequired": false
      }
    }
  },
  "schema": {
    "version": "1.0.0",
    "format": "openapi-3.0",
    "validationRequired": true
  }
}
```

### Performance Benchmarks and Targets

**Measured Performance Requirements**:
- Agent list fetch: <500ms (p95) - achievable with Vertex AI list endpoint
- UI agent switching: <50ms - requires client-side caching/optimistic updates
- Search/filter: <50ms - client-side implementation with cached data
- Cache hit ratio: >80% - 5-minute TTL balances freshness vs performance

**Caching Strategy**:
- Server-side: 5-minute memory cache for agent list
- Client-side: TanStack Query with 5-minute staleTime
- Background refresh: Automatic revalidation on focus/reconnect
- Fallback: Cached data on API failures

### Implementation Priorities Refined

**Phase 1 (Critical)**:
1. Implement Vertex AI agent discovery endpoint (`GET /locations/{location}/reasoningEngines`)
2. Create metadata configuration file with JSON Schema validation
3. Add agent list route with React Router v7 loader pattern

**Phase 2 (Enhanced)**:
4. Integrate TanStack Query for caching and optimistic updates
5. Add agent status health checks via lightweight queries
6. Implement search/filter UI with client-side processing

**Phase 3 (Future)**:
7. MCP protocol preparation for industry standard compatibility
8. Advanced security features (RBAC, audit logging)
9. Performance monitoring and optimization

## Conclusion
All clarification points have been resolved with pragmatic decisions that balance functionality, performance, and maintainability. Additional research has identified specific version requirements, authentication patterns, and industry standards that will guide implementation. The hybrid approach (Vertex AI discovery + metadata configuration) aligns with current industry practices while providing a migration path to emerging standards like MCP.