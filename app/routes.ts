import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  // Public routes
  index('routes/_index.tsx'),
  route('sign-in', 'routes/sign-in.tsx'),
  route('sign-up', 'routes/sign-up.tsx'),

  // API routes
  route('api/health', 'routes/api.health.tsx'),
  route('api/chat', 'routes/api.chat.tsx'),
  route('api/chat/session', 'routes/api.chat.session.tsx'),
  route('api/chat/query', 'routes/api.chat.query.tsx'),
  route('api/clerk-webhook', 'routes/api.clerk-webhook.tsx'),

  // Protected routes
  layout('components/features/ProtectedRoute.tsx', [
    route('briefs', 'routes/briefs._index.tsx'),
    route('briefs/new', 'routes/briefs.new.tsx'),
    route('dashboard', 'routes/dashboard.tsx'),
    route('history', 'routes/history.tsx'),
    route('settings', 'routes/settings.tsx'),
    route('chat', 'routes/chat.tsx'),
    route('conversation/:id', 'routes/conversation.$id.tsx'),
    route('validations', 'routes/validations._index.tsx'),
  ]),
] satisfies RouteConfig;
