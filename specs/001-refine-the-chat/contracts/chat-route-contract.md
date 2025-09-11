# Chat Route Contract

**Feature**: 001-refine-the-chat  
**Date**: 2025-09-10  
**Contract Type**: Route Behavior Contract

## Route: /chat

### Expected Behavior (After Implementation)
**Method**: GET  
**Path**: `/chat`  
**Purpose**: Display empty chat interface without creating backend sessions

#### Request
- No query parameters required
- User authentication via Clerk (existing)

#### Response
- Renders chat interface immediately
- Loads available agents list
- **MUST NOT** create any backend sessions
- **MUST NOT** make session-related API calls

#### Success Criteria
- Page loads without any `/api/chat/session` calls with `create_session` action
- Chat interface displays with agent selector
- Input field is ready for typing
- No loading indicators related to session creation
- Browser network tab shows no session creation requests

## Route: /chat/$id

### Expected Behavior (After Implementation)  
**Method**: GET  
**Path**: `/chat/{sessionId}`  
**Purpose**: Load existing chat session

#### Request
- `sessionId` as path parameter
- User authentication via Clerk (existing)

#### Response
- Loads existing session if accessible by user
- Displays conversation history
- Maintains existing behavior (no changes needed)

#### Success Criteria
- Existing sessions load correctly
- Message history displays properly
- Session ownership validation works
- Error handling for invalid sessionId works

## API Contract Changes

### /api/chat (GET)
**Current Behavior**: Returns agents list  
**New Behavior**: Same - no changes  
**Contract**: Must remain unchanged for backwards compatibility

### /api/chat/session (POST)
**Current Behavior**: Handles session CRUD operations  
**New Behavior**: Same - no changes  
**Contract**: Must remain unchanged for backwards compatibility

### /api/chat/query (POST)  
**Current Behavior**: Processes messages with sessionId  
**New Behavior**: Same - no changes  
**Contract**: Must remain unchanged for backwards compatibility

## Frontend Component Contracts

### ModernAgentChat Component

#### Props Contract (No Changes)
```typescript
interface ModernAgentChatProps {
  agents: AgentInfo[];
  conversation?: any;
  conversationId?: string;
}
```

#### Behavior Contract (New Requirements)
**BEFORE**: Creates session on mount via useEffect  
**AFTER**: Creates session only on first message submission

#### State Contract (Updated)
```typescript
interface ChatState {
  sessionId: string | null;        // Null until first message
  messages: Message[];             // Can exist without session
  selectedAgent: string;           // UI-only until session created
  isLoading: boolean;              // Processing state
  inputValue: string;              // User input
  hasActiveSession: boolean;       // Derived from sessionId !== null
}
```

## Test Contracts

### Contract Test: Chat Route Loading
```typescript
describe('/chat route lazy loading', () => {
  test('MUST NOT create session on route access', async () => {
    // Arrange: Mock session API
    const sessionCreateSpy = jest.spyOn(sessionAPI, 'create');
    
    // Act: Navigate to /chat
    render(<ChatRoute />);
    await waitForElementToBeDisplayed();
    
    // Assert: No session creation calls
    expect(sessionCreateSpy).not.toHaveBeenCalled();
  });
});
```

### Contract Test: First Message Submission  
```typescript
describe('first message submission', () => {
  test('MUST create session on first message submit', async () => {
    // Arrange: Empty chat interface
    render(<ModernAgentChat agents={mockAgents} />);
    
    // Act: Submit first message
    await typeMessage('Hello');
    await clickSubmit();
    
    // Assert: Session created
    expect(sessionAPI.create).toHaveBeenCalledWith({
      action: 'create_session',
      agentId: 'demo-agent'
    });
  });
});
```

### Contract Test: Agent Switching Pre-Session
```typescript
describe('agent switching before session', () => {
  test('MUST NOT create session when switching agents', async () => {
    // Arrange: Chat interface, no session
    render(<ModernAgentChat agents={mockAgents} />);
    
    // Act: Switch agents
    await selectAgent('enterprise-admin');
    
    // Assert: No session creation
    expect(sessionAPI.create).not.toHaveBeenCalled();
    expect(getSelectedAgent()).toBe('enterprise-admin');
  });
});
```

## Breaking Changes

**None Expected** - This implementation should be fully backwards compatible.

### Compatibility Requirements
- Existing sessions continue to work unchanged
- API endpoints remain the same
- Component props unchanged  
- Route patterns unchanged
- Authentication flows unchanged

## Performance Contract

### Response Time Requirements
- `/chat` route must load in <200ms (no session creation overhead)
- First message submission <500ms (includes session creation)
- Agent switching <50ms (UI-only operation)

### Resource Usage
- Zero session creation API calls on route access
- One session creation call per chat conversation
- No redundant agent switching API calls

## Error Handling Contract

### Session Creation Failures
- User sees appropriate error message
- Input field remains available for retry
- No partial session states
- Original message content preserved for retry

### Network Failures
- Graceful degradation when API unavailable
- Clear user feedback about connectivity issues
- Retry mechanisms for session creation
- Fallback UI states