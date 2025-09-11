# Simplified Chat Contract (No Manual Session Calls)

**Feature**: 001-refine-the-chat  
**Date**: 2025-09-10  
**Contract Type**: Zero-Session UI Behavior Contract

## Key Change: Keep createSession Method, Don't Use It

**Important**: The `createSession` method will remain in the agent service for backward compatibility and potential future use, but the UI will not call it. All session management happens automatically through query calls.

## Route: /chat

### Expected Behavior (After Implementation)
**Method**: GET  
**Path**: `/chat`  
**Purpose**: Display empty chat interface with zero session management

#### Request
- No query parameters required
- User authentication via Clerk (existing)

#### Response
- Renders chat interface immediately
- Loads available agents list via `/api/chat` (GET)
- **MUST NOT** call any session-related APIs
- **MUST NOT** use `createSession` method from agent service

#### Success Criteria
- Page loads with only `/api/chat` (GET) for agents list
- Zero calls to `/api/chat/session` endpoints
- Zero calls to `agentEngine.createSession()` method
- Chat interface displays with agent selector
- Input field ready for typing immediately

## Route: /chat/$id

### Expected Behavior (After Implementation)  
**Method**: GET  
**Path**: `/chat/{sessionId}`  
**Purpose**: Load existing chat session (backward compatibility)

#### Request
- `sessionId` as path parameter
- User authentication via Clerk (existing)

#### Response
- Attempts to load existing session if valid
- Falls back to clean interface if session invalid/expired
- Maintains existing behavior for legacy URLs

#### Success Criteria
- Existing session URLs work (backward compatibility)
- Invalid sessions gracefully degrade to clean interface
- No new session creation on failed session loads

## API Contract Changes

### /api/chat (GET) - Unchanged
**Current Behavior**: Returns agents list  
**New Behavior**: Same - remains unchanged  
**Contract**: Continue to provide available agents list

### /api/chat/query (POST) - Core API
**Current Behavior**: Processes messages with optional sessionId  
**New Behavior**: Same - handle queries without requiring explicit sessionId
**Enhanced Contract**: Must work without frontend providing sessionId

```typescript
// Current query payload
{
  agentId: string;
  sessionId?: string;  // Optional - service can auto-generate
  prompt: string;
  userId?: string;
}
```

### /api/chat/session (POST) - Deprecated for UI Use
**Current Behavior**: Handles session CRUD operations  
**New Behavior**: Remains available but UI will not use it
**Contract**: Method stays for backward compatibility, no UI calls

## Frontend Component Contracts

### ModernAgentChat Component

#### Props Contract (Unchanged)
```typescript
interface ModernAgentChatProps {
  agents: AgentInfo[];
  conversation?: any;
  conversationId?: string;
}
```

#### Behavior Contract (Major Simplification)
**BEFORE**: Creates session via `agentEngine.createSession()` on mount  
**AFTER**: Never calls `createSession` - relies on automatic session handling

#### State Contract (Simplified)
```typescript
interface SimplifiedChatState {
  selectedAgent: string;    // UI-only agent selection
  inputValue: string;       // Current user input
  messages: Message[];      // Display messages only
  isLoading: boolean;       // Processing state only
  // REMOVED: All session-related state
}
```

#### Removed Methods from UI
- `createSession()` calls - keep method, don't use
- `fetchSessions()` - remove entirely
- `deleteSession()` - remove entirely  
- `handleNewSession()` - remove entirely

## Test Contracts

### Contract Test: Zero Session API Calls
```typescript
describe('/chat route with no session management', () => {
  test('MUST NOT call createSession on route access', async () => {
    // Arrange: Spy on createSession method
    const createSessionSpy = jest.spyOn(agentEngine, 'createSession');
    
    // Act: Navigate to /chat
    render(<ChatRoute />);
    await waitForElementToBeDisplayed();
    
    // Assert: createSession never called
    expect(createSessionSpy).not.toHaveBeenCalled();
  });
  
  test('MUST NOT call any session API endpoints', async () => {
    // Arrange: Monitor network calls
    const sessionApiSpy = jest.spyOn(sessionAPI, 'post');
    
    // Act: Load chat interface
    render(<ChatRoute />);
    await waitForElementToBeDisplayed();
    
    // Assert: No session API calls
    expect(sessionApiSpy).not.toHaveBeenCalledWith('/api/chat/session');
  });
});
```

### Contract Test: Direct Query Flow  
```typescript
describe('simplified message submission', () => {
  test('MUST query agent directly without session creation', async () => {
    // Arrange: Clean chat interface
    render(<ModernAgentChat agents={mockAgents} />);
    const queryApiSpy = jest.spyOn(queryAPI, 'post');
    
    // Act: Submit message directly
    await typeMessage('Hello agent');
    await clickSubmit();
    
    // Assert: Direct query call
    expect(queryApiSpy).toHaveBeenCalledWith('/api/chat/query', {
      agentId: 'demo-agent',
      prompt: 'Hello agent',
      // No sessionId in payload
    });
  });
});
```

### Contract Test: Agent Switching (UI Only)
```typescript
describe('agent switching without backend calls', () => {
  test('MUST NOT make any API calls when switching agents', async () => {
    // Arrange: Chat interface with agent selector
    render(<ModernAgentChat agents={mockAgents} />);
    const apiSpy = jest.spyOn(global, 'fetch');
    
    // Act: Switch agents multiple times
    await selectAgent('enterprise-admin');
    await selectAgent('demo-agent');  
    await selectAgent('enterprise-admin');
    
    // Assert: Zero API calls for agent switching
    expect(apiSpy).not.toHaveBeenCalled();
    expect(getSelectedAgent()).toBe('enterprise-admin');
  });
});
```

## Agent Service Contract Updates

### createSession Method Contract
```typescript
// KEEP this method for compatibility
async createSession(userId: string, agentId?: string): Promise<{sessionId: string}> {
  // Method remains unchanged - UI just won't call it
}

// UI will use streamQuery directly without explicit session creation
async streamQuery(request: {
  agentId: string;
  prompt: string;
  userId?: string;
  sessionId?: string;  // Optional - auto-generated if not provided
}): Promise<any> {
  // Service handles session creation internally if needed
}
```

## Breaking Changes

**None** - This is a pure UI simplification that:
- Keeps all backend methods intact
- Maintains API compatibility
- Preserves existing session URLs
- Only removes UI complexity

## Performance Contract

### Response Time Requirements
- `/chat` route: <100ms (no session overhead)
- Message submission: <500ms (includes auto-session handling)
- Agent switching: <10ms (UI-only operation)

### Resource Usage Requirements
- **Zero** session management API calls from UI
- **Zero** calls to `createSession` method from frontend
- **One** query API call per message submission
- **Minimal** state management (4 variables only)

## Error Handling Contract

### Session-Related Errors
**Eliminated** - Since UI doesn't manage sessions, no session-related errors can occur in the frontend.

### Query Failures
- Network failures: Show retry option
- Agent errors: Display error message
- Authentication errors: Redirect to login

### Backward Compatibility Errors
- Invalid session URLs: Gracefully fall back to clean interface
- Legacy session data: Ignore and start fresh

## UI State Management Contract

### State Transitions
```
Initial → AgentSelected → MessageSubmission → Response
   ↓            ↓               ↓               ↓
CleanUI    ReadyToChat    LoadingState    MessageDisplay
```

### Removed State Transitions
- ~~Session Creation~~
- ~~Session Loading~~
- ~~Session Management~~
- ~~Session Error Handling~~

All session concerns are handled transparently by the agent service.