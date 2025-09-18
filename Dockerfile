# Use Node.js 20 LTS as base image
FROM node:20-alpine

# Install curl for health checks and debugging
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S alparbot -u 1001

# Change ownership of the app directory
RUN chown -R alparbot:nodejs /app
USER alparbot

# Expose port
EXPOSE 5000

# Health check with external API connectivity test
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use entrypoint script for better external API handling
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server-hardcoded.js"]
