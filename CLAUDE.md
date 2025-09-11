# persona-compass Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-11

## Active Technologies
- TypeScript/React (React Router v7), Node.js server (001-refine-the-chat, 002-get-the-list)
- React Router v7, Clerk auth, Vertex AI Agent Engine, Google Auth (001-refine-the-chat, 002-get-the-list)
- Hybrid agent discovery: Vertex AI API + metadata configuration (002-get-the-list)

## Project Structure
```
app/
├── routes/
│   ├── chat.tsx                    # Main chat route (needs lazy loading)
│   ├── chat.$id.tsx               # Specific chat route (needs preservation)  
│   ├── api.chat.tsx               # Chat API endpoints
│   ├── api.chat.session.tsx       # Session management API
│   ├── api.chat.query.tsx         # Query API
│   ├── agents.tsx                  # NEW: Agents list route (002-get-the-list)
│   └── api.agents.tsx             # NEW: Agent discovery API (002-get-the-list)
├── components/features/
│   ├── ModernAgentChat.tsx        # Main chat component (needs refactoring)
│   └── AgentSelector/             # NEW: Agent selection components (002-get-the-list)
├── lib/
│   └── agent-engine.server.ts     # Session management + agent discovery
└── config/
    └── agent-metadata.json         # NEW: Agent metadata mapping (002-get-the-list)
tests/
```

## Commands
- Follow existing npm scripts for testing and building
- Use React Testing Library for component testing
- Vertex AI Agent Engine for session management and agent discovery

## Code Style
- TypeScript with React patterns
- Follow standard conventions  
- Lazy session creation patterns
- Component state management over eager API calls
- Hybrid configuration approach for agent metadata

## Recent Changes
- 002-get-the-list: Implementing dynamic agent discovery from Vertex AI using hybrid approach (API + metadata config)
- 001-refine-the-chat: Added lazy chat session creation - sessions only created on first message submission, not route access
- 001-refine-the-chat: Implements ChatGPT/Gemini UI patterns with clean, minimal interface

## Key Patterns
### Zero Session Management in UI
- Remove ALL session-related logic from frontend components
- Never call `createSession` method from UI (keep method for compatibility)
- Direct query API calls without explicit session management
- Vertex AI Agent Engine handles sessions automatically

### Simplified State Management
- Only 4 state variables: selectedAgent, inputValue, messages, isLoading
- Agent switching is pure UI operation (no backend calls)
- Direct message submission to query API
- Zero session displays or indicators in UI

### Performance Through Simplification
- Eliminate ALL session-related API calls from frontend
- Instant route loading (no session overhead)
- Agent switching in <10ms (UI-only operation)
- Direct query pattern: message → API → response

### Dynamic Agent Discovery (002-get-the-list)
- Hybrid approach: Vertex AI API lists deployed agents + metadata from config
- Agent metadata stored in config/agent-metadata.json
- Runtime status check via health queries to each agent
- 5-minute cache on both server and client
- Fallback to cached data on API failures

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->