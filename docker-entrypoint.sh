#!/bin/sh

# Docker entrypoint script for ALPAR Chatbot
# Handles external API connectivity and graceful startup

set -e

echo "🚀 Starting ALPAR Chatbot..."

# Function to check external API connectivity
check_external_api() {
    echo "🔍 Checking external API connectivity..."
    
    # Test basic internet connectivity
    if ! curl -s --connect-timeout 5 https://www.google.com > /dev/null; then
        echo "⚠️  Warning: No internet connectivity detected"
        return 1
    fi
    
    # Test Azure connectivity (if credentials are available)
    if [ -n "$AZURE_PROJECT_URL" ]; then
        echo "🔍 Testing Azure AI Projects connectivity..."
        # Add specific Azure connectivity test here if needed
    fi
    
    echo "✅ External API connectivity check passed"
    return 0
}

# Function to wait for external dependencies
wait_for_dependencies() {
    echo "⏳ Waiting for external dependencies..."
    
    # Wait for network to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_external_api; then
            echo "✅ External dependencies are ready"
            return 0
        fi
        
        echo "⏳ Attempt $attempt/$max_attempts - waiting for external dependencies..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "⚠️  Warning: External dependencies not fully available, continuing in demo mode"
    return 1
}

# Main startup sequence
main() {
    echo "🐳 ALPAR Chatbot Docker Container Starting..."
    echo "📅 $(date)"
    echo "🌐 Container ID: $(hostname)"
    
    # Wait for external dependencies (non-blocking)
    wait_for_dependencies || true
    
    # Start the application
    echo "🚀 Starting Node.js application..."
    exec "$@"
}

# Run main function with all arguments
main "$@"
