#!/bin/bash

# Local Development Setup Script
# This script sets up the application for local development

echo "🚀 Setting up Prowler Dashboard for local development..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "📋 Creating .env file for local development..."
  
  # Generate a secure session secret
  SESSION_SECRET=$(openssl rand -base64 32)
  
  # Create .env file with local PostgreSQL URL
  cat > .env << EOF
# Database Configuration (Update this to match your local PostgreSQL setup)
DATABASE_URL=postgresql://postgres:password@localhost:5432/prowler_db

# Session Configuration  
SESSION_SECRET=${SESSION_SECRET}

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: For production deployment
POSTGRES_DB=prowler_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
EOF
  
  echo "✅ Created .env file"
  echo "⚠️  Please update DATABASE_URL in .env to match your local PostgreSQL setup"
  echo ""
else
  echo "ℹ️  .env file already exists, skipping creation"
  echo ""
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
echo "⚠️  Make sure PostgreSQL is running and the database specified in DATABASE_URL exists"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found. Please set it in your .env file or environment"
  exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Initialize database
echo "🔧 Initializing database schema and admin user..."
node scripts/init-db.js

echo ""
echo "✅ Local setup completed!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "🔐 Default login credentials:"
echo "   Email: admin@email.com"
echo "   Password: admin"
echo ""
echo "🌐 The application will be available at: http://localhost:5000"
echo ""
echo "⚠️  Remember to:"
echo "   1. Update DATABASE_URL in .env to match your PostgreSQL setup"
echo "   2. Change the default admin password after first login"