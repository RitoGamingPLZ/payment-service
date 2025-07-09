#!/bin/bash

# Health check script for payment service

echo "🏥 Checking Payment Service Health..."

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Services are not running"
    exit 1
fi

# Check payment service health endpoint
HEALTH_URL="http://localhost:3000/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Payment service is healthy"
else
    echo "❌ Payment service health check failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Check database connection
DB_STATUS=$(docker-compose exec -T db pg_isready -U postgres)
if echo "$DB_STATUS" | grep -q "accepting connections"; then
    echo "✅ Database is healthy"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check Redis connection
REDIS_STATUS=$(docker-compose exec -T redis redis-cli ping)
if echo "$REDIS_STATUS" | grep -q "PONG"; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis connection failed"
    exit 1
fi

echo "🎉 All services are healthy!"