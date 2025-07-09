#!/bin/bash

# Payment Service Startup Script

echo "🚀 Starting Payment Service..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please update the .env file with your actual values"
fi

# Check if we're in development or production mode
if [ "$1" = "dev" ]; then
    echo "🛠️  Starting in development mode..."
    docker-compose -f docker-compose.dev.yml up --build
elif [ "$1" = "prod" ]; then
    echo "🏭 Starting in production mode..."
    docker-compose up --build
elif [ "$1" = "down" ]; then
    echo "🛑 Stopping services..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
elif [ "$1" = "logs" ]; then
    echo "📄 Showing logs..."
    docker-compose logs -f payment-service
elif [ "$1" = "db" ]; then
    echo "🗄️  Running database migrations..."
    docker-compose exec payment-service npm run db:migrate
elif [ "$1" = "clean" ]; then
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
else
    echo "Usage: $0 [dev|prod|down|logs|db|clean]"
    echo ""
    echo "Commands:"
    echo "  dev   - Start in development mode"
    echo "  prod  - Start in production mode"
    echo "  down  - Stop all services"
    echo "  logs  - Show application logs"
    echo "  db    - Run database migrations"
    echo "  clean - Clean up Docker resources"
fi