#!/bin/bash

echo "Setting up Payment Service..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma db push

echo "Setup complete!"
echo ""
echo "To start the service:"
echo "  npm run dev    # Development mode"
echo "  npm start      # Production mode"
echo ""
echo "To run with Docker:"
echo "  docker-compose up --build"