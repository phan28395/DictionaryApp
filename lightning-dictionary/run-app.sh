#!/bin/bash

echo "🚀 Starting Lightning Dictionary..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if API server is running
echo -e "\n${YELLOW}1. Checking API Server...${NC}"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API server is already running${NC}"
else
    echo "Starting API server..."
    cd api
    npm start &
    API_PID=$!
    cd ..
    
    # Wait for API to start
    echo "Waiting for API server to start..."
    for i in {1..10}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ API server started successfully${NC}"
            break
        fi
        sleep 1
    done
fi

# Run the Tauri app
echo -e "\n${YELLOW}2. Starting Desktop App...${NC}"
echo "This will open the Lightning Dictionary window"
echo "Press Ctrl+C to stop"
echo ""

# Run in development mode
npm run tauri dev

# Cleanup on exit
if [ ! -z "$API_PID" ]; then
    echo -e "\n${YELLOW}Stopping API server...${NC}"
    kill $API_PID 2>/dev/null
fi

echo -e "\n${GREEN}✅ Lightning Dictionary stopped${NC}"