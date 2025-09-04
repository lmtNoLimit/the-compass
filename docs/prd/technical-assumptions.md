# Technical Assumptions

## Repository Structure: Monorepo

Single repository containing all code (frontend, backend, configurations) to simplify development, deployment, and code sharing during MVP phase.

## Service Architecture

**Modular Monolith** - Single deployable application with clear module boundaries:
- **Web Module:** Remix application serving UI and handling server-side rendering
- **API Module:** Express.js REST API for business logic and data operations
- **AI Module:** Vertex AI integration layer with agent orchestration and persona management
- **Data Module:** MongoDB data access layer with model definitions

This architecture allows future migration to microservices if needed while keeping MVP development simple.

## Testing Requirements

**Unit + Integration Testing** approach:
- Unit tests for business logic and utility functions (target: 70% coverage)
- Integration tests for API endpoints and Vertex AI agent interactions
- Playground environment for testing and refining persona behaviors
- Manual testing convenience methods for persona simulation validation
- End-to-end testing deferred to post-MVP

## Additional Technical Assumptions and Requests

- **Vertex AI** will power our agent and persona system, providing:
  - Agent Builder for creating sophisticated interview agents
  - Conversation design tools for structured interviews
  - Grounding capabilities to ensure consistent persona behaviors
  - Built-in evaluation metrics for response quality
- **Remix** will handle both SSR and client-side interactions using its built-in data loaders and actions
- **TypeScript** throughout for type safety and better developer experience
- **MongoDB** schemas will be flexible initially but with TypeScript interfaces for structure
- **Vertex AI SDK** will be accessed through Google Cloud's Node.js client library
- **Authentication** will use simple email/password initially with migration path to SSO
- **File exports** (PDF/Markdown) will be generated server-side using Puppeteer or similar
- **Render deployment** will use their Node.js buildpack with automatic deploys from main branch
- **Environment variables** will manage API keys and configuration across environments
- **Rate limiting** will be implemented at application level to manage Vertex AI quotas
- **Persona definitions** will be stored as Vertex AI agent configurations with version control
- **Prompt templates** will be managed through Vertex AI's prompt management features
