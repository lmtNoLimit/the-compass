# Deployment Architecture

## Deployment Strategy

**Full-Stack Deployment:**
- **Platform:** Render
- **Service Type:** Web Service (Node.js)
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Environment:** Node.js 20+
- **Auto-Deploy:** Enabled from main branch

**Database:**
- **Platform:** Neon (Serverless PostgreSQL)
- **Connection:** Via DATABASE_URL environment variable
- **Pooling:** Handled by Neon automatically

## CI/CD Pipeline
```yaml