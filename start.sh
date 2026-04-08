#!/bin/bash

# ==============================================================================
# Ticket Booking Engine - Run Script
# ==============================================================================

echo "🚀 Starting Distributed Ticket Booking Engine..."

# 1. Start Docker Containers (Postgres, Redis, Go Orchestrator, LB, Gateways)
echo "📦 Starting Docker containers (Postgres, Redis, Load Balancer, Gateways, Core Orchestrator)..."
echo "🧱 Scaling out to 3 API Gateways and 3 Orchestrators to simulate a distributed load..."
docker-compose up -d --scale api-gateway=3 --scale orchestrator=3 --scale worker-node=10

# 2. Wait for dependencies to initialize
echo "⏳ Waiting 5 seconds for services to start..."
sleep 5



# 4. Start Frontend UI (Vite + React)
echo "💻 Starting Frontend UI..."
cd frontend-ui
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Frontend UI dependencies..."
    npm install
fi
# Run in background
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ All services started successfully!"
echo "➡️  Frontend: http://localhost:5173"
echo "➡️  Gateway:  http://localhost:3000"
echo "➡️  Press Ctrl+C to stop all services."

# Trap Ctrl+C to clean up background processes
trap "echo '🛑 Stopping all services...'; kill $FRONTEND_PID; docker-compose stop; exit 0" SIGINT SIGTERM

# Wait indefinitely so the script doesn't exit, allowing trap to catch signals
wait
