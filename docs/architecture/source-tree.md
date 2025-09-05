# Source Tree

## Current Project Structure

This document describes the actual source tree structure of the Persona Compass application as implemented with React Router v7, TypeScript, and Vercel deployment.

```
persona-compass/
├── app/                          # React Router application (unified full-stack)
│   ├── components/               # React components
│   │   ├── features/            # Feature-specific components
│   │   ├── layouts/             # Layout components
│   │   └── ui/                  # Reusable UI components
│   │       ├── Button.tsx       # Button component
│   │       └── Dialog.tsx       # Dialog component
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and server-side code
│   │   ├── prisma.server.ts     # Prisma client singleton
│   │   └── utils.ts             # Utility functions
│   ├── routes/                  # File-based routing (React Router v7)
│   │   ├── _index.tsx           # Home page route
│   │   ├── api.health.tsx       # Health check API endpoint
│   │   ├── briefs._index.tsx    # Briefs listing page
│   │   ├── briefs.new.tsx       # New brief creation page
│   │   └── validations._index.tsx # Validations page
│   ├── services/                # API service layer
│   │   └── api.ts               # API client service
│   ├── stores/                  # State management (Zustand)
│   │   └── userStore.ts         # User state store
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts             # Shared type definitions
│   ├── app.css                  # Global application styles
│   ├── root.tsx                 # Root layout component
│   └── routes.ts                # Route configuration
├── build/                       # Production build output (gitignored)
│   ├── client/                  # Client-side build assets
│   └── server/                  # Server-side build for SSR
├── docs/                        # Documentation
│   ├── architecture/            # Architecture documentation
│   │   ├── api-design.md        # API design patterns
│   │   ├── coding-standards.md  # Coding standards and conventions
│   │   ├── deployment-architecture.md # Deployment configuration
│   │   ├── front-end-spec.md    # Frontend specifications
│   │   ├── source-tree.md       # This file
│   │   ├── tech-stack.md        # Technology stack details
│   │   ├── testing-strategy.md  # Testing approach
│   │   └── unified-project-structure.md # Legacy structure doc
│   ├── prd/                     # Product requirements
│   │   └── epic-*.md            # Epic documents
│   ├── qa/                      # QA results and gates
│   │   └── gates/               # Quality gate decisions
│   ├── stories/                 # User stories
│   │   └── *.story.md           # Individual story files
│   └── sprint-change-proposal-vercel.md # Sprint change documentation
├── prisma/                      # Database configuration
│   ├── migrations/              # Database migrations (if any)
│   └── schema.prisma            # Prisma schema definition
├── public/                      # Static assets
│   └── favicon.ico              # Application favicon
├── tests/                       # Test suites
│   ├── unit/                    # Unit tests
│   │   ├── components/          # Component tests
│   │   │   └── Button.test.tsx  # Button component tests
│   │   └── routes/              # Route tests
│   │       ├── api.health.test.ts # Health endpoint tests
│   │       └── index.test.tsx   # Home page tests
│   └── setup.ts                 # Test configuration
├── .bmad-core/                  # BMAD framework files
├── .github/                     # GitHub configuration (future)
│   └── workflows/               # GitHub Actions (future)
├── .vercel/                     # Vercel build artifacts (gitignored)
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment template
├── .eslintignore                # ESLint ignore patterns
├── .eslintrc.json               # ESLint configuration
├── .gitignore                   # Git ignore patterns
├── .prettierignore              # Prettier ignore patterns
├── .prettierrc.json             # Prettier configuration
├── Dockerfile                   # Docker configuration
├── eslint.config.js             # ESLint module config
├── package.json                 # Node dependencies and scripts
├── package-lock.json            # Locked dependency versions
├── react-router.config.ts       # React Router + Vercel configuration
├── README.md                    # Project documentation
├── render.yaml                  # Legacy Render deployment config
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite bundler configuration
└── vitest.config.ts             # Vitest testing configuration
```

## Directory Purposes

### `/app`
The main application directory containing all React Router v7 code. This is a unified full-stack application where:
- Frontend routes are in `routes/*.tsx`
- API routes follow the pattern `routes/api.*.tsx`
- Server-side code uses the `.server.ts` suffix

### `/app/components`
Organized by purpose:
- `features/` - Feature-specific components (e.g., BriefForm, ValidationWizard)
- `layouts/` - Layout components (e.g., Header, Footer, Sidebar)
- `ui/` - Reusable UI primitives based on Radix UI + Tailwind

### `/app/routes`
File-based routing following React Router v7 conventions:
- `_index.tsx` - Index routes
- `*.tsx` - Regular routes
- `api.*.tsx` - API endpoints (server-side)
- Nested routes use dot notation (e.g., `briefs.new.tsx`)

### `/app/lib`
Server-side utilities and shared code:
- Files with `.server.ts` suffix only run on the server
- Database clients, server utilities, etc.

### `/app/services`
Client-side API service layer for making HTTP requests to backend endpoints.

### `/app/stores`
Zustand stores for client-side state management.

### `/app/types`
Shared TypeScript type definitions used across the application.

### `/build`
Generated build output from `npm run build`. Contains:
- `client/` - Client-side assets for browser
- `server/` - Server-side code for SSR

### `/docs`
Comprehensive project documentation:
- `architecture/` - Technical architecture documents
- `prd/` - Product requirements and epics
- `qa/` - Quality assurance results
- `stories/` - User stories for development

### `/prisma`
Database configuration:
- `schema.prisma` - Database models and relationships
- `migrations/` - Database migration history

### `/tests`
Test files organized by type:
- `unit/` - Unit tests for components and functions
- `integration/` - Integration tests (future)
- `e2e/` - End-to-end tests (future)

## File Naming Conventions

### Routes
- Index routes: `_index.tsx`
- Nested routes: `parent.child.tsx`
- API routes: `api.{endpoint}.tsx`
- Layout routes: `_layout.tsx`

### Components
- React components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Server-only files: `*.server.ts`

### Tests
- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

## Import Aliases

The project uses the `~` alias for imports from the app directory:
- `~/components` → `app/components`
- `~/lib` → `app/lib`
- `~/routes` → `app/routes`
- `~/types` → `app/types`

## Build Outputs

### Development
- Uses Vite dev server with HMR
- Runs on `http://localhost:5173`

### Production
- Client assets in `build/client/`
- Server bundle in `build/server/`
- Deployed to Vercel with SSR support

## Environment Structure

### Local Development
- `.env` - Local environment variables
- Uses Vite dev server

### Production (Vercel)
- Environment variables set in Vercel dashboard
- Automatic deployments from `main` branch
- Preview deployments for PRs

## Key Architecture Decisions

1. **Unified Structure**: Single app directory for both frontend and backend (React Router v7 pattern)
2. **File-based Routing**: Routes determined by file structure
3. **Server Components**: `.server.ts` suffix for server-only code
4. **API Routes**: Colocated with frontend routes using `api.*.tsx` pattern
5. **Type Safety**: Shared types between frontend and backend
6. **Testing Strategy**: Colocated tests in `/tests` directory
7. **Documentation**: Comprehensive docs in `/docs` directory

## Future Considerations

### Potential Additions
- `/infrastructure` - Terraform/IaC configurations
- `/.github/workflows` - CI/CD pipelines
- `/scripts` - Build and deployment scripts
- `/app/middleware` - Route middleware functions

### Scalability Path
As the application grows, consider:
1. Feature-based organization within routes
2. Shared component library extraction
3. API versioning strategy
4. Microservices extraction (if needed)