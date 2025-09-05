# The Compass Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for The Compass, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

N/A - Greenfield project

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-04 | 1.0 | Initial architecture document creation | Winston (Architect) |

## High Level Architecture

### Technical Summary

The Compass employs a modern fullstack architecture with React Router v7 following the default template structure, providing both client and server-side rendering capabilities. The frontend uses the standard `app/` directory structure with file-based routing in `app/routes/`, paired with an Express.js backend API that orchestrates AI persona agents built with Google's Agent Development Kit (ADK). The system deploys to Vercel with the frontend as a React Router app and the backend API as serverless functions, leveraging Vercel KV for session management. Neon provides a serverless PostgreSQL database with automatic scaling and branching capabilities, while the ADK agents powered by Gemini 1.5 Pro conduct structured persona interviews. This architecture prioritizes rapid development velocity and operational simplicity while maintaining clear module boundaries for future scaling.

### Platform and Infrastructure Choice

**Platform:** Vercel  
**Key Services:** Vercel Hosting, Vercel KV (Redis), Vercel Edge Functions, Neon (Serverless PostgreSQL), Google Vertex AI, Google Agent Development Kit (ADK)  
**Deployment Host and Regions:** Vercel Global Edge Network (Primary: US-East)

### Repository Structure

**Structure:** Monorepo  
**Monorepo Tool:** npm workspaces (built-in, no additional tooling overhead)  
**Package Organization:** Apps (web, api) + Shared packages (types, utils, config)

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser<br/>Desktop/Tablet]
    end
    
    subgraph "Vercel Edge Network"
        CDN[Vercel CDN<br/>Static Assets]
        Edge[Edge Functions<br/>Middleware]
    end
    
    subgraph "Application Layer"
        ReactApp[React Router SPA<br/>Client-Side Routing]
        API[Express API<br/>REST Endpoints]
    end
    
    subgraph "Data Layer"
        KV[Vercel KV<br/>Sessions/Cache]
        Neon[Neon PostgreSQL<br/>Primary Database]
    end
    
    subgraph "AI Services"
        Vertex[Google Vertex AI<br/>Gemini 1.5 Pro]
    end
    
    Browser --> CDN
    Browser --> Edge
    Edge --> ReactApp
    ReactApp --> API
    API --> KV
    API --> Neon
    API --> Vertex
    ReactApp --> API
```

### Architectural Patterns

- **Single-Page Application (SPA):** React Router for client-side routing with static hosting - _Rationale:_ Optimal performance for interactive PM tools, simplified deployment, better developer experience
- **Static Hosting with API Backend:** Decoupled frontend served from CDN with separate API - _Rationale:_ Independent scaling, faster iterations, and optimal caching strategies
- **Feature-Oriented Modules:** Organize code by feature rather than technical layer - _Rationale:_ Improved developer experience and easier feature iteration
- **Repository Pattern:** Abstract PostgreSQL operations behind clean interfaces - _Rationale:_ Testability and potential future database migration flexibility
- **Agent-Based Architecture:** ADK agents encapsulate persona behaviors and interview logic - _Rationale:_ Modular, maintainable AI personas with consistent behavior and easy testing
- **Tool-Augmented Agents:** ADK agents use tools for data access and external operations - _Rationale:_ Separation of concerns between agent logic and system integration
- **Circuit Breaker Pattern:** Graceful degradation for Vertex AI calls - _Rationale:_ System resilience when AI services are unavailable or rate-limited
- **Database Branching:** Leverage Neon's branching for safe migrations and testing - _Rationale:_ Risk-free database changes and instant rollback capability

## Tech Stack

This is the DEFINITIVE technology selection for the entire project. All development must use these exact versions.

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe frontend development | Type safety critical for maintainability and AI agent comprehension |
| Frontend Framework | React Router | 7.0+ | Client-side routing for React | Modern routing with data loading, actions, and error boundaries for SPAs |
| UI Component Library | Radix UI + Tailwind | Radix 1.1+ | Accessible components + styling | Headless components ensure accessibility, Tailwind for rapid styling |
| State Management | React Query + Zustand | 5.0+ / 4.5+ | Server and client state | React Query for server state caching, Zustand for global client state |
| Backend Language | TypeScript | 5.3+ | Type-safe backend development | Shared types between frontend/backend, better IDE support |
| Backend Framework | Express.js | 4.18+ | REST API server | Mature, simple, extensive middleware ecosystem |
| AI Framework | Google ADK | Latest | Agent development | Structured agent development with built-in tools and testing |
| API Style | REST | N/A | HTTP API protocol | Simple, well-understood, sufficient for CRUD operations |
| Database | PostgreSQL (Neon) | 16+ | Primary data store | Structured data with JSONB flexibility, serverless scaling |
| Cache | Vercel KV | N/A | Session/cache storage | Redis-compatible, integrated with Vercel |
| File Storage | Vercel Blob | N/A | PDF exports storage | Integrated blob storage for generated reports |
| Authentication | Clerk React Router | 5.0+ | User authentication | Clerk SDK optimized for React Router with route protection |
| Frontend Testing | Vitest + Testing Library | Vitest 1.0+ | Unit/integration tests | Fast, ESM-native testing aligned with Vite |
| Backend Testing | Vitest | 1.0+ | API testing | Consistent testing framework across stack |
| E2E Testing | Playwright | 1.40+ | End-to-end testing | Cross-browser testing with good debugging |
| Build Tool | Vite | 5.0+ | Frontend bundling | Fast builds, native ESM, React Router compatible |
| Bundler | esbuild (via Vite) | N/A | JS/TS compilation | Blazing fast compilation |
| IaC Tool | Terraform | 1.6+ | Infrastructure as code | Manage Vercel, Neon resources declaratively |
| CI/CD | GitHub Actions | N/A | Continuous deployment | Native GitHub integration, free tier sufficient |
| Monitoring | Vercel Analytics | N/A | Performance monitoring | Built-in Web Vitals and custom events |
| Logging | Axiom | Latest | Centralized logging | Vercel integration, generous free tier |
| CSS Framework | Tailwind CSS | 3.4+ | Utility-first CSS | Rapid prototyping, consistent design system |

## Data Models

### User
**Purpose:** Represents authenticated users (Product Managers) in the system

**Key Attributes:**
- id: UUID - Unique identifier from Clerk
- email: string - User's email address
- name: string - Display name
- organization: string - Company/org name
- role: enum('admin', 'user') - User role for permissions
- createdAt: timestamp - Account creation date
- lastLoginAt: timestamp - Last activity tracking

**TypeScript Interface:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  organization?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLoginAt: Date;
}
```

**Relationships:**
- Has many FeatureBriefs
- Has many ValidationBriefs

### FeatureBrief
**Purpose:** Captures the initial product idea input from PMs

**Key Attributes:**
- id: UUID - Unique identifier
- userId: UUID - Creator reference
- title: string - Brief title/name
- problemStatement: string - Problem being solved
- proposedSolution: text - Solution description
- targetUser: string - Target user segment
- hypothesis: text - Success hypothesis
- status: enum('draft', 'submitted', 'validated') - Current state
- createdAt: timestamp - Creation time
- submittedAt: timestamp - Submission time

**TypeScript Interface:**
```typescript
interface FeatureBrief {
  id: string;
  userId: string;
  title: string;
  problemStatement: string;
  proposedSolution: string;
  targetUser: string;
  hypothesis: string;
  status: 'draft' | 'submitted' | 'validated';
  createdAt: Date;
  submittedAt?: Date;
}
```

**Relationships:**
- Belongs to User
- Has one ValidationBrief

### ValidationBrief
**Purpose:** Stores AI-generated validation results from persona interviews

**Key Attributes:**
- id: UUID - Unique identifier  
- featureBriefId: UUID - Source brief reference
- personaId: string - Which persona was interviewed
- perceivedValue: number - Value score (1-10)
- perceivedValueRationale: text - Explanation of value score
- keyObjections: JSONB - Array of main concerns
- riskAssessment: JSONB - Identified risks and severity
- adoptionBarriers: JSONB - Barriers to adoption
- recommendedNextSteps: JSONB - Suggested actions
- interviewTranscript: JSONB - Full Q&A transcript
- generatedAt: timestamp - Generation time
- exportedAt: timestamp - Last export time

**TypeScript Interface:**
```typescript
interface ValidationBrief {
  id: string;
  featureBriefId: string;
  personaId: string;
  perceivedValue: number;
  perceivedValueRationale: string;
  keyObjections: string[];
  riskAssessment: {
    risk: string;
    severity: 'low' | 'medium' | 'high';
    mitigation?: string;
  }[];
  adoptionBarriers: string[];
  recommendedNextSteps: string[];
  interviewTranscript: {
    question: string;
    answer: string;
  }[];
  generatedAt: Date;
  exportedAt?: Date;
}
```

**Relationships:**
- Belongs to FeatureBrief
- References Persona

### Persona
**Purpose:** Defines AI personas available for interviews

**Key Attributes:**
- id: string - Unique identifier (e.g., 'enterprise-admin')
- name: string - Display name
- description: text - Persona background
- role: string - Job title/role
- goals: JSONB - Array of persona goals
- painPoints: JSONB - Array of pain points
- adkAgentConfig: JSONB - ADK agent configuration
- isActive: boolean - Whether persona is available
- createdAt: timestamp - Creation date

**TypeScript Interface:**
```typescript
interface Persona {
  id: string;
  name: string;
  description: string;
  role: string;
  goals: string[];
  painPoints: string[];
  adkAgentConfig: {
    model: string;
    temperature: number;
    tools: string[];
    systemPrompt: string;
  };
  isActive: boolean;
  createdAt: Date;
}
```

**Relationships:**
- Has many ValidationBriefs

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: The Compass API
  version: 1.0.0
  description: REST API for AI-powered product validation platform
servers:
  - url: https://api.compass.vercel.app/v1
    description: Production API
  - url: http://localhost:3001/api/v1
    description: Development API

paths:
  /auth/session:
    get:
      summary: Get current user session
      tags: [Authentication]
      security:
        - ClerkAuth: []
      responses:
        '200':
          description: Current user session
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '401':
          description: Unauthorized

  /feature-briefs:
    get:
      summary: List user's feature briefs
      tags: [Feature Briefs]
      security:
        - ClerkAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, submitted, validated]
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of feature briefs
    
    post:
      summary: Create new feature brief
      tags: [Feature Briefs]
      security:
        - ClerkAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FeatureBriefInput'
      responses:
        '201':
          description: Created feature brief

  /feature-briefs/{id}:
    get:
      summary: Get feature brief by ID
      tags: [Feature Briefs]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Feature brief details
        '404':
          description: Feature brief not found

    put:
      summary: Update feature brief
      tags: [Feature Briefs]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FeatureBriefInput'
      responses:
        '200':
          description: Updated feature brief

  /feature-briefs/{id}/validate:
    post:
      summary: Submit feature brief for validation
      tags: [Validation]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                personaId:
                  type: string
                  description: ID of persona to interview
      responses:
        '202':
          description: Validation started

  /validations/{id}:
    get:
      summary: Get validation brief
      tags: [Validation]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Validation brief

  /validations/{id}/export:
    post:
      summary: Export validation brief
      tags: [Validation]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                format:
                  type: string
                  enum: [pdf, markdown]
      responses:
        '200':
          description: Export URL

  /personas:
    get:
      summary: List available personas
      tags: [Personas]
      responses:
        '200':
          description: List of personas

  /search:
    get:
      summary: Search validation history
      tags: [Search]
      security:
        - ClerkAuth: []
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
            description: Search query
        - name: type
          in: query
          schema:
            type: string
            enum: [feature_brief, validation]
      responses:
        '200':
          description: Search results

components:
  securitySchemes:
    ClerkAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      $ref: '#/components/schemas/User'
    FeatureBrief:
      $ref: '#/components/schemas/FeatureBrief'
    FeatureBriefInput:
      $ref: '#/components/schemas/FeatureBriefInput'
    ValidationBrief:
      $ref: '#/components/schemas/ValidationBrief'
    Persona:
      $ref: '#/components/schemas/Persona'
```

## Components

### Web Frontend (React Router App)
**Responsibility:** React Router v7 application with file-based routing providing the user interface for product managers to create feature briefs, trigger validations, and review results

**Key Interfaces:**
- HTTP requests to Express API via fetch/axios
- Clerk React Router SDK for authentication
- React Query for server state management
- WebSocket connection for real-time validation progress

**Dependencies:** Express API, Clerk Auth (React Router version)

**Technology Stack:** React Router 7.0+, React 18+, TypeScript, Radix UI, Tailwind CSS, React Query, Zustand

### API Service (Express Backend)
**Responsibility:** RESTful API service orchestrating business logic, database operations, and AI agent interactions

**Key Interfaces:**
- REST endpoints as defined in OpenAPI spec
- PostgreSQL queries via Prisma ORM
- ADK agent invocation for persona interviews
- Vercel KV for session caching

**Dependencies:** Neon PostgreSQL, Google ADK, Vercel KV, Clerk Auth

**Technology Stack:** Express 4.18+, TypeScript, Prisma ORM, Google ADK SDK

### ADK Agent Service
**Responsibility:** Manages AI persona agents that conduct structured interviews with feature briefs

**Key Interfaces:**
- Agent initialization with persona configs
- Tool registration for database access
- Structured interview execution
- Response formatting and scoring

**Dependencies:** Google Vertex AI, PostgreSQL (via tools)

**Technology Stack:** Google ADK, Gemini 2.5 Pro, TypeScript

### Database Layer (Neon PostgreSQL)
**Responsibility:** Persistent storage for all application data with JSONB support for flexible AI responses

**Key Interfaces:**
- Prisma schema and migrations
- Connection pooling via Neon
- Read replicas for search queries
- Database branching for testing

**Dependencies:** None (leaf component)

**Technology Stack:** PostgreSQL 16+, Prisma ORM, Neon branching

### Authentication Service (Clerk)
**Responsibility:** Complete authentication and user management solution

**Key Interfaces:**
- JWT token generation and validation
- User profile management
- Session management
- OAuth providers

**Dependencies:** None (external service)

**Technology Stack:** Clerk SDK, JWT tokens, OAuth 2.0

### Session Cache (Vercel KV)
**Responsibility:** Redis-compatible caching for user sessions and temporary data

**Key Interfaces:**
- Key-value operations
- TTL management
- Session storage
- Rate limiting counters

**Dependencies:** None (managed service)

**Technology Stack:** Vercel KV (Redis protocol)

### File Storage (Vercel Blob)
**Responsibility:** Store generated PDF and markdown exports

**Key Interfaces:**
- Blob upload API
- Signed URL generation
- Automatic expiry
- CDN distribution

**Dependencies:** None (managed service)

**Technology Stack:** Vercel Blob Storage

### Component Interaction Diagram

```mermaid
graph LR
    subgraph "Frontend"
        ReactApp[React Router App]
    end
    
    subgraph "Backend Services"
        API[Express API]
        ADK[ADK Agents]
    end
    
    subgraph "Data Services"
        DB[(Neon PostgreSQL)]
        KV[(Vercel KV)]
        Blob[(Vercel Blob)]
    end
    
    subgraph "External Services"
        Clerk[Clerk Auth]
        Vertex[Vertex AI]
    end
    
    ReactApp -->|REST API| API
    ReactApp -->|Auth| Clerk
    API -->|Query/Mutation| DB
    API -->|Cache| KV
    API -->|Invoke| ADK
    API -->|Upload| Blob
    API -->|Verify Token| Clerk
    ADK -->|LLM Calls| Vertex
    ADK -->|Tool Calls| DB
```

## External APIs

### Google Vertex AI API
- **Purpose:** Provides Gemini 1.5 Pro model for ADK agents to conduct persona interviews
- **Documentation:** https://cloud.google.com/vertex-ai/docs/reference/rest
- **Base URL(s):** https://{region}-aiplatform.googleapis.com
- **Authentication:** Service Account with JSON key or Application Default Credentials
- **Rate Limits:** 60 requests per minute (default), can be increased via quota request

**Key Endpoints Used:**
- `POST /v1/projects/{project}/locations/{location}/publishers/google/models/gemini-1.5-pro:generateContent` - Generate AI responses for interviews
- `POST /v1/projects/{project}/locations/{location}/publishers/google/models/gemini-1.5-pro:streamGenerateContent` - Stream responses for real-time progress

**Integration Notes:** ADK SDK handles most complexity, but need circuit breaker for rate limits and fallback behavior when service is unavailable

### Clerk Authentication API
- **Purpose:** Complete user authentication and session management
- **Documentation:** https://clerk.com/docs/reference/backend-api
- **Base URL(s):** https://api.clerk.com/v1
- **Authentication:** Secret key in Authorization header
- **Rate Limits:** 10,000 requests per minute for production instances

**Key Endpoints Used:**
- `GET /users/{userId}` - Fetch user profile data
- `POST /sessions/{sessionId}/verify` - Verify JWT tokens
- `GET /organizations/{orgId}/members` - List organization members (future feature)

**Integration Notes:** Frontend SDK handles most auth flows, backend only needs token verification. Webhook endpoints needed for user lifecycle events.

### Neon Database API
- **Purpose:** Database branching and management operations
- **Documentation:** https://neon.tech/docs/reference/api-reference
- **Base URL(s):** https://console.neon.tech/api/v2
- **Authentication:** API key in Authorization header
- **Rate Limits:** 100 requests per second

**Key Endpoints Used:**
- `POST /projects/{projectId}/branches` - Create database branch for testing
- `DELETE /projects/{projectId}/branches/{branchId}` - Clean up test branches
- `GET /projects/{projectId}/operations` - Monitor migration status

**Integration Notes:** Only used for DevOps operations, not runtime queries. Prisma handles all runtime database connections.

### Vercel API
- **Purpose:** Deployment management and blob storage operations
- **Documentation:** https://vercel.com/docs/rest-api
- **Base URL(s):** https://api.vercel.com
- **Authentication:** Bearer token
- **Rate Limits:** Based on plan tier

**Key Endpoints Used:**
- `POST /v1/blob/upload` - Upload exported PDFs
- `GET /v1/deployments` - Monitor deployment status
- `POST /v1/cron` - Manage scheduled tasks (future feature)

**Integration Notes:** SDK handles most operations transparently. Need to implement cleanup for old exports to manage storage costs.

## Core Workflows

### User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant R as React Router App
    participant C as Clerk
    participant A as Express API
    participant D as Database

    U->>B: Navigate to app
    B->>R: Load SPA
    R->>C: Check session (Clerk React Router)
    alt No session
        C-->>R: No session
        R-->>B: Redirect to /sign-in
        B->>C: Show Clerk UI
        U->>C: Enter credentials
        C->>C: Validate
        C-->>B: Set session token
        B->>R: Redirect to app
    end
    R->>C: Get auth token
    C-->>R: Auth token
    R->>A: API request with Bearer token
    A->>C: Verify token
    C-->>A: Token valid
    A->>D: Get user data
    D-->>A: User record
    A-->>R: API response
    R-->>B: Update UI
```

### Feature Brief Validation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React Router App
    participant A as Express API
    participant K as Vercel KV
    participant D as Database
    participant ADK as ADK Agent
    participant V as Vertex AI

    U->>R: Submit feature brief
    R->>A: POST /feature-briefs/{id}/validate
    A->>D: Get feature brief
    D-->>A: Brief data
    A->>D: Get persona config
    D-->>A: Persona data
    A->>K: Create job status
    A-->>R: 202 Accepted + jobId
    R-->>U: Show progress UI
    
    Note over A,V: Async processing begins
    
    A->>ADK: Initialize agent
    ADK->>ADK: Load persona config
    
    loop Interview Questions
        ADK->>V: Generate question
        V-->>ADK: Question text
        ADK->>V: Generate answer
        V-->>ADK: Answer text
        ADK->>D: Store transcript
    end
    
    ADK->>ADK: Calculate scores
    ADK->>D: Save validation brief
    D-->>ADK: Saved
    ADK-->>A: Complete
    A->>K: Update job status
    
    R->>A: Poll status
    A->>K: Get job status
    K-->>A: Complete
    A->>D: Get validation brief
    D-->>A: Validation data
    A-->>R: Validation brief
    R-->>U: Display results
```

### Export Validation Brief Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React Router App
    participant A as Express API
    participant D as Database
    participant P as PDF Service
    participant B as Vercel Blob

    U->>R: Click export PDF
    R->>A: POST /validations/{id}/export
    A->>D: Get validation brief
    D-->>A: Brief data
    A->>P: Generate PDF
    P->>P: Render PDF
    P-->>A: PDF buffer
    A->>B: Upload PDF
    B-->>A: Blob URL
    A->>D: Update exportedAt
    A-->>R: Download URL
    R-->>U: Start download
    U->>B: Download file
    B-->>U: PDF file
```

### Search History Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React Router App
    participant A as Express API
    participant D as Database
    participant K as Vercel KV

    U->>R: Enter search query
    R->>A: GET /search?q=query
    A->>K: Check cache
    alt Cache hit
        K-->>A: Cached results
    else Cache miss
        A->>D: Full-text search
        D-->>A: Search results
        A->>K: Cache results
    end
    A-->>R: Search results
    R-->>U: Display results
    
    U->>R: Click result
    R->>A: GET /validations/{id}
    A->>D: Get full record
    D-->>A: Validation data
    A-->>R: Full details
    R-->>U: Display validation
```

### Error Handling Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React Router App
    participant A as Express API
    participant ADK as ADK Agent
    participant V as Vertex AI
    participant D as Database

    U->>R: Submit validation
    R->>A: POST /validate
    A->>ADK: Start interview
    ADK->>V: Generate content
    V--xADK: Rate limit error
    
    ADK->>ADK: Activate circuit breaker
    ADK-->>A: Service unavailable
    A->>D: Log error
    A-->>R: 503 + retry-after
    R-->>U: Show error message
    
    Note over R: Automatic retry
    R->>A: Retry after delay
    A->>ADK: Check circuit breaker
    alt Circuit open
        ADK-->>A: Still unavailable
        A-->>R: 503
        R-->>U: Suggest try later
    else Circuit closed
        ADK->>V: Retry request
        V-->>ADK: Success
        ADK-->>A: Continue
        A-->>R: 202 Accepted
        R-->>U: Show progress
    end
```

## Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Clerk via webhook)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- Feature Briefs table
CREATE TABLE feature_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT NOT NULL,
    proposed_solution TEXT NOT NULL,
    target_user VARCHAR(255) NOT NULL,
    hypothesis TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'validated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT title_length CHECK (char_length(title) >= 3)
);

CREATE INDEX idx_feature_briefs_user_id ON feature_briefs(user_id);
CREATE INDEX idx_feature_briefs_status ON feature_briefs(status);
CREATE INDEX idx_feature_briefs_created_at ON feature_briefs(created_at DESC);

-- Personas table
CREATE TABLE personas (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    role VARCHAR(255) NOT NULL,
    goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    adk_agent_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_personas_active ON personas(is_active);

-- Validation Briefs table
CREATE TABLE validation_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_brief_id UUID NOT NULL REFERENCES feature_briefs(id) ON DELETE CASCADE,
    persona_id VARCHAR(100) NOT NULL REFERENCES personas(id),
    perceived_value INTEGER NOT NULL CHECK (perceived_value >= 1 AND perceived_value <= 10),
    perceived_value_rationale TEXT NOT NULL,
    key_objections JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_assessment JSONB NOT NULL DEFAULT '[]'::jsonb,
    adoption_barriers JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    interview_transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    exported_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    CONSTRAINT one_validation_per_brief UNIQUE(feature_brief_id)
);

CREATE INDEX idx_validation_briefs_feature_brief_id ON validation_briefs(feature_brief_id);
CREATE INDEX idx_validation_briefs_persona_id ON validation_briefs(persona_id);
CREATE INDEX idx_validation_briefs_generated_at ON validation_briefs(generated_at DESC);

-- Full-text search indexes
CREATE INDEX idx_feature_briefs_search ON feature_briefs 
    USING gin(to_tsvector('english', title || ' ' || problem_statement || ' ' || proposed_solution));

-- Jobs table for async processing
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE feature_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_briefs ENABLE ROW LEVEL SECURITY;

-- Sample personas data
INSERT INTO personas (id, name, description, role, goals, pain_points, adk_agent_config, is_active) VALUES
('enterprise-admin', 'Enterprise IT Administrator', 'Manages IT infrastructure for a 500+ person company', 'IT Admin', 
 '["Maintain system stability", "Minimize security risks", "Control costs"]'::jsonb,
 '["Complex integrations", "Limited budget", "Security compliance"]'::jsonb,
 '{"model": "gemini-2.5-pro", "temperature": 0.7, "tools": ["database_query", "format_response"]}'::jsonb,
 true),
('end-user', 'End User Employee', 'Regular employee using company tools daily', 'Employee',
 '["Get work done efficiently", "Easy to use tools", "Mobile access"]'::jsonb,
 '["Complicated interfaces", "Too many tools", "Slow performance"]'::jsonb,
 '{"model": "gemini-2.5-pro", "temperature": 0.8, "tools": ["database_query", "format_response"]}'::jsonb,
 true);
```

## Frontend Architecture

### Component Architecture

#### Component Organization
```
app/
├── routes/                    # File-based routing (React Router v7)
│   ├── _index.tsx            # Home/Dashboard route
│   ├── briefs._index.tsx     # List briefs
│   ├── briefs.new.tsx        # Create new brief
│   ├── briefs.$id.tsx        # View brief detail
│   ├── briefs.$id.edit.tsx   # Edit brief
│   ├── validations.$id.tsx   # View validation
│   ├── history.tsx           # Search history
│   ├── sign-in.tsx           # Sign in page
│   └── sign-up.tsx           # Sign up page
├── components/
│   ├── ui/                    # Radix UI primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── form.tsx
│   ├── features/              # Feature-specific components
│   │   ├── brief-form/
│   │   ├── validation-viewer/
│   │   └── persona-selector/
│   └── layouts/               # Layout components
│       ├── app-shell.tsx
│       └── auth-layout.tsx
├── hooks/                     # Custom React hooks
│   ├── use-validation.ts
│   └── use-export.ts
└── lib/                       # Utilities and services
    ├── api-client.ts
    └── utils.ts
```

#### Component Template
```typescript
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { TextField } from "~/components/ui/text-field";
import { createBrief, updateBrief } from "~/services/briefs";
import type { FeatureBrief } from "~/types";

interface BriefFormProps {
  brief?: Partial<FeatureBrief>;
  mode: 'create' | 'edit';
}

export function BriefForm({ brief, mode }: BriefFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: mode === 'create' ? createBrief : updateBrief,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      navigate(`/briefs/${data.id}`);
    },
  });
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate(Object.fromEntries(formData));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <TextField
        name="title"
        label="Feature Title"
        defaultValue={brief?.title}
        required
        disabled={mutation.isPending}
      />
      <Button 
        type="submit" 
        disabled={mutation.isPending}
      >
        {mode === 'create' ? 'Create Brief' : 'Update Brief'}
      </Button>
    </form>
  );
}
```

### State Management Architecture

#### State Structure
```typescript
// Server state via React Query
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJobStatus } from '~/services/jobs';

export function useJobStatus(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobStatus(jobId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'processing' ? 2000 : false;
    },
  });
}

// Global client state via Zustand
import { create } from 'zustand';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

#### State Management Patterns
- React Query for server state (caching, synchronization, background updates)
- Zustand for global client state (user preferences, UI state)
- React Router loaders for initial data fetching
- React Router actions for form submissions
- useState/useReducer for local component state
- React Hook Form for complex form management

### Routing Architecture

#### Route Configuration
```typescript
// app/routes.ts
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("root.tsx", [
    index("routes/_index.tsx"),
    route("briefs", "routes/briefs._index.tsx"),
    route("briefs/new", "routes/briefs.new.tsx"),
    route("briefs/:id", "routes/briefs.$id.tsx"),
    route("briefs/:id/edit", "routes/briefs.$id.edit.tsx"),
    route("validations/:id", "routes/validations.$id.tsx"),
    route("history", "routes/history.tsx"),
    route("sign-in", "routes/sign-in.tsx"),
    route("sign-up", "routes/sign-up.tsx"),
  ]),
] satisfies RouteConfig;
```

#### Protected Route Pattern
```typescript
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@clerk/react-router";

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }
  
  return <Outlet />;
}

// Alternative using Clerk components
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/react-router";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
```

### Frontend Services Layer

#### API Client Setup
```typescript
import { useAuth } from '@clerk/react-router';
import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(async (config) => {
  // Get token from Clerk
  const token = await window.Clerk?.session?.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to sign in
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Service Example
```typescript
import apiClient from '~/lib/api-client';
import type { FeatureBrief, FeatureBriefInput } from '~/types';

// Briefs service with React Query integration
export const briefsService = {
  async create(data: FeatureBriefInput): Promise<FeatureBrief> {
    const response = await apiClient.post('/feature-briefs', data);
    return response.data;
  },
  
  async getById(id: string): Promise<FeatureBrief> {
    const response = await apiClient.get(`/feature-briefs/${id}`);
    return response.data;
  },
  
  async update(id: string, data: Partial<FeatureBriefInput>): Promise<FeatureBrief> {
    const response = await apiClient.put(`/feature-briefs/${id}`, data);
    return response.data;
  },
  
  async validate(briefId: string, personaId: string): Promise<{ validationId: string }> {
    const response = await apiClient.post(`/feature-briefs/${briefId}/validate`, { personaId });
    return response.data;
  },
};

// React Query hooks
export function useBrief(id: string) {
  return useQuery({
    queryKey: ['briefs', id],
    queryFn: () => briefsService.getById(id),
  });
}

export function useCreateBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: briefsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
    },
  });
}
```

## Backend Architecture

### Service Architecture

#### Traditional Server Architecture

##### Controller/Route Organization
```
api/
├── src/
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── briefs.routes.ts
│   │   ├── validations.routes.ts
│   │   └── personas.routes.ts
│   ├── controllers/
│   │   ├── briefs.controller.ts
│   │   └── validations.controller.ts
│   ├── services/
│   │   ├── briefs.service.ts
│   │   ├── validation.service.ts
│   │   └── adk-agent.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── error.middleware.ts
│   ├── repositories/
│   │   ├── brief.repository.ts
│   │   └── validation.repository.ts
│   └── app.ts
```

##### Controller Template
```typescript
import { Request, Response } from 'express';
import { BriefsService } from '../services/briefs.service';
import { validateRequest } from '../middleware/validation';

export class BriefsController {
  constructor(private briefsService: BriefsService) {}

  async create(req: Request, res: Response) {
    try {
      const userId = req.auth.userId;
      const brief = await this.briefsService.create({
        ...req.body,
        userId,
      });
      
      res.status(201).json(brief);
    } catch (error) {
      res.status(400).json({ 
        error: error.message 
      });
    }
  }

  async validate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { personaId } = req.body;
      
      const job = await this.briefsService.startValidation(
        id, 
        personaId
      );
      
      res.status(202).json({
        validationId: job.id,
        status: 'processing',
        estimatedTime: 300
      });
    } catch (error) {
      res.status(400).json({ 
        error: error.message 
      });
    }
  }
}
```

### Database Architecture

#### Schema Design
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  clerkId      String   @unique
  email        String   @unique
  name         String
  organization String?
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  lastLoginAt  DateTime?
  
  featureBriefs FeatureBrief[]
}

model FeatureBrief {
  id                String    @id @default(uuid())
  userId            String
  title             String
  problemStatement  String
  proposedSolution  String
  targetUser        String
  hypothesis        String
  status           BriefStatus @default(DRAFT)
  createdAt        DateTime  @default(now())
  submittedAt      DateTime?
  updatedAt        DateTime  @updatedAt
  
  user             User      @relation(fields: [userId], references: [id])
  validationBrief  ValidationBrief?
}

model ValidationBrief {
  id                      String   @id @default(uuid())
  featureBriefId         String   @unique
  personaId              String
  perceivedValue         Int
  perceivedValueRationale String
  keyObjections          Json
  riskAssessment         Json
  adoptionBarriers       Json
  recommendedNextSteps   Json
  interviewTranscript    Json
  generatedAt            DateTime @default(now())
  exportedAt             DateTime?
  
  featureBrief           FeatureBrief @relation(fields: [featureBriefId], references: [id])
  persona                Persona      @relation(fields: [personaId], references: [id])
}

model Persona {
  id              String   @id
  name            String
  description     String
  role            String
  goals           Json
  painPoints      Json
  adkAgentConfig  Json
  isActive        Boolean  @default(true)
  
  validationBriefs ValidationBrief[]
}

enum Role {
  USER
  ADMIN
}

enum BriefStatus {
  DRAFT
  SUBMITTED
  VALIDATED
}
```

#### Data Access Layer
```typescript
import { PrismaClient } from '@prisma/client';

export class BriefRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateBriefDto) {
    return this.prisma.featureBrief.create({
      data,
      include: {
        user: true,
        validationBrief: true
      }
    });
  }

  async findByUserId(userId: string, status?: BriefStatus) {
    return this.prisma.featureBrief.findMany({
      where: {
        userId,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' },
      include: {
        validationBrief: {
          select: {
            id: true,
            perceivedValue: true,
            generatedAt: true
          }
        }
      }
    });
  }

  async search(query: string, userId: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM feature_briefs
      WHERE user_id = ${userId}
      AND to_tsvector('english', title || ' ' || problem_statement) 
      @@ plainto_tsquery('english', ${query})
      ORDER BY created_at DESC
      LIMIT 20
    `;
  }
}
```

### Authentication and Authorization

#### Auth Flow
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Clerk
    participant Database

    Client->>API: Request with JWT
    API->>Clerk: Verify JWT
    Clerk-->>API: Valid + User ID
    API->>Database: Get user by Clerk ID
    Database-->>API: User record
    API->>API: Process request
    API-->>Client: Response
```

#### Middleware/Guards
```typescript
import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function authMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }
    
    const session = await clerkClient.sessions.verifySession(
      '', 
      token
    );
    
    if (!session) {
      return res.status(401).json({ 
        error: 'Invalid token' 
      });
    }
    
    req.auth = {
      userId: session.userId,
      sessionId: session.id
    };
    
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Authentication failed' 
    });
  }
}

// Rate limiting middleware
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later'
});

export const validationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 validations per hour
  keyGenerator: (req) => req.auth?.userId || req.ip,
  message: 'Validation limit reached. Please try again later.'
});
```

## Unified Project Structure

```
persona-compass/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── app/                        # React Router app directory
│   ├── routes/                 # File-based routing
│   │   ├── _index.tsx         # Home route
│   │   ├── briefs/            # Brief routes
│   │   └── validations/       # Validation routes
│   ├── components/             # Shared UI components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API service layer
│   ├── stores/                 # Zustand stores
│   ├── lib/                    # Utilities and helpers
│   ├── types/                  # TypeScript interfaces
│   │   ├── user.ts
│   │   ├── brief.ts
│   │   └── validation.ts
│   ├── app.css                 # Global styles
│   ├── root.tsx                # Root layout component
│   └── routes.ts               # Route configuration
├── public/                     # Static assets
├── tests/                      # Test files
├── api/                        # Express backend (separate deployment)
│   ├── src/
│   │   ├── routes/             # API routes
│   │   ├── controllers/        # Route controllers
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Data access layer
│   │   ├── middleware/         # Express middleware
│   │   ├── agents/             # ADK agent definitions
│   │   ├── types/              # API type definitions
│   │   ├── utils/              # Backend utilities
│   │   └── app.ts              # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Migration files
│   ├── tests/                  # Backend tests
│   ├── .env.example
│   └── package.json
├── .dockerignore
├── .gitignore
├── Dockerfile                  # Docker deployment config
├── .env.example
├── package.json
├── react-router.config.ts      # React Router configuration
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
├── infrastructure/             # IaC definitions
│   ├── terraform/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── modules/
│   │   │   ├── vercel/
│   │   │   ├── neon/
│   │   │   └── clerk/
│   │   └── main.tf
│   └── scripts/                # Deployment scripts
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── prd.md
│   └── front-end-spec.md
├── .env.example                # Environment template
├── package.json                # Root package.json
├── package-lock.json
├── tsconfig.json               # Root TypeScript config
└── README.md                   # Project documentation
```

## Development Workflow

### Local Development Setup

#### Prerequisites
```bash
# Required tools
node --version  # v20.x or later
npm --version   # v10.x or later
git --version   # v2.x or later

# Optional but recommended
docker --version  # For local PostgreSQL
```

#### Initial Setup
```bash
# Clone repository
git clone https://github.com/your-org/persona-compass.git
cd persona-compass

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Configure environment variables
# - Add Clerk keys
# - Add Neon database URL
# - Add Vertex AI credentials

# Run database migrations
cd apps/api
npx prisma migrate dev
npx prisma db seed

# Return to root
cd ../..
```

#### Development Commands
```bash
# Start all services (from root)
npm run dev

# Start frontend only
npm run dev:web

# Start backend only
npm run dev:api

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

### Environment Configuration

#### Required Environment Variables
```bash
# Frontend (apps/web/.env.local)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_SIGN_IN_PATH=/sign-in
VITE_CLERK_SIGN_UP_PATH=/sign-up
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
VITE_API_URL=http://localhost:3001/api/v1

# Backend (apps/api/.env)
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
DIRECT_URL=postgres://user:pass@host/db?sslmode=require
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
VERTEX_AI_PROJECT=your-project
VERTEX_AI_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
VERCEL_KV_URL=redis://...
VERCEL_BLOB_READ_WRITE_TOKEN=...

# Shared
NODE_ENV=development
LOG_LEVEL=debug
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel (Static Site)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Framework Preset:** Vite
- **CDN/Edge:** Vercel Global Edge Network

**Backend Deployment:**
- **Platform:** Vercel Serverless Functions
- **Build Command:** `npm run build:api`
- **Deployment Method:** API routes as serverless functions

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|-------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3001 | Local development |
| Staging | https://staging.compass.vercel.app | https://staging.compass.vercel.app/api | Pre-production testing |
| Production | https://compass.vercel.app | https://compass.vercel.app/api | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline' clerk.com; style-src 'self' 'unsafe-inline'`
- XSS Prevention: React's built-in escaping, input sanitization
- Secure Storage: HttpOnly cookies for auth tokens

**Backend Security:**
- Input Validation: Zod schemas for all endpoints
- Rate Limiting: 100 req/min general, 10 validations/hour
- CORS Policy: Restrictive origin whitelist

**Authentication Security:**
- Token Storage: HttpOnly cookies with SameSite
- Session Management: Clerk-managed with 24h expiry
- Password Policy: Clerk enforced minimum requirements

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 200KB initial JS
- Loading Strategy: Route-based code splitting
- Caching Strategy: SWR for data fetching, CDN for assets

**Backend Performance:**
- Response Time Target: < 500ms p95
- Database Optimization: Connection pooling, indexed queries
- Caching Strategy: Redis for sessions, 5min cache for search

## Testing Strategy

### Testing Pyramid
```
        E2E Tests (Playwright)
       /                      \
    Integration Tests (Vitest)
   /                          \
Unit Tests (Vitest)    Unit Tests (Vitest)
   (Frontend)             (Backend)
```

### Test Organization

#### Frontend Tests
```
apps/web/tests/
├── unit/
│   ├── components/
│   └── hooks/
├── integration/
│   └── routes/
└── e2e/
    ├── auth.spec.ts
    ├── brief-creation.spec.ts
    └── validation.spec.ts
```

#### Backend Tests
```
apps/api/tests/
├── unit/
│   ├── services/
│   └── repositories/
├── integration/
│   ├── routes/
│   └── agents/
└── fixtures/
    └── test-data.ts
```

### Test Examples

#### Frontend Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/react-router';
import { BriefForm } from '~/components/features/brief-form';

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ClerkProvider publishableKey="test">
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </ClerkProvider>
);

describe('BriefForm', () => {
  it('renders all required fields', () => {
    render(<BriefForm mode="create" />, { wrapper });
    
    expect(screen.getByLabelText('Feature Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Problem Statement')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Brief' })).toBeInTheDocument();
  });
});
```

#### Backend API Test
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/v1/feature-briefs', () => {
  it('creates a new feature brief', async () => {
    const response = await request(app)
      .post('/api/v1/feature-briefs')
      .set('Authorization', 'Bearer test-token')
      .send({
        title: 'Test Feature',
        problemStatement: 'Test problem',
        proposedSolution: 'Test solution',
        targetUser: 'Test users',
        hypothesis: 'Test hypothesis'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

#### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('complete validation flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=New Brief');
  
  await page.fill('[name=title]', 'E2E Test Feature');
  await page.fill('[name=problemStatement]', 'E2E test problem');
  await page.fill('[name=proposedSolution]', 'E2E test solution');
  
  await page.click('text=Create Brief');
  await page.waitForURL('/briefs/*');
  
  await page.click('text=Validate');
  await page.click('text=Enterprise Admin');
  await page.click('text=Start Validation');
  
  await page.waitForSelector('text=Validation Complete', { timeout: 60000 });
  expect(page.locator('text=Perceived Value')).toBeVisible();
});
```

## Coding Standards

### Critical Fullstack Rules
- **Type Definitions:** Define types in app/types folder for frontend, api/src/types for backend
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **Database Access:** Always use Prisma, never raw SQL except for specific search queries
- **Async Operations:** All async functions must have proper error handling
- **Security:** Never log or expose sensitive data, always validate input

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/feature-briefs` |
| Database Tables | - | snake_case | `feature_briefs` |
| Environment Vars | SCREAMING_SNAKE | SCREAMING_SNAKE | `DATABASE_URL` |
| TypeScript Types | PascalCase | PascalCase | `FeatureBrief` |
| Functions | camelCase | camelCase | `validateBrief()` |

## Error Handling Strategy

### Error Flow
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant Database

    Client->>API: Request
    API->>Service: Process
    Service->>Database: Query
    Database--xService: Error
    Service->>Service: Log error
    Service-->>API: Throw typed error
    API->>API: Error middleware
    API-->>Client: Formatted error response
```

### Error Response Format
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling
```typescript
export function ErrorBoundary({ error }: { error: Error }) {
  if (error instanceof ApiError) {
    return (
      <div className="error-container">
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }
  
  throw error; // Re-throw to parent boundary
}
```

### Backend Error Handling
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  }
  
  // Generic error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
}
```

## Monitoring and Observability

### Monitoring Stack
- **Frontend Monitoring:** Vercel Analytics + Web Vitals
- **Backend Monitoring:** Axiom for logs, custom metrics
- **Error Tracking:** Sentry for both frontend and backend
- **Performance Monitoring:** Vercel Speed Insights

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors per session
- API response times
- User interaction events

**Backend Metrics:**
- Request rate and latency (p50, p95, p99)
- Error rate by endpoint
- Database query performance
- AI validation duration and success rate
- Token usage and costs

**Business Metrics:**
- Daily active users
- Validations per user
- Time to complete validation
- Export usage

## Checklist Results Report

*This section will be populated after running the architect-checklist to validate the architecture document completeness.*
