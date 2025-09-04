# Coding Standards

## Critical Fullstack Rules
- **Type Sharing:** Always define types in packages/shared and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **Database Access:** Always use Prisma, never raw SQL except for specific search queries
- **Async Operations:** All async functions must have proper error handling
- **Security:** Never log or expose sensitive data, always validate input

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/feature-briefs` |
| Database Tables | - | snake_case | `feature_briefs` |
| Environment Vars | SCREAMING_SNAKE | SCREAMING_SNAKE | `DATABASE_URL` |
| TypeScript Types | PascalCase | PascalCase | `FeatureBrief` |
| Functions | camelCase | camelCase | `validateBrief()` |
