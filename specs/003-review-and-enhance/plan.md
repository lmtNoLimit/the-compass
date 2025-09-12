# Implementation Plan: Review and Enhance Agent List

**Branch**: `003-review-and-enhance` | **Date**: 2025-09-11 | **Spec**: `/specs/003-review-and-enhance/spec.md`
**Input**: Feature specification from `/specs/003-review-and-enhance/spec.md`

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
Remove all mock/fake agent data from the AgentList component and ensure only real agents from Vertex AI Agent Engine are displayed. The system currently uses a hybrid approach (API + metadata config) to discover agents, but includes demo/mock agents that should be removed.

## Technical Context
**Language/Version**: TypeScript 5.8.3, Node.js 20+  
**Primary Dependencies**: React Router v7, Vertex AI Agent Engine SDK, Google Auth Library  
**Storage**: Agent metadata in JSON config files, runtime cache in memory  
**Testing**: Vitest with React Testing Library  
**Target Platform**: Web application (Node.js server + React frontend)
**Project Type**: web - React Router app with server-side components  
**Performance Goals**: Agent list loads in <500ms, agent discovery API cached for 5 minutes  
**Constraints**: Must handle Vertex AI API failures gracefully, no hardcoded agent data  
**Scale/Scope**: Support dynamic discovery of unlimited agents from Vertex AI

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (app, tests) ✓ - Under max of 3
- Using framework directly? YES - React Router, Vertex AI SDK used directly
- Single data model? YES - AgentInfo type used consistently
- Avoiding patterns? YES - No unnecessary abstractions

**Architecture**:
- EVERY feature as library? NO - Modifying existing agent components
- Libraries listed: Using existing agent-engine.server.ts library
- CLI per library: N/A - Web application feature
- Library docs: N/A - Using existing documentation

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES - Will write failing tests first
- Git commits show tests before implementation? YES - Will commit tests first
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES - Real Vertex AI API calls in tests
- Integration tests for: new libraries, contract changes, shared schemas? YES
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? YES - Existing console.log with context
- Frontend logs → backend? YES - Error reporting in place
- Error context sufficient? YES - Agent ID, status, errors logged

**Versioning**:
- Version number assigned? N/A - Feature modification, not new release
- BUILD increments on every change? N/A - Using git commits
- Breaking changes handled? NO BREAKING CHANGES - Backward compatible

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application structure) - Already established in the codebase

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

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
- Contract test for agent filtering rules [P]
- Integration test for no demo agents in UI [P]
- Unit test for filter validation logic [P]
- Implementation tasks to apply filtering

**Specific Tasks to Generate**:
1. Write contract test for agent-filter validation
2. Write integration test for demo agent exclusion
3. Update agent-metadata.json to remove demo agents
4. Add filtering logic to mergeAgentsWithMetadata()
5. Add ID pattern validation to exclude test/mock agents
6. Update empty state messaging
7. Run all tests to verify filtering works
8. Manual verification via quickstart steps

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Configuration changes before code changes
- Manual verification after automated tests
- Mark [P] for parallel test creation

**Estimated Output**: 8-10 focused tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Not a library | Modifying existing component | Creating new library would duplicate existing AgentList |
| No CLI | Web UI feature | Not applicable for browser-based feature |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed
\
**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS with documented deviations
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*