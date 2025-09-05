# Unified Project Structure

## Current Implementation (React Router v7 Full-Stack)

```
persona-compass/
├── app/                          # React Router v7 unified application
│   ├── components/               # React components
│   │   ├── features/            # Feature-specific components
│   │   ├── layouts/             # Layout components
│   │   └── ui/                  # Reusable UI components
│   │       ├── Button.tsx       
│   │       └── Dialog.tsx       
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and server-side code
│   │   ├── prisma.server.ts     # Prisma client singleton
│   │   └── utils.ts             # Utility functions
│   ├── routes/                  # File-based routing
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
├── prisma/                      # Database configuration
│   └── schema.prisma            # Prisma schema definition
├── public/                      # Static assets
│   └── favicon.ico              
├── tests/                       # Test suites
│   ├── unit/                    # Unit tests
│   │   ├── components/          
│   │   │   └── Button.test.tsx  
│   │   └── routes/              
│   │       ├── api.health.test.ts 
│   │       └── index.test.tsx   
│   └── setup.ts                 # Test configuration
├── docs/                        # Documentation
│   ├── architecture/            # Architecture documentation
│   │   ├── coding-standards.md  
│   │   ├── source-tree.md       # Detailed source tree
│   │   ├── tech-stack.md        
│   │   └── testing-strategy.md  
│   ├── prd/                     # Product requirements
│   │   └── epic-*.md            
│   ├── qa/                      # QA results and gates
│   │   └── gates/               
│   └── stories/                 # User stories
│       └── *.story.md           
├── .env.example                 # Environment template
├── .eslintrc.json               # ESLint configuration
├── .gitignore                   # Git ignore patterns
├── .prettierrc.json             # Prettier configuration
├── Dockerfile                   # Docker configuration
├── package.json                 # Dependencies and scripts
├── package-lock.json            
├── react-router.config.ts       # React Router + Vercel config
├── README.md                    # Project documentation
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite bundler configuration
└── vitest.config.ts             # Vitest testing configuration
```

## Key Architectural Points

### Unified Full-Stack Application
- Single `app/` directory contains both frontend and backend code
- API routes use `api.*.tsx` pattern within routes directory
- Server-side code uses `.server.ts` suffix
- No separate backend directory needed with React Router v7

### File-Based Routing
- Routes determined by file structure in `app/routes/`
- API endpoints colocated with frontend routes
- Nested routes use dot notation (e.g., `briefs.new.tsx`)

### Deployment
- Vercel deployment with SSR support
- Automatic deployments from main branch
- Preview deployments for pull requests

### Future Expansion (When Needed)

```
├── .github/                    # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── infrastructure/             # IaC definitions
│   ├── terraform/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── modules/
│       ├── vercel/
│       ├── neon/
│       └── clerk/
└── scripts/                    # Build and deployment scripts
```

## Notes

- This structure represents the **current actual implementation**
- The separate `api/` backend directory shown in older docs is **not used**
- React Router v7 provides full-stack capabilities in a unified structure
- For detailed directory purposes and conventions, see `source-tree.md`
