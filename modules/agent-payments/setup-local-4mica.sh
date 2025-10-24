#!/bin/bash

# 4Mica Local Development Setup Script
# This script sets up a local development environment for 4Mica with Prague fork support

echo "🚀 Setting up 4Mica Local Development Environment"

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is installed"
    fi
}

echo "🔍 Checking required tools..."
check_tool "node"
check_tool "npm"
check_tool "cargo"
check_tool "git"

# Create local development directory
LOCAL_DEV_DIR="/Users/mayurchougule/development/ethereum/verifagents/modules/agent-payments/local-4mica"
mkdir -p "$LOCAL_DEV_DIR"
cd "$LOCAL_DEV_DIR"

echo "📁 Created local development directory: $LOCAL_DEV_DIR"

# Set up environment variables for 4Mica
echo "🔧 Setting up environment variables..."

cat > .env << EOF
# 4Mica Local Development Environment Variables
# Prague Fork Configuration
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_HTTP_RPC_URL=http://localhost:8545
WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
RPC_URL=http://localhost:3000

# Prague Fork Specific
PRAGUE_FORK_ENABLED=true
CHAIN_ID=1337
GAS_LIMIT=30000000
GAS_PRICE=20000000000

# 4Mica API Configuration
API_PORT=3000
API_HOST=localhost
CORS_ORIGIN=*
LOG_LEVEL=debug

# Database (if needed)
DATABASE_URL=sqlite:./4mica-local.db
EOF

echo "✅ Environment variables configured"

# Create a simple local Ethereum node setup
echo "⛓️ Setting up local Ethereum node configuration..."

cat > start-local-node.sh << 'EOF'
#!/bin/bash

# Start a local Ethereum node with Prague fork support
# This uses Hardhat or Anvil for local development

echo "🚀 Starting local Ethereum node with Prague fork support..."

# Check if Anvil is available (from Foundry)
if command -v anvil &> /dev/null; then
    echo "✅ Using Anvil (Foundry) for local node"
    anvil \
        --host 0.0.0.0 \
        --port 8545 \
        --chain-id 1337 \
        --gas-limit 30000000 \
        --gas-price 20000000000 \
        --fork-url https://eth-mainnet.g.alchemy.com/v2/demo \
        --fork-block-number 19000000 \
        --accounts 10 \
        --balance 10000 \
        --mnemonic "test test test test test test test test test test test junk"
else
    echo "❌ Anvil not found. Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
    echo "   Or install Hardhat: npm install -g hardhat"
    exit 1
fi
EOF

chmod +x start-local-node.sh

# Create a simple 4Mica API mock server
echo "🌐 Creating 4Mica API mock server..."

cat > package.json << 'EOF'
{
  "name": "4mica-local-api",
  "version": "1.0.0",
  "description": "Local 4Mica API server for development",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "ethers": "^6.8.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# Create the API server
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

// Mock 4Mica API endpoints
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: '4mica-api' });
});

app.get('/public-params', (req, res) => {
    res.json({
        chain_id: 1337,
        ethereum_http_rpc_url: process.env.ETHEREUM_HTTP_RPC_URL,
        contract_address: process.env.CONTRACT_ADDRESS
    });
});

app.post('/create-payment-tab', (req, res) => {
    const { user_address, recipient_address, ttl } = req.body;
    const tab_id = Math.floor(Math.random() * 1000000);
    
    res.json({
        tab_id: tab_id.toString(),
        user_address,
        recipient_address,
        ttl,
        status: 'created'
    });
});

app.post('/issue-guarantee', (req, res) => {
    const { claims, signature, scheme } = req.body;
    
    res.json({
        claims: claims,
        signature: signature,
        scheme: scheme,
        certificate: 'mock_bls_cert',
        public_key: 'mock_bls_pk'
    });
});

app.post('/sign-payment', (req, res) => {
    const { claims, scheme } = req.body;
    
    res.json({
        signature: '0x' + Math.random().toString(16).substr(2, 64),
        scheme: scheme || 'Eip712'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 4Mica API server running on http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   GET  /public-params`);
    console.log(`   POST /create-payment-tab`);
    console.log(`   POST /issue-guarantee`);
    console.log(`   POST /sign-payment`);
});
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ 4Mica local development environment setup complete!"
echo ""
echo "🚀 To start the development environment:"
echo "   1. Start local Ethereum node: ./start-local-node.sh"
echo "   2. Start 4Mica API server: npm start"
echo "   3. Run your visual demo: cd .. && node visual-demo.js"
echo ""
echo "📁 Environment files created:"
echo "   - .env (environment variables)"
echo "   - start-local-node.sh (Ethereum node script)"
echo "   - server.js (4Mica API mock server)"
echo ""
echo "🔧 Environment variables:"
echo "   - ETHEREUM_RPC_URL: http://localhost:8545"
echo "   - RPC_URL: http://localhost:3000"
echo "   - WALLET_PRIVATE_KEY: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "   - CONTRACT_ADDRESS: 0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"
