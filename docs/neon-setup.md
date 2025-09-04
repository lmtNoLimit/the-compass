# Neon Database Setup

## Overview
This document explains how to set up and configure the Neon PostgreSQL database for the Persona Compass application.

## Production Database Setup

### 1. Create Neon Project
1. Create a Neon account at https://neon.tech
2. Create a new project  
3. Choose PostgreSQL 16+ version
4. Select your preferred region (closest to your deployment)
5. Create main database: `persona_compass`

### 2. Connection Pooling Configuration
For production, use connection pooling parameters in your connection string:

```bash
DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-1.aws.neon.tech/persona_compass?sslmode=require&connection_limit=20&pool_timeout=20"
```

**Recommended settings:**
- `connection_limit=20` - Max connections (adjust based on Neon plan)
- `pool_timeout=20` - Connection timeout in seconds  
- `sslmode=require` - Always use SSL for security

### 3. Environment Variables
Add to your production environment (Render dashboard):

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require&connection_limit=20&pool_timeout=20
NODE_ENV=production
```

## Local Development Options

### Option 1: Neon Development Database (Recommended)
1. Create a separate database in your Neon project: `persona_compass_dev`
2. Use the development connection string in `apps/api/.env`
3. Benefits: Same environment as production, no local setup required

### Option 2: Local PostgreSQL
- Docker PostgreSQL container
- Local PostgreSQL installation  
- Use for offline development

Local connection string format:
```bash
DATABASE_URL="postgresql://persona_user:secure_password@localhost:5432/persona_compass_dev"
```

## Initial Setup

### API Backend Setup
```bash
# Navigate to API directory
cd apps/api

# Copy environment template
cp .env.example .env

# Edit .env file with your DATABASE_URL
# DATABASE_URL="your-neon-connection-string"

# Install dependencies (if not already done)
npm install
```

### Database Migration and Seeding

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and run initial migration
npm run db:migrate

# Optional: Seed database with initial data
npm run db:seed

# Test connection with health check
npm run dev
# Visit http://localhost:3001/health
```

## Database Commands

### Development Commands
```bash
# Generate Prisma client
npm run db:generate

# Create new migration
npm run db:migrate

# Push schema changes (dev only - no migration file)
npm run db:push

# Reset database (careful - deletes all data)
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

### Production Commands
```bash
# Deploy migrations to production
npm run db:deploy

# Generate client for production
npm run db:generate
```

## Health Monitoring

### Database Health Check
The API includes a health check endpoint:

```bash
# Test locally
curl http://localhost:3001/health

# Expected response
{
  "status": "ok", 
  "database": {
    "status": "healthy",
    "connection": "active",
    "responseTime": "15ms"
  }
}
```

### Connection Monitoring
- API automatically retries connections with exponential backoff
- Health check endpoint monitors database connectivity
- Graceful shutdown handling for database connections

## Troubleshooting

### Common Issues
1. **SSL Errors**: Ensure `sslmode=require` in connection string for Neon
2. **Connection Timeouts**: Adjust `pool_timeout` and `connection_limit` 
3. **Migration Conflicts**: Use `npm run db:reset` in development only
4. **Permission Issues**: Verify database user privileges

### Connection Testing
```bash
# Test database connection
cd apps/api && npm run dev

# Check logs for connection status
# Visit /health endpoint for detailed status
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **SSL Required**: Always use `sslmode=require` for Neon connections
3. **Connection Limits**: Configure appropriate limits based on your Neon plan
4. **Separate Databases**: Use different databases for dev/staging/production
5. **Regular Updates**: Keep Prisma and database dependencies updated