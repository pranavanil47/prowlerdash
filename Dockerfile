# Prowler Dashboard Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies but keep vite for production runtime
RUN npm prune --production && npm install vite

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S prowler -u 1001

# Change ownership of app directory
RUN chown -R prowler:nodejs /app
USER prowler

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the application
CMD ["npm", "start"]