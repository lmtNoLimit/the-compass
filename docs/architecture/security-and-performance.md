# Security and Performance

## Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline' clerk.com; style-src 'self' 'unsafe-inline'`
- XSS Prevention: React's built-in escaping, input sanitization
- Secure Storage: HttpOnly cookies for auth tokens

**Backend Security:**
- Input Validation: Zod schemas for all endpoints
- Rate Limiting: 100 req/min general, 10 validations/hour
- CORS Policy: Restrictive origin whitelist

**Authentication Security:**
- Token Storage: HttpOnly cookies with SameSite
- Session Management: Clerk-managed with 24h expiry
- Password Policy: Clerk enforced minimum requirements

## Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 200KB initial JS
- Loading Strategy: Route-based code splitting
- Caching Strategy: SWR for data fetching, CDN for assets

**Backend Performance:**
- Response Time Target: < 500ms p95
- Database Optimization: Connection pooling, indexed queries
- Caching Strategy: Redis for sessions, 5min cache for search
