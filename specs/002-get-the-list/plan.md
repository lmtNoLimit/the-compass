# Implementation Plan: Dynamic Agent Discovery and Selection

**Branch**: `002-get-the-list` | **Date**: 2025-09-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-get-the-list/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement dynamic agent discovery from Vertex AI Agent Engine using a hybrid approach: fetch deployed agent IDs from Vertex AI API and combine with metadata configuration. Create a dedicated Agents route to display all deployed agents, allowing users to select agents for chat conversations without relying on static initialization.

## Technical Context
**Language/Version**: TypeScript/Node.js 20+  
**Primary Dependencies**: React Router v7, Google Auth Library, Vertex AI Agent Engine  
**Storage**: Prisma ORM with database (type TBD from existing config)  
**Testing**: Vitest for unit/integration tests  
**Target Platform**: Web application (server-side rendering with React Router)
**Project Type**: web - React Router fullstack application  
**Performance Goals**: Agent list fetch <500ms, UI agent switching <50ms  
**Constraints**: Must maintain backward compatibility with existing chat sessions  
**Scale/Scope**: Support unlimited deployed agents, ~100s of concurrent users

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (existing React Router fullstack app)
- Using framework directly? Yes - React Router v7, no wrappers
- Single data model? Yes - Agent entities only
- Avoiding patterns? Yes - direct service calls, no unnecessary abstractions

**Architecture**:
- EVERY feature as library? No - integrating into existing app structure
- Libraries listed: agent-discovery service module
- CLI per library: N/A - web feature
- Library docs: Will document in code comments

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes - actual Vertex AI calls
- Integration tests for: new API endpoints, agent service changes
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes - console.log with context
- Frontend logs → backend? Via existing infrastructure
- Error context sufficient? Yes - detailed error messages

**Versioning**:
- Version number assigned? Using package.json version
- BUILD increments on every change? Via npm version
- Breaking changes handled? No breaking changes expected

## Project Structure

### Documentation (this feature)
```
specs/002-get-the-list/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# React Router v7 Application Structure (existing)
app/
├── routes/
│   ├── agents.tsx           # NEW: Agents list route
│   ├── api.agents.tsx       # NEW: API endpoint for agents
│   └── [existing routes]
├── components/
│   └── features/
│       └── AgentSelector/   # NEW: Agent selection components
├── lib/
│   └── agent-engine.server.ts  # MODIFY: Remove initializeAgents
└── types/
    └── index.ts                 # MODIFY: Add agent types if needed

tests/
├── integration/
│   └── agents.test.ts       # NEW: Agent discovery tests
└── [existing tests]
```

**Structure Decision**: Web application structure (existing React Router v7 app)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Agent refresh frequency strategy
   - Caching strategy for agent lists
   - Error handling patterns for Vertex AI
   - Session persistence when switching agents

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Reference [implementation-roadmap.md](./implementation-roadmap.md) for step-by-step sequence
- Each contract → contract test task [P] (see [contracts/openapi.yaml](./contracts/openapi.yaml))
- Each entity → model creation task [P] (see [data-model.md](./data-model.md))
- Each user story → integration test task (see [quickstart.md](./quickstart.md))
- Implementation tasks to make tests pass

**Specific Task Areas**:
1. **Service Layer** (Priority 1): 
   - Replace `agent-engine.server.ts:86-113` with dynamic discovery
   - Implement Vertex AI authentication ([research.md](./research.md#vertex-ai-authentication))
   - Add metadata configuration loading ([contracts/agent-metadata-config.json](./contracts/agent-metadata-config.json))

2. **API Layer** (Priority 2):
   - Create `/api/agents` endpoint ([contracts/openapi.yaml](./contracts/openapi.yaml#/paths/~1agents))
   - Add agent selection endpoint ([data-model.md](./data-model.md#agentselectionevent))
   - Implement error handling ([contracts/openapi.yaml](./contracts/openapi.yaml#/components/schemas/ErrorResponse))

3. **UI Layer** (Priority 3):
   - Build agents list page using React Router v7 loaders ([research.md](./research.md#react-router-v7-implementation-details))
   - Create agent selector components ([data-model.md](./data-model.md#agent))
   - Integrate with existing chat routes (`app/routes/chat.tsx`)

4. **Integration & Testing** (Priority 4):
   - Contract tests validating OpenAPI specs
   - Integration tests for Vertex AI discovery
   - E2E tests following [quickstart.md](./quickstart.md#feature-validation-steps) scenarios

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Service → API → UI → Integration
- Mark [P] for parallel execution (independent files)
- Follow migration strategy in [implementation-roadmap.md](./implementation-roadmap.md#migration-strategy)

**Cross-Reference Requirements**:
- All tasks must reference specific sections in design documents
- Include file paths and line numbers for modifications
- Link to contract validation points
- Reference performance targets from [research.md](./research.md#performance-benchmarks-and-targets)

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md with full cross-references

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations - using existing app structure and patterns*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*