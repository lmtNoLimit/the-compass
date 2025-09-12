# Data Model: Review and Enhance Agent List

**Date**: 2025-09-11  
**Feature**: Remove fake/mock agents, display only real agents

## Entities

### AgentInfo (existing, enhanced)
**Purpose**: Represents an AI agent with its metadata and status

**Fields**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| id | string | Yes | Not contains: demo, test, mock, fake | Unique agent identifier |
| name | string | Yes | Min length: 1 | Display name of the agent |
| description | string | Yes | Min length: 1 | Agent description |
| status | AgentStatus | Yes | Enum: ACTIVE, INACTIVE, ERROR | Current agent status |
| capabilities | string[] | Yes | Min items: 1 | List of agent capabilities |
| endpoint | string | No | Valid URL | Agent API endpoint |
| projectId | string | No | Valid GCP project | Google Cloud project ID |
| location | string | No | Valid GCP region | Deployment location |
| lastUpdated | Date | Yes | Valid date | Last update timestamp |
| metadata | AgentMetadata | No | See below | Additional agent metadata |

### AgentMetadata (existing, enhanced)
**Purpose**: Additional metadata for agent configuration

**Fields**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| category | string | Yes | Not equals: demo, test | Agent category |
| priority | number | No | Range: 1-999 | Display priority |
| icon | string | No | Valid emoji/icon | Display icon |
| enabled | boolean | Yes | - | Whether agent is enabled |
| isProduction | boolean | Yes | Default: true | Production flag |

### AgentFilter (new)
**Purpose**: Filtering criteria for agent list

**Fields**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| excludeCategories | string[] | Yes | Default: ['demo', 'test'] | Categories to exclude |
| excludePatterns | RegExp[] | Yes | Valid regex | ID patterns to exclude |
| requireHealthCheck | boolean | Yes | Default: true | Require passing health check |
| productionOnly | boolean | Yes | Default: true | Show only production agents |

## State Transitions

### Agent Status States
```
INACTIVE -> ACTIVE (health check passes)
ACTIVE -> ERROR (health check fails)
ERROR -> ACTIVE (health check recovers)
INACTIVE -> ERROR (health check fails)
```

### Agent Visibility States
```
HIDDEN (matches filter criteria) -> VISIBLE (passes all filters)
VISIBLE -> HIDDEN (filter criteria changes)
```

## Relationships

1. **AgentInfo** has one optional **AgentMetadata**
2. **AgentFilter** applies to multiple **AgentInfo** entities
3. **AgentListResponse** contains multiple filtered **AgentInfo** entities

## Validation Rules

### Agent Validation
1. **ID Validation**: Agent ID must not contain: 'demo', 'test', 'mock', 'fake', 'dummy'
2. **Category Validation**: Category must not be 'demo' or 'test' for production display
3. **Health Check**: Agent must respond to health_check within 5 seconds
4. **Metadata Consistency**: If metadata.enabled is false, agent is hidden
5. **Production Flag**: If metadata.isProduction is false, agent is hidden in production

### Filter Application Order
1. Apply ID pattern exclusions
2. Apply category exclusions
3. Check enabled flag
4. Check production flag
5. Apply health check requirement
6. Sort by priority

## Data Constraints

### Performance
- Agent list cached for 5 minutes (300 seconds)
- Health checks timeout after 5 seconds per agent
- Maximum 100 agents displayed without pagination

### Business Rules
- At least one agent must be available (show empty state otherwise)
- Demo agents never shown in production environment
- Failed health checks mark agent as ERROR status
- Disabled agents (enabled: false) never displayed

## Migration Requirements

### Configuration Changes
1. Remove all demo/test agents from agent-metadata.json
2. Add isProduction flag to existing agents (default: true)
3. Update category field for any misclassified agents

### Backward Compatibility
- Existing agent IDs remain unchanged
- API response structure unchanged
- Client-side filtering preserves existing behavior

## Sample Data

### Valid Production Agent
```json
{
  "id": "enterprise-admin-456",
  "name": "Enterprise Admin",
  "description": "Enterprise IT Administrator persona",
  "status": "ACTIVE",
  "capabilities": ["persona-simulation", "interview"],
  "endpoint": "https://us-central1-aiplatform.googleapis.com/...",
  "metadata": {
    "category": "enterprise",
    "priority": 10,
    "enabled": true,
    "isProduction": true
  }
}
```

### Filtered Demo Agent (will be hidden)
```json
{
  "id": "demo-agent-123",
  "name": "Demo Agent",
  "description": "Demo health check agent",
  "status": "ACTIVE",
  "capabilities": ["health-check"],
  "metadata": {
    "category": "demo",
    "enabled": true,
    "isProduction": false
  }
}
```