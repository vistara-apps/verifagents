#!/bin/bash

# Proof-of-Inference AVS Deployment Script
# Deploys the complete AVS system with contracts and services

set -e

echo "🚀 Deploying Proof-of-Inference AVS"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${1:-"sepolia"}
RPC_URL=${2:-"https://sepolia.infura.io/v3/YOUR_INFURA_KEY"}
PRIVATE_KEY=${3:-"YOUR_PRIVATE_KEY"}

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Network: $NETWORK"
echo "   RPC URL: $RPC_URL"
echo "   Private Key: ${PRIVATE_KEY:0:10}..."
echo

# Check dependencies
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"

if ! command -v forge &> /dev/null; then
    echo -e "${RED}❌ Foundry not found. Please install Foundry first.${NC}"
    echo "   Run: curl -L https://foundry.paradigm.xyz | bash"
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go not found. Please install Go 1.21+ first.${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Please install Python 3.9+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies found${NC}"

# Create deployment directory
echo -e "${YELLOW}📁 Setting up deployment directory...${NC}"
mkdir -p deploy/contracts
mkdir -p deploy/agents
mkdir -p deploy/config

# Copy contracts
echo -e "${YELLOW}📋 Copying contracts...${NC}"
cp src/contracts/ProofOfInferenceAVS.sol deploy/contracts/
cp src/contracts/InferenceMarket.sol deploy/contracts/

# Copy agents
echo -e "${YELLOW}🤖 Copying ML agents...${NC}"
cp agents/ml_verification_agent.py deploy/agents/
cp -r agents/__pycache__ deploy/agents/ 2>/dev/null || true

# Copy Go AVS performer
echo -e "${YELLOW}🔧 Copying AVS performer...${NC}"
cp cmd/main.go deploy/
cp go.mod deploy/ 2>/dev/null || true
cp go.sum deploy/ 2>/dev/null || true

# Create deployment configuration
echo -e "${YELLOW}⚙️ Creating deployment configuration...${NC}"
cat > deploy/config/deployment.json << EOF
{
  "network": "$NETWORK",
  "rpcUrl": "$RPC_URL",
  "privateKey": "$PRIVATE_KEY",
  "contracts": {
    "rewardToken": "0x0000000000000000000000000000000000000000",
    "eigenLayerRegistry": "0x0000000000000000000000000000000000000000",
    "erc8004Registry": "0x0000000000000000000000000000000000000000"
  },
  "services": {
    "avsPerformer": {
      "port": 8081,
      "httpPort": 8082
    },
    "mlAgent": {
      "models": [
        "gpt-3.5-turbo",
        "claude-3-opus", 
        "llama-2-70b"
      ]
    }
  }
}
EOF

# Create environment file
echo -e "${YELLOW}🔐 Creating environment file...${NC}"
cat > deploy/.env << EOF
# Network Configuration
L1_RPC_URL=$RPC_URL
L2_RPC_URL=https://base-sepolia-rpc.publicnode.com

# Contract Addresses (will be updated after deployment)
PROOF_OF_INFERENCE_AVS_ADDRESS=
ERC8004_RECEIPT_ADDRESS=
REWARD_TOKEN_ADDRESS=

# AVS Configuration
AVS_NAME=proof-of-inference-avs
AVS_VERSION=1.0.0
AVS_DESCRIPTION=ML Inference Verification AVS

# ML Agent Configuration
ML_AGENT_NAME=MLVerificationAgent
ML_AGENT_DOMAIN=verifier.proofofinference.xyz
EOF

# Deploy contracts
echo -e "${YELLOW}📜 Deploying contracts...${NC}"
cd deploy

# Create Foundry project structure
mkdir -p contracts
mkdir -p script
mkdir -p test

# Copy contracts to Foundry structure
cp contracts/ProofOfInferenceAVS.sol contracts/
cp contracts/InferenceMarket.sol contracts/

# Create deployment script
cat > script/DeployProofOfInferenceAVS.s.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/ProofOfInferenceAVS.sol";

contract DeployProofOfInferenceAVS is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address rewardToken = vm.envAddress("REWARD_TOKEN_ADDRESS");
        address eigenLayerRegistry = vm.envAddress("EIGENLAYER_REGISTRY_ADDRESS");
        address erc8004Registry = vm.envAddress("ERC8004_RECEIPT_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        ProofOfInferenceAVS avs = new ProofOfInferenceAVS(
            rewardToken,
            eigenLayerRegistry,
            erc8004Registry
        );
        
        vm.stopBroadcast();
        
        console.log("ProofOfInferenceAVS deployed at:", address(avs));
    }
}
EOF

# Create foundry.toml
cat > foundry.toml << EOF
[profile.default]
src = "contracts"
out = "out"
libs = ["lib"]
solc = "0.8.19"
optimizer = true
optimizer_runs = 200
via_ir = false
verbosity = 2

[rpc_endpoints]
sepolia = "$RPC_URL"
mainnet = "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"

[etherscan]
sepolia = { key = "YOUR_ETHERSCAN_API_KEY" }
mainnet = { key = "YOUR_ETHERSCAN_API_KEY" }
EOF

echo -e "${BLUE}📋 Contract deployment ready${NC}"
echo "   To deploy contracts, run:"
echo "   forge script script/DeployProofOfInferenceAVS.s.sol:DeployProofOfInferenceAVS --rpc-url $RPC_URL --broadcast --verify"
echo

# Setup Python environment
echo -e "${YELLOW}🐍 Setting up Python environment...${NC}"
cat > requirements.txt << EOF
torch>=2.0.0
transformers>=4.30.0
scikit-learn>=1.3.0
numpy>=1.24.0
requests>=2.31.0
asyncio
EOF

echo -e "${BLUE}📋 Python requirements ready${NC}"
echo "   To install dependencies, run:"
echo "   pip install -r requirements.txt"
echo

# Setup Go environment
echo -e "${YELLOW}🔧 Setting up Go environment...${NC}"
if [ ! -f go.mod ]; then
    go mod init proof-of-inference-avs
fi

echo -e "${BLUE}📋 Go environment ready${NC}"
echo "   To build AVS performer, run:"
echo "   go mod tidy && go build -o bin/avs-performer cmd/main.go"
echo

# Create startup scripts
echo -e "${YELLOW}🚀 Creating startup scripts...${NC}"

# AVS Performer startup script
cat > start_avs.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Proof-of-Inference AVS Performer"
export L1_RPC_URL=$L1_RPC_URL
export L2_RPC_URL=$L2_RPC_URL
export PROOF_OF_INFERENCE_AVS_ADDRESS=$PROOF_OF_INFERENCE_AVS_ADDRESS
export ERC8004_RECEIPT_ADDRESS=$ERC8004_RECEIPT_ADDRESS
export REWARD_TOKEN_ADDRESS=$REWARD_TOKEN_ADDRESS

./bin/avs-performer
EOF
chmod +x start_avs.sh

# ML Agent startup script
cat > start_ml_agent.sh << 'EOF'
#!/bin/bash
echo "🤖 Starting ML Verification Agent"
cd agents
python3 ml_verification_agent.py
EOF
chmod +x start_ml_agent.sh

# Demo script
cat > run_demo.sh << 'EOF'
#!/bin/bash
echo "🎬 Running Proof-of-Inference AVS Demo"
cd demo
python3 avs_demo.py
EOF
chmod +x run_demo.sh

echo -e "${GREEN}✅ Deployment setup complete!${NC}"
echo
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Update contract addresses in .env file after deployment"
echo "2. Install Python dependencies: pip install -r requirements.txt"
echo "3. Build Go AVS performer: go mod tidy && go build -o bin/avs-performer cmd/main.go"
echo "4. Start AVS performer: ./start_avs.sh"
echo "5. Start ML agent: ./start_ml_agent.sh"
echo "6. Run demo: ./run_demo.sh"
echo
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "   • Set proper contract addresses in .env"
echo "   • Fund the contracts with reward tokens"
echo "   • Configure EigenLayer registry addresses"
echo "   • Set up proper RPC endpoints"
echo
echo -e "${GREEN}🎉 Proof-of-Inference AVS is ready for deployment!${NC}"