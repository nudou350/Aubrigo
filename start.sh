#!/bin/bash

echo "========================================"
echo "   Pet SOS - Starting Application"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
    echo ""
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo ""
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo ""
fi

echo "Starting backend and frontend..."
echo ""
echo "Backend will run on: http://localhost:3000"
echo "Frontend will run on: http://localhost:4200"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Start both services using concurrently
npm start
