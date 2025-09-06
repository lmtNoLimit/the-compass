import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  // Public routes
  index('routes/_index.tsx'),
  route('sign-in', 'routes/sign-in.tsx'),
  route('sign-up', 'routes/sign-up.tsx'),

  // API routes
  route('api/health', 'routes/api.health.tsx'),
  route('api/agent-test', 'routes/api.agent-test.tsx'),
  route('api/clerk-webhook', 'routes/api.clerk-webhook.tsx'),

  // Protected routes
  layout('components/features/ProtectedRoute.tsx', [
    route('briefs', 'routes/briefs._index.tsx'),
    route('briefs/new', 'routes/briefs.new.tsx'),
    route('validations', 'routes/validations._index.tsx'),
  ]),
] satisfies RouteConfig;
