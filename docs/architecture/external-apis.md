# External APIs

## Google Vertex AI API
- **Purpose:** Provides Gemini 1.5 Pro model for ADK agents to conduct persona interviews
- **Documentation:** https://cloud.google.com/vertex-ai/docs/reference/rest
- **Base URL(s):** https://{region}-aiplatform.googleapis.com
- **Authentication:** Service Account with JSON key or Application Default Credentials
- **Rate Limits:** 60 requests per minute (default), can be increased via quota request

**Key Endpoints Used:**
- `POST /v1/projects/{project}/locations/{location}/publishers/google/models/gemini-1.5-pro:generateContent` - Generate AI responses for interviews
- `POST /v1/projects/{project}/locations/{location}/publishers/google/models/gemini-1.5-pro:streamGenerateContent` - Stream responses for real-time progress

**Integration Notes:** ADK SDK handles most complexity, but need circuit breaker for rate limits and fallback behavior when service is unavailable

## Clerk Authentication API
- **Purpose:** Complete user authentication and session management
- **Documentation:** https://clerk.com/docs/reference/backend-api
- **Base URL(s):** https://api.clerk.com/v1
- **Authentication:** Secret key in Authorization header
- **Rate Limits:** 10,000 requests per minute for production instances

**Key Endpoints Used:**
- `GET /users/{userId}` - Fetch user profile data
- `POST /sessions/{sessionId}/verify` - Verify JWT tokens
- `GET /organizations/{orgId}/members` - List organization members (future feature)

**Integration Notes:** Frontend SDK handles most auth flows, backend only needs token verification. Webhook endpoints needed for user lifecycle events.

## Neon Database API
- **Purpose:** Database branching and management operations
- **Documentation:** https://neon.tech/docs/reference/api-reference
- **Base URL(s):** https://console.neon.tech/api/v2
- **Authentication:** API key in Authorization header
- **Rate Limits:** 100 requests per second

**Key Endpoints Used:**
- `POST /projects/{projectId}/branches` - Create database branch for testing
- `DELETE /projects/{projectId}/branches/{branchId}` - Clean up test branches
- `GET /projects/{projectId}/operations` - Monitor migration status

**Integration Notes:** Only used for DevOps operations, not runtime queries. Prisma handles all runtime database connections.

## Vercel API
- **Purpose:** Deployment management and blob storage operations
- **Documentation:** https://vercel.com/docs/rest-api
- **Base URL(s):** https://api.vercel.com
- **Authentication:** Bearer token
- **Rate Limits:** Based on plan tier

**Key Endpoints Used:**
- `POST /v1/blob/upload` - Upload exported PDFs
- `GET /v1/deployments` - Monitor deployment status
- `POST /v1/cron` - Manage scheduled tasks (future feature)

**Integration Notes:** SDK handles most operations transparently. Need to implement cleanup for old exports to manage storage costs.
