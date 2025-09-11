# Tasks: Simplified Chat UI (Zero Session Management)

**Input**: Design documents from `/specs/001-refine-the-chat/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Found: TypeScript/React, React Router v7, Node.js
   → ✅ Structure: Web application (app/ directory)
2. Load optional design documents:
   → data-model.md: 4 simplified state variables only
   → contracts/: Zero session management contracts
   → research.md: Remove all session logic from UI
3. Generate tasks by category:
   → Tests: Zero session API call validation
   → Removal: Delete session-related code
   → Simplification: Direct query API integration
   → UI Polish: Clean interface updates
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file (ModernAgentChat.tsx) = sequential
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `app/` directory contains both routes and components
- **Components**: `app/components/features/`
- **Routes**: `app/routes/`
- **Library**: `app/lib/`

## Phase 3.1: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.2
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T001 [P] Write test for zero session API calls on /chat route load in `tests/integration/test_chat_route_no_session.tsx`
- [ ] T002 [P] Write test for direct query API usage without session in `tests/integration/test_direct_query.tsx`
- [ ] T003 [P] Write test for UI-only agent switching in `tests/integration/test_agent_switching.tsx`
- [ ] T004 [P] Write test for chat continuity without UI session management in `tests/integration/test_chat_continuity.tsx`

## Phase 3.2: Remove Session Logic (Core Simplification)
- [ ] T005 Remove session creation useEffect hook from `app/components/features/ModernAgentChat.tsx` (lines 129-178)
- [ ] T006 Remove session state variables from `app/components/features/ModernAgentChat.tsx` (lines 32-44)
- [ ] T007 Remove fetchSessions function from `app/components/features/ModernAgentChat.tsx` (lines 186-213)
- [ ] T008 Remove deleteSession function from `app/components/features/ModernAgentChat.tsx` (lines 217-266)
- [ ] T009 Remove handleNewSession function from `app/components/features/ModernAgentChat.tsx` (lines 390-437)
- [ ] T010 Remove session-related UI elements from chat header in `app/components/features/ModernAgentChat.tsx` (lines 618-622)
- [ ] T011 Remove session sidebar display from `app/components/features/ModernAgentChat.tsx` (lines 463-598)

## Phase 3.3: Simplify Message Flow
- [ ] T012 Update handleSubmit to use direct query without sessionId in `app/components/features/ModernAgentChat.tsx` (lines 268-388)
- [ ] T013 Update handleAgentChange to be UI-only operation in `app/components/features/ModernAgentChat.tsx` (lines 439-442)
- [ ] T014 Simplify component state to only 4 variables in `app/components/features/ModernAgentChat.tsx`
- [ ] T015 [P] Update `/api/chat/query` endpoint to handle queries without explicit sessionId in `app/routes/api.chat.query.tsx`

## Phase 3.4: Route Updates
- [ ] T016 [P] Remove session loading from chat route loader in `app/routes/chat.tsx`
- [ ] T017 [P] Update chat.$id route for backward compatibility only in `app/routes/chat.$id.tsx`
- [ ] T018 [P] Mark api.chat.session.tsx as deprecated (add deprecation comment) in `app/routes/api.chat.session.tsx`

## Phase 3.5: Clean UI Updates
- [ ] T019 Update chat interface to show clean empty state (ChatGPT/Gemini-like) in `app/components/features/ModernAgentChat.tsx`
- [ ] T021 Ensure input field is immediately ready on route load in `app/components/features/ModernAgentChat.tsx`

## Phase 3.6: Verification & Polish
- [ ] T022 [P] Run quickstart validation scenarios from `specs/001-refine-the-chat/quickstart.md`
- [ ] T023 [P] Verify performance targets: <100ms route load, <10ms agent switching
- [ ] T024 [P] Update TypeScript interfaces to remove session-related types
- [ ] T025 Clean up unused imports and dead code from all modified files

## Dependencies
- Tests (T001-T004) must complete and fail before implementation (T005-T021)
- T005-T011 (removal tasks) should complete before T012-T014 (simplification)
- T012-T014 blocks T019-T021 (UI updates)
- All implementation before verification (T022-T025)

## Parallel Execution Examples
```bash
# Launch all tests together (different files):
Task: "Write test for zero session API calls in tests/integration/test_chat_route_no_session.tsx"
Task: "Write test for direct query API in tests/integration/test_direct_query.tsx"
Task: "Write test for UI-only agent switching in tests/integration/test_agent_switching.tsx"
Task: "Write test for chat continuity in tests/integration/test_chat_continuity.tsx"

# Launch route updates together (different files):
Task: "Remove session loading from app/routes/chat.tsx"
Task: "Update chat.$id route in app/routes/chat.$id.tsx"
Task: "Add deprecation to app/routes/api.chat.session.tsx"

# Launch verification tasks together:
Task: "Run quickstart validation scenarios"
Task: "Verify performance targets"
Task: "Update TypeScript interfaces"
```

## Notes
- **CRITICAL**: Most changes are in `ModernAgentChat.tsx` - these CANNOT be parallel
- Session removal is mostly deletion - simpler than refactoring
- Keep `createSession` method in backend but never call it from UI
- Verify zero session API calls after each phase
- Agent service handles sessions automatically - UI doesn't need to know

## Validation Checklist
*GATE: Must verify before marking feature complete*

- [ ] All tests pass (T001-T004)
- [ ] Zero session API calls from UI verified
- [ ] No calls to `createSession` method from frontend
- [ ] Chat functionality maintained
- [ ] Performance targets met (<100ms route load)
- [ ] UI is clean and simple (no session indicators)
- [ ] Agent switching is instant (UI-only)
- [ ] Direct query pattern working correctly

## Implementation Notes

### Key Code Removals
1. **useEffect for session creation** - Delete entire block
2. **Session state variables** - Remove 5 useState declarations
3. **Session management functions** - Delete 4 functions completely
4. **Session UI elements** - Remove sidebar and header displays

### Simplified State (After)
```typescript
const [selectedAgent, setSelectedAgent] = useState<string>('demo-agent');
const [inputValue, setInputValue] = useState('');
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);
// That's it - only 4 state variables!
```

### Direct Query Pattern
```typescript
// No sessionId needed - service handles it
const response = await fetch('/api/chat/query', {
  method: 'POST',
  body: JSON.stringify({
    agentId: selectedAgent,
    prompt: inputValue
    // No sessionId in payload
  })
});
```

Total Tasks: 25
Estimated Time: 4-6 hours (mostly removal/simplification)
Risk Level: Low (removing complexity, not adding)