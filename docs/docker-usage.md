# Docker Usage Guide

## Quick Start

### Development Mode
```bash
# Start all services in development mode
./scripts/start.sh dev

# Or manually
docker-compose -f docker-compose.dev.yml up --build
```

### Production Mode
```bash
# Start all services in production mode
./scripts/start.sh prod

# Or manually
docker-compose up --build
```

## Available Services

| Service | Port | Description |
|---------|------|-------------|
| Payment Service | 3000 | Main application |
| PostgreSQL | 5432 | Database |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `APP_SECRET` - Application secret for JWT tokens
- `DATABASE_URL` - PostgreSQL connection string (auto-configured in Docker)

## Common Commands

### Start Services
```bash
# Development with hot reload
./scripts/start.sh dev

# Production build
./scripts/start.sh prod
```

### Stop Services
```bash
./scripts/start.sh down
```

### View Logs
```bash
./scripts/start.sh logs
```

### Database Operations
```bash
# Run migrations
./scripts/start.sh db

# Connect to database
docker-compose exec db psql -U postgres -d payment_db
```

### Health Check
```bash
./scripts/health-check.sh
```

### Clean Up
```bash
# Remove all containers and volumes
./scripts/start.sh clean
```

## Docker Compose Files

- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration
- `docker-compose.override.yml` - Local development overrides

## Build Process

The production Docker build uses multi-stage builds:

1. **Builder stage**: Installs dependencies, generates Prisma client, builds TypeScript
2. **Production stage**: Copies built files, installs only production dependencies

## Development Workflow

1. Start development environment:
   ```bash
   ./scripts/start.sh dev
   ```

2. Your local `src/` changes are automatically reflected in the container

3. View logs:
   ```bash
   docker-compose logs -f payment-service-dev
   ```

4. Run database migrations:
   ```bash
   docker-compose exec payment-service-dev npm run db:migrate
   ```

## Troubleshooting

### Port Conflicts
If you get port conflicts, check what's running:
```bash
# Check what's using port 3000
lsof -i :3000

# Stop conflicting services
sudo service nginx stop  # example
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up db

# Check database logs
docker-compose logs db
```

### Build Issues
```bash
# Clean build
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Performance Monitoring

Services include health checks and can be monitored:

```bash
# Check service health
curl http://localhost:3000/health

# View container stats
docker stats

# View resource usage
docker-compose top
```