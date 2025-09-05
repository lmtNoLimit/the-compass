# Tech Stack

This is the DEFINITIVE technology selection for the entire project. All development must use these exact versions.

## Technology Stack Table

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
