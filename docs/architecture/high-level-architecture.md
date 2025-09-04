# High Level Architecture

## Technical Summary

The Compass employs a modern fullstack architecture with a Remix-based frontend for server-side rendering and optimal performance, paired with an Express.js backend API that orchestrates AI persona agents built with Google's Agent Development Kit (ADK). The system follows a modular monolith approach deployed as a single application to Vercel, leveraging edge functions for API routes and Vercel KV for session management. Neon provides a serverless PostgreSQL database with automatic scaling and branching capabilities, while the ADK agents powered by Gemini 1.5 Pro conduct structured persona interviews. This architecture prioritizes rapid development velocity and operational simplicity while maintaining clear module boundaries for future scaling.

## Platform and Infrastructure Choice

**Platform:** Vercel  
**Key Services:** Vercel Hosting, Vercel KV (Redis), Vercel Edge Functions, Neon (Serverless PostgreSQL), Google Vertex AI, Google Agent Development Kit (ADK)  
**Deployment Host and Regions:** Vercel Global Edge Network (Primary: US-East)

## Repository Structure

**Structure:** Monorepo  
**Monorepo Tool:** npm workspaces (built-in, no additional tooling overhead)  
**Package Organization:** Apps (web, api) + Shared packages (types, utils, config)

## High Level Architecture Diagram

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
        Remix[Remix App<br/>SSR + React]
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
    Edge --> Remix
    Remix --> API
    API --> KV
    API --> Neon
    API --> Vertex
    Remix --> KV
```

## Architectural Patterns

- **Jamstack Architecture:** Static assets + serverless API endpoints - _Rationale:_ Optimal performance with CDN distribution and reduced operational overhead
- **Server-Side Rendering (SSR):** Remix handles initial render server-side - _Rationale:_ Better SEO, faster perceived performance, and simplified state management
- **Feature-Oriented Modules:** Organize code by feature rather than technical layer - _Rationale:_ Improved developer experience and easier feature iteration
- **Repository Pattern:** Abstract PostgreSQL operations behind clean interfaces - _Rationale:_ Testability and potential future database migration flexibility
- **Agent-Based Architecture:** ADK agents encapsulate persona behaviors and interview logic - _Rationale:_ Modular, maintainable AI personas with consistent behavior and easy testing
- **Tool-Augmented Agents:** ADK agents use tools for data access and external operations - _Rationale:_ Separation of concerns between agent logic and system integration
- **Circuit Breaker Pattern:** Graceful degradation for Vertex AI calls - _Rationale:_ System resilience when AI services are unavailable or rate-limited
- **Database Branching:** Leverage Neon's branching for safe migrations and testing - _Rationale:_ Risk-free database changes and instant rollback capability
