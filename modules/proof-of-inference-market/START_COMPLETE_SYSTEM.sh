#!/bin/bash
# Start Complete System with Go AVS + Python Agents

echo "🚀 Starting Complete Proof-of-Inference System"
echo "=============================================="

# Kill existing processes
echo "Cleaning up..."
lsof -ti:8081,8082,8083,8084,8085 | xargs kill -9 2>/dev/null || true
sleep 2

# Start Python agents first
echo ""
echo "Starting Python Agents..."
cd /Users/mayurchougule/development/ethereum/verifagents/modules/proof-of-inference-market

# ML Agent (Port 8083)
echo "  [1/3] ML Verification Agent (8083)..."
python3 python-ml-agent.py > logs/ml-agent.log 2>&1 &
sleep 2

# Payment Service (Port 8084)
echo "  [2/3] Payment Service (8084)..."
python3 4mica-payment-service.py > logs/payment-service.log 2>&1 &
sleep 2

# Receipt Service (Port 8085)
echo "  [3/3] Receipt Service (8085)..."
python3 erc8004-receipt-service.py > logs/receipt-service.log 2>&1 &
sleep 2

# Start Go AVS
echo ""
echo "Starting Go EigenLayer AVS..."
cd deploy
./avs-server > ../logs/go-avs.log 2>&1 &
GO_AVS_PID=$!
sleep 3

echo ""
echo "=============================================="
echo "✅ System Started!"
echo "=============================================="
echo ""
echo "Services:"
echo "  • Go AVS HTTP:    http://localhost:8082"
echo "  • Go AVS gRPC:    localhost:8081"
echo "  • ML Agent:       http://localhost:8083"
echo "  • Payment:        http://localhost:8084"
echo "  • Receipt:        http://localhost:8085"
echo ""
echo "Logs:"
echo "  tail -f logs/go-avs.log"
echo "  tail -f logs/ml-agent.log"
echo ""
echo "Test:"
echo "  curl http://localhost:8082/health"
echo ""
