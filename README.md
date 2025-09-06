# Persona Compass

A modern web application built with React Router v7 (Remix), TypeScript, and Tailwind CSS for persona-driven feature development.

## Tech Stack

- **Frontend**: React Router v7, TypeScript, Tailwind CSS v4
- **UI Components**: Radix UI v1.1+ 
- **Authentication**: Clerk v4.0+
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **AI Framework**: Google Vertex AI with Python ADK
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
├── agents/                 # Python AI agents (ADK)
│   ├── config/             # Agent configurations
│   ├── utils/              # Shared utilities
│   ├── tests/              # Python agent tests
│   └── requirements.txt    # Python dependencies
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
- Python 3.11+
- PostgreSQL (local or Neon account)
- Clerk account for authentication
- Google Cloud account with billing enabled (free tier)

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
- Google Cloud project ID and service account credentials
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

#### Python Agent Commands

- `cd agents && python -m pytest` - Run Python tests
- `cd agents && python -m test_agent --local` - Test agent locally
- `cd agents && black .` - Format Python code
- `cd agents && mypy .` - Type check Python code

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

### Google Cloud Setup

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable billing (free tier available with $300 credits)
4. Note your Project ID for the `.env` file

#### 2. Enable Vertex AI APIs

1. In Cloud Console, go to "APIs & Services" → "Enable APIs"
2. Search and enable:
   - Vertex AI API
   - Cloud Resource Manager API
   - Identity and Access Management (IAM) API

#### 3. Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Create new service account named "persona-compass-ai"
3. Grant roles:
   - Vertex AI User
   - Service Account Token Creator
4. Create and download JSON key
5. Save key securely and add path to `.env`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   ```
   Or for production, base64 encode and use:
   ```bash
   GOOGLE_CLOUD_KEY_JSON={base64-encoded-json}
   ```

#### 4. Set Environment Variables

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_REGION=us-central1  # or your preferred region
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Python ADK Development

#### 1. Set up Python Environment

```bash
cd agents
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 2. Test Agent Locally

```bash
python -m agents.test_agent --local
```

#### 3. Deploy Agent to Vertex AI

```bash
# Build agent package
python -m adk build agents/test_agent.py

# Deploy to Vertex AI
python -m adk deploy --project=$GOOGLE_CLOUD_PROJECT_ID --region=$GOOGLE_CLOUD_REGION

# Verify deployment
python -m adk status --agent-id=test_agent
```

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
- **ESLint** for JavaScript/TypeScript linting
- **Prettier** for JavaScript/TypeScript formatting
- **Black** for Python formatting
- **mypy** for Python type checking
- **pylint** for Python linting
- **TypeScript** for type checking
- **Husky** (to be added) for git hooks

Run quality checks:

```bash
# JavaScript/TypeScript
npm run lint          # Check for linting errors
npm run format        # Format code
npm run typecheck     # Check TypeScript types

# Python
cd agents
python -m black .     # Format Python code
python -m mypy .      # Check Python types
python -m pylint agents  # Lint Python code
```

## Contributing

1. Follow the established coding standards
2. Write tests for new features
3. Ensure all checks pass before committing
4. Use conventional commit messages

## License

Private project - all rights reserved.
