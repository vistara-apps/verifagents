#!/bin/bash

echo "🚀 Starting Proof-of-Inference AVS - REAL INTEGRATION DEMO"
echo "=========================================================="
echo "This will start all services with REAL integrations:"
echo "  - AVS Verification Service (Port 8082)"
echo "  - Python ML Agent (Port 8083)" 
echo "  - 4Mica Payment Service (Port 8084)"
echo "  - ERC-8004 Receipt Service (Port 8085)"
echo "=========================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file with default values..."
    cat > .env << EOF
# API Keys (REQUIRED - Replace with your actual keys)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Blockchain Configuration - Base Sepolia
RPC_URL=https://sepolia.base.org
WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
AGENT_ID=agent_001

# Contract Addresses - Base Sepolia
ERC8004_ADDRESS=0x7177a6867296406881E20d6647232314736Dd09A
PROOF_OF_INFERENCE_AVS_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
REWARD_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
EOF
    echo "❌ Please edit .env file with your actual API keys and addresses!"
    echo "   Then run this script again."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if required API keys are set (optional for demo)
if [ "$OPENROUTER_API_KEY" = "your_openrouter_api_key_here" ]; then
    echo "⚠️  OpenRouter API key not set - using mock responses for demo"
    echo "   Set OPENROUTER_API_KEY in .env for real LLM calls"
fi

echo "✅ Environment variables loaded"

# Create logs directory
mkdir -p logs

# Function to start service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    
    echo "🚀 Starting $name on port $port..."
    nohup $command > logs/${name}.log 2>&1 &
    local pid=$!
    echo $pid > logs/${name}.pid
    echo "   PID: $pid"
    
    # Wait a moment for service to start
    sleep 2
    
    # Check if service is running
    if ps -p $pid > /dev/null; then
        echo "   ✅ $name started successfully"
    else
        echo "   ❌ $name failed to start (check logs/${name}.log)"
        return 1
    fi
}

# Start all services
echo ""
echo "🔄 Starting services..."

# 1. Start Python ML Agent
start_service "ml-agent" "/opt/homebrew/Caskroom/miniconda/base/envs/z-agents/bin/python3 python-ml-agent.py" "8083"
if [ $? -ne 0 ]; then
    echo "❌ Failed to start ML Agent"
    exit 1
fi

# 2. Start 4Mica Payment Service  
start_service "4mica-payment" "/opt/homebrew/Caskroom/miniconda/base/envs/z-agents/bin/python3 4mica-payment-service.py" "8084"
if [ $? -ne 0 ]; then
    echo "❌ Failed to start 4Mica Payment Service"
    exit 1
fi

# 3. Start Real ERC-8004 Integration Service
start_service "erc8004-integration" "/opt/homebrew/Caskroom/miniconda/base/envs/z-agents/bin/python3 real-erc8004-integration.py" "8085"
if [ $? -ne 0 ]; then
    echo "❌ Failed to start Real ERC-8004 Integration Service"
    exit 1
fi

# 4. Start AVS Verification Service (Go)
start_service "avs-verification" "go run main.go" "8082"
if [ $? -ne 0 ]; then
    echo "❌ Failed to start AVS Verification Service"
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📋 Service Status:"
echo "   AVS Verification:  http://localhost:8082"
echo "   ML Agent:          http://localhost:8083" 
echo "   4Mica Payment:     http://localhost:8084"
echo "   ERC-8004 Receipt:  http://localhost:8085"
echo ""
echo "🧪 Test the system:"
echo "   curl -X POST http://localhost:8082/verify \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"requestId\":1,\"modelId\":\"gpt-3.5-turbo\",\"inputData\":\"Hello world\",\"expectedOutput\":\"Hello there\",\"reward\":\"1000000000000000000\",\"deadline\":9999999999,\"agent\":\"0x1234567890123456789012345678901234567890\"}'"
echo ""
echo "📊 Monitor logs:"
echo "   tail -f logs/*.log"
echo ""
echo "🛑 Stop all services:"
echo "   ./stop-real-demo.sh"
echo ""

# Keep script running and show status
while true; do
    echo "⏰ $(date) - Services running..."
    sleep 30
done
