# Unified Project Structure

```
persona-compass/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── apps/                       # Application packages
│   ├── web/                    # Remix frontend application
│   │   ├── app/
│   │   │   ├── components/     # UI components
│   │   │   ├── routes/         # Page routes
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Frontend utilities
│   │   │   ├── styles/         # Global styles
│   │   │   ├── entry.client.tsx
│   │   │   ├── entry.server.tsx
│   │   │   └── root.tsx
│   │   ├── public/             # Static assets
│   │   ├── tests/              # Frontend tests
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── remix.config.js
│   │   └── tailwind.config.js
│   └── api/                    # Express backend application
│       ├── src/
│       │   ├── routes/         # API routes
│       │   ├── controllers/    # Route controllers
│       │   ├── services/       # Business logic
│       │   ├── repositories/   # Data access layer
│       │   ├── middleware/     # Express middleware
│       │   ├── agents/         # ADK agent definitions
│       │   ├── utils/          # Backend utilities
│       │   └── app.ts          # Express app setup
│       ├── prisma/
│       │   ├── schema.prisma   # Database schema
│       │   └── migrations/     # Migration files
│       ├── tests/              # Backend tests
│       ├── .env.example
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   │   ├── user.ts
│   │   │   │   ├── brief.ts
│   │   │   │   └── validation.ts
│   │   │   ├── constants/      # Shared constants
│   │   │   └── utils/          # Shared utilities
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       └── vitest/
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
