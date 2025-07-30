#!/bin/bash

# Start backend
cd backend
npm install
echo "Starting backend..."
npm run dev &
BACKEND_PID=$!r
cd ..

# Start frontend
cd frontend
npm install
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Both backend and frontend are running."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press [CTRL+C] to stop both."
