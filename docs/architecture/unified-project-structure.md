# Unified Project Structure

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
