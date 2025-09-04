# Neon Database Setup

## Production Database Setup

1. Create a Neon account at https://neon.tech
2. Create a new project
3. Choose PostgreSQL 16+
4. Copy the connection string from your Neon dashboard

## Environment Variables

Add this to your production environment (Render dashboard):

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## Local Development

For local development, you can use:
- Docker PostgreSQL container
- Local PostgreSQL installation
- Neon database branch for development

## Database Migrations

To create and run migrations:

```bash
# Create a new migration
npm run db:migrate

# Push schema changes (for development)
npm run db:push

# Generate Prisma client
npm run db:generate

# Open Prisma Studio
npm run db:studio
```

## Initial Setup Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and run first migration
npm run db:migrate
```