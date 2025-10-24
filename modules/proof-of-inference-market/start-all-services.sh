#!/bin/bash
# Start all Proof-of-Inference AVS services

echo "🚀 Starting Proof-of-Inference AVS - All Services"
echo "================================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Kill existing services on these ports
echo -e "${YELLOW}Cleaning up existing services...${NC}"
lsof -ti:8082,8083,8084,8085 | xargs kill -9 2>/dev/null || true
sleep 2

# Create logs directory
mkdir -p logs

echo ""
echo "================================================================"
echo -e "${CYAN}Starting Services...${NC}"
echo "================================================================"

# Start ML Verification Agent (Port 8083)
echo -e "${GREEN}[1/4] Starting ML Verification Agent (port 8083)...${NC}"
python3 python-ml-agent.py > logs/ml-agent.log 2>&1 &
ML_PID=$!
echo "   PID: $ML_PID"
sleep 2

# Check if service started
if ps -p $ML_PID > /dev/null; then
    echo -e "   ${GREEN}✅ ML Verification Agent started${NC}"
else
    echo -e "   ${YELLOW}❌ Failed to start ML Verification Agent${NC}"
fi

# Start 4Mica Payment Service (Port 8084)
echo -e "${GREEN}[2/4] Starting 4Mica Payment Service (port 8084)...${NC}"
python3 4mica-payment-service.py > logs/payment-service.log 2>&1 &
PAYMENT_PID=$!
echo "   PID: $PAYMENT_PID"
sleep 2

# Check if service started
if ps -p $PAYMENT_PID > /dev/null; then
    echo -e "   ${GREEN}✅ Payment Service started${NC}"
else
    echo -e "   ${YELLOW}❌ Failed to start Payment Service${NC}"
fi

# Start ERC-8004 Receipt Service (Port 8085)
echo -e "${GREEN}[3/4] Starting ERC-8004 Receipt Service (port 8085)...${NC}"
python3 erc8004-receipt-service.py > logs/receipt-service.log 2>&1 &
RECEIPT_PID=$!
echo "   PID: $RECEIPT_PID"
sleep 2

# Check if service started
if ps -p $RECEIPT_PID > /dev/null; then
    echo -e "   ${GREEN}✅ Receipt Service started${NC}"
else
    echo -e "   ${YELLOW}❌ Failed to start Receipt Service${NC}"
fi

# Start AVS Orchestrator (Port 8082)
echo -e "${GREEN}[4/4] Starting AVS Orchestrator (port 8082)...${NC}"
python3 avs-orchestrator.py > logs/avs-orchestrator.log 2>&1 &
AVS_PID=$!
echo "   PID: $AVS_PID"
sleep 3

# Check if service started
if ps -p $AVS_PID > /dev/null; then
    echo -e "   ${GREEN}✅ AVS Orchestrator started${NC}"
else
    echo -e "   ${YELLOW}❌ Failed to start AVS Orchestrator${NC}"
fi

echo ""
echo "================================================================"
echo -e "${CYAN}Service Status${NC}"
echo "================================================================"

# Check all services
echo ""
echo -e "${YELLOW}Checking health endpoints...${NC}"
sleep 2

# Check ML Agent
if curl -s http://localhost:8083/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ML Verification Agent (8083) - Healthy${NC}"
else
    echo -e "${YELLOW}❌ ML Verification Agent (8083) - Not responding${NC}"
fi

# Check Payment Service
if curl -s http://localhost:8084/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 4Mica Payment Service (8084) - Healthy${NC}"
else
    echo -e "${YELLOW}❌ 4Mica Payment Service (8084) - Not responding${NC}"
fi

# Check Receipt Service
if curl -s http://localhost:8085/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ERC-8004 Receipt Service (8085) - Healthy${NC}"
else
    echo -e "${YELLOW}❌ ERC-8004 Receipt Service (8085) - Not responding${NC}"
fi

# Check AVS Orchestrator
if curl -s http://localhost:8082/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AVS Orchestrator (8082) - Healthy${NC}"
else
    echo -e "${YELLOW}❌ AVS Orchestrator (8082) - Not responding${NC}"
fi

echo ""
echo "================================================================"
echo -e "${CYAN}Process IDs${NC}"
echo "================================================================"
echo "ML Verification Agent: $ML_PID"
echo "Payment Service: $PAYMENT_PID"
echo "Receipt Service: $RECEIPT_PID"
echo "AVS Orchestrator: $AVS_PID"

echo ""
echo "================================================================"
echo -e "${CYAN}Logs${NC}"
echo "================================================================"
echo "View logs with:"
echo "  tail -f logs/ml-agent.log"
echo "  tail -f logs/payment-service.log"
echo "  tail -f logs/receipt-service.log"
echo "  tail -f logs/avs-orchestrator.log"

echo ""
echo "================================================================"
echo -e "${CYAN}API Endpoints${NC}"
echo "================================================================"
echo "AVS Orchestrator:"
echo "  POST http://localhost:8082/verify"
echo "  GET  http://localhost:8082/status/<id>"
echo "  GET  http://localhost:8082/health"
echo ""
echo "ML Verification Agent:"
echo "  POST http://localhost:8083/verify"
echo "  GET  http://localhost:8083/health"
echo ""
echo "Payment Service:"
echo "  POST http://localhost:8084/process-payment"
echo "  GET  http://localhost:8084/health"
echo ""
echo "Receipt Service:"
echo "  POST http://localhost:8085/mint-receipt"
echo "  GET  http://localhost:8085/health"

echo ""
echo "================================================================"
echo -e "${CYAN}Environment Variables${NC}"
echo "================================================================"
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OPENROUTER_API_KEY not set (using fallback mode)${NC}"
    echo "   Set with: export OPENROUTER_API_KEY='your_key'"
else
    echo -e "${GREEN}✅ OPENROUTER_API_KEY is set${NC}"
fi

if [ -z "$RPC_URL" ]; then
    echo "   RPC_URL: Using default (https://sepolia.base.org)"
else
    echo -e "${GREEN}✅ RPC_URL: $RPC_URL${NC}"
fi

echo ""
echo "================================================================"
echo -e "${GREEN}All services started! Ready for requests.${NC}"
echo "================================================================"
echo ""
echo "To stop all services, run:"
echo "  ./stop-all-services.sh"
echo ""
echo "To run end-to-end demo:"
echo "  cd demo && python3 end_to_end_demo.py"
echo ""
