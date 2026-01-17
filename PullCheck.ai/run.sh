#!/bin/bash

# PullCheck - Development Server Runner
# Run both backend and frontend servers concurrently

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting PullCheck Development Servers${NC}"
echo ""

# Check if MongoDB is running
echo -e "${YELLOW}📦 Checking MongoDB...${NC}"
if docker ps | grep -q pullcheck-mongo; then
    echo -e "${GREEN}✓ MongoDB is already running${NC}"
else
    echo -e "${YELLOW}Starting MongoDB via Docker...${NC}"
    docker start pullcheck-mongo 2>/dev/null || docker run -d --name pullcheck-mongo -p 27017:27017 mongo:7
    echo -e "${GREEN}✓ MongoDB started${NC}"
fi

echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Servers stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "${BLUE}🔧 Starting Backend Server (port 3000)...${NC}"
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo -e "${BLUE}🎨 Starting Frontend Server (port 5173)...${NC}"
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}   PullCheck is running!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "   ${BLUE}Frontend:${NC}  http://localhost:5173"
echo -e "   ${BLUE}Backend:${NC}   http://localhost:3000"
echo -e "   ${BLUE}API:${NC}       http://localhost:3000/api/v1"
echo -e "   ${BLUE}Health:${NC}    http://localhost:3000/health"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
