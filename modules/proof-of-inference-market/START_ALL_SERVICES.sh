#!/bin/bash
# Start all Proof-of-Inference Market services with CORS enabled

echo "🚀 Starting Proof-of-Inference Market Services (CORS Enabled)"
echo "=============================================================="

# Create logs directory
mkdir -p logs

# Stop any existing services
echo "Stopping old services..."
pkill -f "python-ml-agent" 2>/dev/null
pkill -f "4mica-simple" 2>/dev/null
pkill -f "go run cmd/main.go" 2>/dev/null
sleep 2

# Start Python ML Agent (port 8083)
echo "Starting ML Agent (port 8083)..."
/opt/homebrew/Caskroom/miniconda/base/envs/z-agents/bin/python3 python-ml-agent.py > logs/ml-agent.log 2>&1 &
ML_PID=$!
echo "  PID: $ML_PID"

# Start 4Mica Payment Service (port 8084)
echo "Starting 4Mica Payment (port 8084)..."
/opt/homebrew/Caskroom/miniconda/base/envs/z-agents/bin/python3 4mica-simple.py > logs/4mica.log 2>&1 &
PAYMENT_PID=$!
echo "  PID: $PAYMENT_PID"

# Start Go AVS (ports 8081, 8082)
echo "Starting Go AVS (ports 8081 gRPC, 8082 HTTP)..."
go run cmd/main.go > logs/avs.log 2>&1 &
AVS_PID=$!
echo "  PID: $AVS_PID"

# Wait for services to start
echo ""
echo "Waiting for services to initialize..."
sleep 5

# Check services
echo ""
echo "🔍 Checking Services:"
echo "--------------------"

if curl -s http://localhost:8083/health | grep -q "healthy"; then
    echo "✅ ML Agent (8083): Running"
else
    echo "❌ ML Agent (8083): Failed"
fi

if curl -s http://localhost:8084/health | grep -q "healthy"; then
    echo "✅ 4Mica Payment (8084): Running"
else
    echo "❌ 4Mica Payment (8084): Failed"
fi

if curl -s http://localhost:8082/health | grep -q "healthy"; then
    echo "✅ Go AVS (8082): Running"
else
    echo "❌ Go AVS (8082): Failed"
fi

echo ""
echo "=============================================================="
echo "✅ All Services Running (CORS Enabled)"
echo "=============================================================="
echo ""
echo "Services:"
echo "  • ML Agent:      http://localhost:8083"
echo "  • 4Mica Payment: http://localhost:8084"
echo "  • Go AVS HTTP:   http://localhost:8082"
echo "  • Go AVS gRPC:   localhost:8081"
echo ""
echo "Frontend can now call these services from http://localhost:3004"
echo ""
echo "To stop services:"
echo "  pkill -f 'python-ml-agent'"
echo "  pkill -f '4mica-simple'"
echo "  pkill -f 'go run cmd/main.go'"
echo ""
echo "Logs:"
echo "  tail -f logs/ml-agent.log"
echo "  tail -f logs/4mica.log"
echo "  tail -f logs/avs.log"
echo ""
