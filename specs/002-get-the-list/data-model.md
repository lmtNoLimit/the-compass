# Data Model: Dynamic Agent Discovery and Selection

**Date**: 2025-09-11  
**Feature**: 002-get-the-list

## Entity Definitions

### Agent
Primary entity representing a deployed AI agent in Vertex AI Agent Engine.

**Fields**:
| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique identifier for the agent | Non-empty, alphanumeric with hyphens |
| name | string | Yes | Display name of the agent | 1-100 characters |
| description | string | Yes | Detailed description of agent capabilities | 1-500 characters |
| status | AgentStatus | Yes | Current operational status | Enum: active, inactive, error |
| endpoint | string | No | API endpoint for the agent | Valid URL format |
| capabilities | string[] | Yes | List of agent capabilities/tags | Min 0, max 20 items, each 1-50 chars |
| projectId | string | No | GCP project ID | Valid GCP project format |
| location | string | No | Deployment location/region | Valid GCP region |
| version | string | No | Agent version identifier | Semantic version format |
| lastUpdated | Date | No | Last modification timestamp | ISO 8601 format |
| metadata | AgentMetadata | No | Additional agent information | JSON object |

### AgentStatus (Enum)
```typescript
enum AgentStatus {
  ACTIVE = 'active',      // Agent is available and operational
  INACTIVE = 'inactive',  // Agent is deployed but not available
  ERROR = 'error'        // Agent encountered an error
}
```

### AgentMetadata
Extended information about an agent (optional).

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| modelType | string | No | Underlying AI model type |
| maxTokens | number | No | Maximum token limit |
| responseTime | number | No | Average response time in ms |
| supportedLanguages | string[] | No | Supported languages |
| customConfig | Record<string, any> | No | Agent-specific configuration |

### AgentListResponse
Response structure for agent discovery API.

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agents | Agent[] | Yes | List of discovered agents |
| timestamp | Date | Yes | Response timestamp |
| cached | boolean | Yes | Whether response is from cache |
| totalCount | number | Yes | Total number of agents |

### AgentSelectionEvent
Event emitted when user selects an agent.

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agentId | string | Yes | Selected agent ID |
| previousAgentId | string | No | Previously selected agent ID |
| userId | string | Yes | User making the selection |
| timestamp | Date | Yes | Selection timestamp |
| context | SelectionContext | No | Additional context |

### SelectionContext
```typescript
interface SelectionContext {
  source: 'chat' | 'agents-page' | 'quick-switch';
  sessionId?: string;
  preserveHistory: boolean;
}
```

## State Transitions

### Agent Status State Machine
```
INACTIVE -> ACTIVE: Agent becomes available
ACTIVE -> INACTIVE: Agent is disabled
ACTIVE -> ERROR: Agent encounters error
ERROR -> ACTIVE: Error resolved
ERROR -> INACTIVE: Agent disabled due to error
INACTIVE -> ERROR: Error during activation attempt
```

## Relationships

### Agent -> User Session
- One agent can be associated with multiple user sessions
- Each session has exactly one active agent at a time
- Historical association preserved for context

### Agent -> Capabilities
- One agent has multiple capabilities (one-to-many)
- Capabilities are used for filtering and grouping
- No foreign key relationship (embedded array)

## Validation Rules

### Business Rules
1. **Unique Agent IDs**: No duplicate agent IDs in the system
2. **Required Fields**: Name and description cannot be empty
3. **Status Consistency**: Inactive agents cannot be selected
4. **Capability Limits**: Maximum 20 capabilities per agent
5. **Description Length**: Must be meaningful (min 10 characters)

### Data Integrity
1. **ID Format**: Must match pattern `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/`
2. **URL Validation**: Endpoints must be valid HTTPS URLs
3. **Version Format**: Follow semantic versioning if provided
4. **Timestamp Validation**: All dates in ISO 8601 format
5. **Array Constraints**: Empty arrays allowed but not null

## Cache Model

### AgentListCache
```typescript
interface AgentListCache {
  data: Agent[];
  timestamp: Date;
  ttl: number; // Time to live in seconds (300 default)
  hash: string; // For cache invalidation
}
```

### Caching Rules
1. **TTL**: 5 minutes (300 seconds) for agent list
2. **Invalidation**: On manual refresh or error recovery
3. **Stale-While-Revalidate**: Serve stale data while fetching fresh
4. **Cache Key**: `agents:list:{userId}:{hash}`

## API Contracts Reference

### Endpoints (See [contracts/openapi.yaml](./contracts/openapi.yaml))
- `GET /api/agents` - Retrieve list of available agents
  - Response: AgentListResponse (this document)
  - Contract: [openapi.yaml#/paths/~1agents](./contracts/openapi.yaml#/paths/~1agents)
- `POST /api/agents/select` - Select an agent for current session
  - Request: AgentSelectionRequest (this document)
  - Response: AgentSelectionResponse (this document)
  - Contract: [openapi.yaml#/paths/~1agents~1select](./contracts/openapi.yaml#/paths/~1agents~1select)
- `GET /api/agents/:id` - Get specific agent details
  - Response: Agent (this document)
  - Contract: [openapi.yaml#/paths/~1agents~1{agentId}](./contracts/openapi.yaml#/paths/~1agents~1{agentId})
- `POST /api/agents/refresh` - Force refresh of agent list
  - Response: RefreshResponse (this document)
  - Contract: [openapi.yaml#/paths/~1agents~1refresh](./contracts/openapi.yaml#/paths/~1agents~1refresh)

### Implementation Files
- **Service Layer**: `app/lib/agent-engine.server.ts` (replace `initializeAgents()` method)
- **API Routes**: `app/routes/api.agents.tsx` (new file)
- **UI Components**: `app/components/features/AgentSelector/` (new directory)
- **Configuration**: `app/config/agent-metadata.json` (schema: [agent-metadata-config.json](./contracts/agent-metadata-config.json))

## Migration Considerations

### From Static to Dynamic Agents
1. Existing sessions maintain their agent associations
2. Static agent IDs mapped to dynamic equivalents
3. Graceful fallback if dynamic discovery fails
4. No data loss during transition

### Backward Compatibility
- Agent ID format remains consistent
- Existing AgentInfo type extended, not replaced
- API responses include version field for client compatibility

## Performance Metrics

### Target Metrics
- Agent list fetch: < 500ms (p95)
- Cache hit ratio: > 80%
- Agent selection: < 100ms
- Search/filter: < 50ms (client-side)

### Monitoring Points
1. Agent discovery API latency
2. Cache effectiveness
3. Error rates by agent
4. Selection frequency by agent
5. User session agent switches

## Security Considerations

### Access Control
- All agents visible to authenticated users (v1)
- Future: Role-based agent access
- Audit logging for agent selection

### Data Privacy
- No PII in agent metadata
- Session associations anonymized in logs
- Agent endpoints not exposed to client

## Future Extensions

### Planned Enhancements
1. **Agent Categories**: Hierarchical grouping
2. **Usage Analytics**: Track popular agents
3. **Custom Agents**: User-defined agent configurations
4. **Agent Composition**: Combine multiple agents
5. **A/B Testing**: Agent selection experiments