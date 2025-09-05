# Persona Compass

A modern web application built with React Router v7 (Remix), TypeScript, and Tailwind CSS for persona-driven feature development.

## Tech Stack

- **Frontend**: React Router v7, TypeScript, Tailwind CSS v4
- **UI Components**: Radix UI v1.1+ 
- **Authentication**: Clerk v4.0+
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Testing**: Vitest 1.0+ with Testing Library
- **Build Tool**: Vite 5.0+
- **Deployment**: Vercel

## Project Structure

```
persona-compass/
├── app/                     # React Router app directory
│   ├── components/          # UI components
│   │   ├── ui/             # Radix UI primitives
│   │   ├── features/       # Feature-specific components
│   │   └── layouts/        # Layout components
│   ├── routes/             # File-based routing
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── stores/             # Zustand state management
│   ├── lib/                # Utilities and helpers
│   ├── types/              # TypeScript interfaces
│   ├── root.tsx           # Root layout component
│   └── app.css            # Global styles
├── prisma/                 # Database schema
├── public/                 # Static assets
├── tests/                  # Test files
├── docs/                   # Documentation
├── react-router.config.ts  # React Router configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- PostgreSQL (local or Neon account)
- Clerk account for authentication

### Installation

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd persona-compass
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Update the `.env` file with your actual values:
- Clerk keys from your Clerk dashboard
- Database URL from Neon or local PostgreSQL
- Other environment-specific values

3. Set up the database:

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

### Development

Start the development server:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Available Scripts

#### Root Level Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript checks

#### Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

#### Testing Commands

- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI

## External Service Setup

### Clerk Authentication

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Copy API keys to `.env` file
4. See [docs/clerk-setup.md](./docs/clerk-setup.md) for detailed setup

### Neon Database

1. Create account at [neon.tech](https://neon.tech)  
2. Create new PostgreSQL project
3. Copy connection string to `.env` file
4. See [docs/neon-setup.md](./docs/neon-setup.md) for detailed setup

### Vercel Deployment

1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set up environment variables in Vercel dashboard
4. Deploy automatically from main branch

The project uses `@vercel/react-router` for optimal React Router v7 integration.

## Testing

Run the test suite:

```bash
npm run test
```

Tests are located in `tests/` and use:
- **Vitest** for test runner
- **Testing Library** for React component testing
- **jsdom** for DOM simulation

## Code Quality

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking
- **Husky** (to be added) for git hooks

Run quality checks:

```bash
npm run lint          # Check for linting errors
npm run format        # Format code
npm run typecheck     # Check TypeScript types
```

## Contributing

1. Follow the established coding standards
2. Write tests for new features
3. Ensure all checks pass before committing
4. Use conventional commit messages

## License

Private project - all rights reserved.
