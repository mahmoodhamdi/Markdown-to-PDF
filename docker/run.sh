#!/bin/bash
# Markdown-to-PDF Docker Run Script
# Automatically finds an available port and starts the container

set -e

# Default values
START_PORT=${1:-3000}
MAX_ATTEMPTS=10
BUILD=false
DETACH=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build|-b)
            BUILD=true
            shift
            ;;
        --detach|-d)
            DETACH=true
            shift
            ;;
        --port|-p)
            START_PORT="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Function to check if port is available
is_port_available() {
    local port=$1
    if command -v nc &> /dev/null; then
        ! nc -z localhost "$port" 2>/dev/null
    elif command -v lsof &> /dev/null; then
        ! lsof -i :"$port" &> /dev/null
    else
        # Fallback: try to bind
        (echo >/dev/tcp/localhost/"$port") 2>/dev/null && return 1 || return 0
    fi
}

# Find available port
find_available_port() {
    local port=$START_PORT
    local attempts=0

    while [ $attempts -lt $MAX_ATTEMPTS ]; do
        if is_port_available "$port"; then
            echo "$port"
            return 0
        fi
        echo "Port $port is busy, trying next..." >&2
        port=$((port + 1))
        attempts=$((attempts + 1))
    done

    echo "Could not find an available port after $MAX_ATTEMPTS attempts" >&2
    return 1
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}Finding available port...${NC}"
PORT=$(find_available_port)
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to find available port${NC}"
    exit 1
fi
echo -e "${GREEN}Using port: $PORT${NC}"

# Export for docker-compose
export PORT

# Change to script directory
cd "$(dirname "$0")"

# Stop existing container
echo -e "${CYAN}Stopping existing container...${NC}"
docker-compose down 2>/dev/null || true

# Build if requested
if [ "$BUILD" = true ]; then
    echo -e "${CYAN}Building Docker image...${NC}"
    docker-compose build
fi

# Run container
echo -e "${CYAN}Starting Markdown-to-PDF container...${NC}"

if [ "$DETACH" = true ]; then
    docker-compose up -d
    echo ""
    echo -e "${GREEN}Container started successfully!${NC}"
    echo -e "${CYAN}Access the application at: http://localhost:$PORT${NC}"
    echo ""
    echo -e "${GRAY}To view logs: docker logs -f markdown-to-pdf${NC}"
    echo -e "${GRAY}To stop: docker-compose -f docker/docker-compose.yml down${NC}"
else
    echo -e "${CYAN}Access the application at: http://localhost:$PORT${NC}"
    echo -e "${GRAY}Press Ctrl+C to stop${NC}"
    echo ""
    docker-compose up
fi
