#!/bin/bash

# Prowler Dashboard - Docker Setup Script
# This script creates the necessary .env file for running the application with Docker Compose
# Pulls code from: https://github.com/pranavanil47/prowlerdash

echo "🚀 Setting up Prowler Dashboard from GitHub repository..."
echo "📡 Repository: https://github.com/pranavanil47/prowlerdash"
echo ""

# Generate a secure session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Create .env file
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://prowler_user:prowler_password@postgres:5432/prowler_db

# Session Configuration  
SESSION_SECRET=${SESSION_SECRET}

# Server Configuration
PORT=5000
NODE_ENV=production

# Docker Session Fix (prevents session token issues in containers)
TRUST_PROXY=true
COOKIE_SECURE=false

# PostgreSQL Database Variables (for container)
POSTGRES_DB=prowler_db
POSTGRES_USER=prowler_user
POSTGRES_PASSWORD=prowler_password

# Optional: Replit-specific variables (can be left empty for Docker deployment)
REPLIT_DOMAINS=
ISSUER_URL=
REPL_ID=
EOF

echo "✅ Created .env file with the following configuration:"
echo "   - Repository: https://github.com/pranavanil47/prowlerdash"
echo "   - Database: PostgreSQL (prowler_db)"
echo "   - User: prowler_user"
echo "   - Session secret: Generated securely"
echo "   - Port: 5000"
echo ""
echo "📝 To run the application:"
echo "   1. docker-compose up --build"
echo "   2. Wait for database setup to complete"
echo "   3. Initialize database: docker-compose exec app node scripts/init-db.js"
echo "   4. Open http://localhost:5000"
echo ""
echo "🛠️  For local development (without Docker):"
echo "   1. Make sure PostgreSQL is running locally"
echo "   2. Set DATABASE_URL in .env file"
echo "   3. npm install"
echo "   4. node scripts/init-db.js"
echo "   5. npm run dev"
echo ""
echo "🔐 Default admin credentials will be created automatically:"
echo "   Email: admin@email.com"
echo "   Password: admin"
echo ""
echo "⚠️  Important notes:"
echo "   - First run will take longer as it clones and builds from GitHub"
echo "   - Database schema will be automatically created"
echo "   - Session persistence is configured for Docker (TRUST_PROXY=true, COOKIE_SECURE=false)"
echo "   - Remember to change the default admin password after first login!"
echo ""
echo "🐳 Docker services:"
echo "   - prowler-app: Main application (port 5000)"
echo "   - prowler-db: PostgreSQL database (port 5432)"
echo "   - prowler-db-setup: One-time database initialization"