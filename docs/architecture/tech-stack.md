# Tech Stack

This is the DEFINITIVE technology selection for the entire project. All development must use these exact versions.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe frontend development | Type safety critical for maintainability and AI agent comprehension |
| Frontend Framework | Remix | 2.5+ | SSR React framework | Superior form handling and progressive enhancement for form-heavy workflows |
| UI Component Library | Radix UI + Tailwind | Radix 1.1+ | Accessible components + styling | Headless components ensure accessibility, Tailwind for rapid styling |
| State Management | Remix Built-in | N/A | Form and server state | Remix's loader/action pattern eliminates need for separate state management |
| Backend Language | TypeScript | 5.3+ | Type-safe backend development | Shared types between frontend/backend, better IDE support |
| Backend Framework | Express.js | 4.18+ | REST API server | Mature, simple, extensive middleware ecosystem |
| AI Framework | Google ADK | Latest | Agent development | Structured agent development with built-in tools and testing |
| API Style | REST | N/A | HTTP API protocol | Simple, well-understood, sufficient for CRUD operations |
| Database | PostgreSQL (Neon) | 16+ | Primary data store | Structured data with JSONB flexibility, serverless scaling |
| Cache | Redis (Render) | N/A | Session/cache storage | Redis instance on Render platform |
| File Storage | Render Disk | N/A | PDF exports storage | Persistent disk storage for generated reports |
| Authentication | Clerk | 4.0+ | User authentication | Production-ready auth with minimal implementation |
| Frontend Testing | Vitest + Testing Library | Vitest 1.0+ | Unit/integration tests | Fast, ESM-native testing aligned with Vite |
| Backend Testing | Vitest | 1.0+ | API testing | Consistent testing framework across stack |
| E2E Testing | Playwright | 1.40+ | End-to-end testing | Cross-browser testing with good debugging |
| Build Tool | Vite | 5.0+ | Frontend bundling | Fast builds, native ESM, Remix compatible |
| Bundler | esbuild (via Vite) | N/A | JS/TS compilation | Blazing fast compilation |
| IaC Tool | Terraform | 1.6+ | Infrastructure as code | Manage Render, Neon resources declaratively |
| CI/CD | GitHub Actions | N/A | Continuous deployment | Native GitHub integration, Render auto-deploy |
| Monitoring | Render Metrics | N/A | Performance monitoring | Built-in application metrics and monitoring |
| Logging | Render Logs | N/A | Centralized logging | Integrated logging with Render platform |
| CSS Framework | Tailwind CSS | 4.0+ | Utility-first CSS | Rapid prototyping, consistent design system, Lightning CSS performance |
