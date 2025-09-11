# Tasks: Dynamic Agent Discovery and Selection

**Input**: Design documents from `/specs/002-get-the-list/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **React Router v7 App**: `app/` directory structure
- **Tests**: `tests/` at repository root
- **Configuration**: `app/config/` for metadata files

## Phase 3.1: Setup

### T001: Create Agent Metadata Configuration
Create metadata configuration file for agent discovery mapping
- **File**: `app/config/agent-metadata.json`
- **Schema**: Use `/specs/002-get-the-list/contracts/agent-metadata-config.json`
- **Action**: Create with initial demo agent configuration
- **Validation**: JSON Schema validation against contract

### T002: [P] Configure Agent Metadata Schema Validation
Set up JSON Schema validation for agent metadata configuration
- **File**: `app/lib/agent-metadata-validator.ts`
- **Action**: Create validation functions using agent-metadata-config.json schema
- **Dependencies**: T001 (requires metadata config to exist)

### T003: [P] Update TypeScript Types
Extend existing AgentInfo interface with new fields from data model
- **File**: `app/types/index.ts`
- **Action**: Add AgentStatus enum, extend AgentInfo with category, priority, lastUpdated
- **Reference**: data-model.md Agent entity definition

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### T004: [P] Contract Test - GET /api/agents
Create contract test for agent list endpoint
- **File**: `tests/contract/agents-get.test.ts`
- **Contract**: `/specs/002-get-the-list/contracts/openapi.yaml#/paths/~1agents`
- **Action**: Test response schema matches AgentListResponse from data-model.md
- **Must Fail**: No implementation exists yet

### T005: [P] Contract Test - POST /api/agents/select
Create contract test for agent selection endpoint
- **File**: `tests/contract/agents-select.test.ts`
- **Contract**: `/specs/002-get-the-list/contracts/openapi.yaml#/paths/~1agents~1select`
- **Action**: Test request/response schemas match data model
- **Must Fail**: No implementation exists yet

### T006: [P] Contract Test - GET /api/agents/:id
Create contract test for individual agent endpoint
- **File**: `tests/contract/agents-by-id.test.ts`
- **Contract**: `/specs/002-get-the-list/contracts/openapi.yaml#/paths/~1agents~1{agentId}`
- **Action**: Test response schema matches Agent from data-model.md
- **Must Fail**: No implementation exists yet

### T007: [P] Contract Test - POST /api/agents/refresh
Create contract test for agent refresh endpoint
- **File**: `tests/contract/agents-refresh.test.ts`
- **Contract**: `/specs/002-get-the-list/contracts/openapi.yaml#/paths/~1agents~1refresh`
- **Action**: Test response schema matches RefreshResponse from data-model.md
- **Must Fail**: No implementation exists yet

### T008: [P] Integration Test - Agent Discovery Flow
Create integration test for complete agent discovery workflow
- **File**: `tests/integration/agent-discovery.test.ts`
- **Scenario**: From quickstart.md "View Available Agents" 
- **Action**: Test Vertex AI → metadata merge → cache → UI display
- **Must Fail**: No service implementation exists yet

### T009: [P] Integration Test - Agent Selection Flow
Create integration test for agent selection and switching
- **File**: `tests/integration/agent-selection.test.ts`
- **Scenario**: From quickstart.md "Select an Agent for Chat"
- **Action**: Test agent selection → session update → UI update
- **Must Fail**: No selection implementation exists yet

### T010: [P] Integration Test - Error Handling
Create integration test for error scenarios
- **File**: `tests/integration/agent-errors.test.ts`
- **Scenario**: From quickstart.md "Test Error Handling"
- **Action**: Test network failures, API errors, cache fallbacks
- **Must Fail**: No error handling implementation exists yet

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### T011: Update Agent Engine Service - Discovery Method
Replace static agent initialization with dynamic discovery
- **File**: `app/lib/agent-engine.server.ts`
- **Action**: Replace `initializeAgents()` method (lines 86-113) with `discoverAgents()`
- **Implementation**: Vertex AI API call + metadata config merge
- **Reference**: research.md Vertex AI Authentication section

### T012: [P] Create Agent Discovery API Route - GET /api/agents
Implement agent list endpoint
- **File**: `app/routes/api.agents.tsx`
- **Action**: Create loader function that calls getAvailableAgents()
- **Response**: AgentListResponse schema from data-model.md
- **Caching**: 5-minute cache with TanStack Query integration

### T013: Add Agent Selection API Route - POST /api/agents/select
Implement agent selection endpoint in existing API route
- **File**: `app/routes/api.agents.tsx` (add action function)
- **Action**: Create action function for agent selection
- **Request**: AgentSelectionRequest schema from data-model.md
- **Response**: AgentSelectionResponse schema from data-model.md

### T014: Add Individual Agent API Route - GET /api/agents/:id
Implement specific agent details endpoint
- **File**: `app/routes/api.agents.tsx` (extend loader)
- **Action**: Handle agent ID parameter in loader
- **Response**: Agent schema from data-model.md
- **Error**: 404 when agent not found

### T015: Add Agent Refresh API Route - POST /api/agents/refresh
Implement forced refresh endpoint
- **File**: `app/routes/api.agents.tsx` (add refresh action)
- **Action**: Create cache invalidation and fresh fetch
- **Response**: RefreshResponse schema from data-model.md
- **Cache**: Clear existing cache and repopulate

### T016: [P] Create Agent List Page Component
Create main agents listing page
- **File**: `app/routes/agents.tsx`
- **Action**: React Router v7 page with loader for data fetching
- **Data**: Use loader pattern from research.md
- **UI**: Display agent cards with search/filter functionality

### T017: [P] Create Agent Selector Components
Create reusable agent selection UI components
- **Directory**: `app/components/features/AgentSelector/`
- **Files**: `AgentCard.tsx`, `AgentList.tsx`, `AgentSelector.tsx`
- **Action**: Create component library for agent selection
- **Integration**: Use in both agents page and chat interface

## Phase 3.4: Integration

### T018: Integrate Agent Selector into Chat Routes
Add agent selection to existing chat interface
- **File**: `app/routes/chat.tsx`
- **Action**: Add agent selector component and selection state
- **Preservation**: Handle conversation history per research.md decisions
- **UI**: Show selected agent in header

### T019: Update Chat Session Route with Agent Context
Modify specific chat route to handle agent switching
- **File**: `app/routes/chat.$id.tsx`
- **Action**: Add agent context to existing chat session
- **State**: Manage agent changes within active session
- **Warning**: User confirmation when switching agents

### T020: Configure TanStack Query Integration
Set up caching and optimistic updates for agent operations
- **File**: `app/hooks/useAgents.ts`
- **Action**: Create React Query hooks for agent operations
- **Configuration**: 5-minute staleTime, optimistic updates for selection
- **Reference**: research.md TanStack Query patterns

### T021: Add Agent Health Check System
Implement runtime agent status checking
- **File**: `app/lib/agent-health-checker.ts`
- **Action**: Periodic health checks via lightweight queries
- **Status**: Update agent status (active/inactive/error)
- **Integration**: Feed into agent discovery service

## Phase 3.5: Polish

### T022: [P] Unit Tests - Agent Metadata Validation
Create unit tests for agent metadata validation logic
- **File**: `tests/unit/agent-metadata-validator.test.ts`
- **Action**: Test JSON schema validation edge cases
- **Coverage**: Valid configs, invalid configs, missing fields

### T023: [P] Unit Tests - Agent Service Methods
Create unit tests for agent service operations
- **File**: `tests/unit/agent-engine-service.test.ts`
- **Action**: Test discoverAgents, caching, error handling
- **Mocking**: Mock Vertex AI API responses

### T024: [P] Performance Tests
Validate performance targets from research.md
- **File**: `tests/performance/agent-performance.test.ts`
- **Targets**: <500ms API fetch, <50ms UI switching, >80% cache hit
- **Action**: Load testing and performance measurement
- **Tools**: Use existing Vitest performance testing

### T025: [P] End-to-End Tests
Create E2E tests following quickstart validation scenarios
- **File**: `tests/e2e/agent-discovery.e2e.ts`
- **Scenarios**: Complete user journeys from quickstart.md
- **Framework**: Playwright (existing setup)
- **Coverage**: Happy path, error scenarios, performance

### T026: [P] Update Documentation
Update project documentation with new agent discovery feature
- **File**: `app/components/features/README.md`
- **Action**: Document agent selector components and usage
- **Examples**: Code examples for using agent selection
- **Integration**: How to integrate with existing chat flows

### T027: Performance Monitoring Setup
Add performance monitoring for agent operations
- **File**: `app/lib/agent-metrics.ts`
- **Action**: Track agent discovery latency, cache hit rates
- **Integration**: Log metrics for production monitoring
- **Reference**: research.md performance benchmarks

## Dependencies

### Critical Path
- Setup (T001-T003) before everything
- Tests (T004-T010) before implementation (T011-T021)
- T011 blocks T012-T015 (API routes need service)
- T003 blocks T016-T017 (UI needs types)
- T012-T015 block T018-T019 (chat integration needs APIs)

### Parallel Opportunities
- **T004-T010**: All contract and integration tests (different files)
- **T002, T003**: Schema validation and types (different files)
- **T016, T017**: UI components (different directories)
- **T022-T026**: All polish tasks (different files)

### Sequential Requirements
- T013-T015: Same file (`api.agents.tsx`) - must be sequential
- T018-T019: Chat route modifications - sequential to avoid conflicts

## Parallel Execution Examples

### Phase 3.2 - All Tests Together
```bash
# Launch T004-T010 in parallel (all different files):
Task("Contract test GET /api/agents in tests/contract/agents-get.test.ts")
Task("Contract test POST /api/agents/select in tests/contract/agents-select.test.ts") 
Task("Contract test GET /api/agents/:id in tests/contract/agents-by-id.test.ts")
Task("Contract test POST /api/agents/refresh in tests/contract/agents-refresh.test.ts")
Task("Integration test agent discovery in tests/integration/agent-discovery.test.ts")
Task("Integration test agent selection in tests/integration/agent-selection.test.ts")
Task("Integration test error handling in tests/integration/agent-errors.test.ts")
```

### Phase 3.3 - UI Components
```bash
# Launch T016-T017 in parallel (different directories):
Task("Create agent list page in app/routes/agents.tsx")
Task("Create agent selector components in app/components/features/AgentSelector/")
```

### Phase 3.5 - Polish Tasks
```bash
# Launch T022-T026 in parallel (all different files):
Task("Unit tests for agent metadata validation in tests/unit/agent-metadata-validator.test.ts")
Task("Unit tests for agent service in tests/unit/agent-engine-service.test.ts") 
Task("Performance tests in tests/performance/agent-performance.test.ts")
Task("E2E tests in tests/e2e/agent-discovery.e2e.ts")
Task("Update documentation in app/components/features/README.md")
```

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T004-T007)
- [x] All entities have model/type tasks (T003, T011)
- [x] All tests come before implementation (T004-T010 before T011-T021)
- [x] Parallel tasks truly independent (different files/directories)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Performance targets included (T024)
- [x] Integration scenarios covered (T008-T010, T025)
- [x] Migration strategy addressed (T011 replaces existing code)

## Notes
- [P] tasks can run in parallel (different files, no dependencies)
- Verify all tests fail before implementing features (TDD)
- Commit after each completed task
- Reference implementation-roadmap.md for detailed step-by-step guidance
- Use research.md for technical decisions and patterns
- Follow data-model.md for exact schema definitions
- Validate against contracts/ for API compliance