# VerifAgents: Verifiable AI Agent Economy

> **Every ERC-8004 receipt is a line of real, on-chain GDP**

Production-ready system for building verifiable AI agent economies on Ethereum. Built on ERC-8004 receipts, enabling cryptographic proof of AI work, composable reputation, and autonomous economic systems.

## Core Innovation

- **Verifiable Work**: Every AI agent action generates cryptographic proof
- **Composable Reputation**: ERC-8004 receipts create cross-chain agent passports
- **Autonomous Economy**: Agents can earn, spend, and coordinate without human intervention
- **Production Ready**: Real contracts, real integrations, real value

## Production Modules

### 1. Agent-to-Agent Payments

Autonomous economy loops and value exchange system.

**Features**:
- Direct agent-to-agent payments with 4MICA integration
- Automated payment routing and verification
- Multi-token support (ETH, ERC-20)
- Payment verification and ERC-8004 receipt generation
- Economic incentive alignment

**Quick Start**:
```bash
cd modules/agent-payments

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your private key and RPC URLs

# Run real 4MICA integration demo
node real-two-agent-demo.js

# Run multi-agent collaboration demo
node multi-agent-collaboration-demo.js
```

**Key Files**:
- `src/AgentPaymentService.ts` - Core payment service
- `src/4mica-integration.ts` - 4MICA protocol integration
- `src/MultiAgentCollaboration.ts` - Multi-agent coordination
- `real-two-agent-demo.js` - Working two-agent demo
- `multi-agent-collaboration-demo.js` - Multi-agent demo

**Documentation**:
- [4MICA Integration Guide](modules/agent-payments/4MICA_INTEGRATION.md)
- [Multi-Agent Collaboration Guide](modules/agent-payments/MULTI_AGENT_COLLABORATION_GUIDE.md)
- [Demo Recording Guide](modules/agent-payments/DEMO_RECORDING_GUIDE.md)

### 2. Proof-of-Inference Market

EigenLayer AVS for ML verification and staking.

**Features**:
- Verifiable ML inference marketplace
- Validator staking and slashing mechanisms
- Challenge and dispute resolution
- Performance-based rewards
- ERC-8004 receipt generation for all inferences
- Real AVS integration with EigenLayer

**Quick Start**:
```bash
cd modules/proof-of-inference-market

# Install dependencies
npm install
pip3 install web3 requests eth-account

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run complete end-to-end demo
./REAL_API_DEMO.sh

# Or run individual components:

# 1. Start all services (AVS, ML verification, ERC-8004 receipts, 4MICA payments)
./start-all-services.sh

# 2. Test the system
python3 demo/end_to_end_demo.py

# 3. Stop services when done
./stop-all-services.sh
```

**Architecture**:
```
Proof-of-Inference Market
├── AVS Orchestrator (Go)           # EigenLayer AVS integration
├── ML Verification Agent (Python)   # Model inference validation
├── ERC-8004 Receipt Service (Python)# Cryptographic proof generation
└── 4MICA Payment Service (Python)   # Agent payment processing
```

**Key Files**:
- `deploy/foundry/src/ProofOfInferenceAVS.sol` - Main AVS contract (deployed on Base Sepolia)
- `avs-orchestrator.py` - AVS coordination service
- `agents/ml_verification_agent.py` - ML model verification
- `erc8004-receipt-service.py` - Receipt generation service
- `4mica-payment-service.py` - Payment processing
- `demo/end_to_end_demo.py` - Complete workflow demo

**Documentation**:
- [Quick Start Guide](modules/proof-of-inference-market/QUICK_START.md)
- [Real Integration README](modules/proof-of-inference-market/REAL_INTEGRATION_README.md)
- [Architecture Explained](modules/proof-of-inference-market/WHAT_WE_ACTUALLY_BUILT.md)
- [Attestation Proof Explained](modules/proof-of-inference-market/ATTESTATION_PROOF_EXPLAINED.md)
- [Demo Summary](modules/proof-of-inference-market/END_TO_END_DEMO_SUMMARY.md)

**Deployed Contracts**:
- **Base Sepolia**: `0x8CbFbAc122D63B52796fbc7b967C09687Bc89BEc`
- **Network**: Base Sepolia (Chain ID: 84532)
- [View on BaseScan](https://sepolia.basescan.org/address/0x8CbFbAc122D63B52796fbc7b967C09687Bc89BEc)

## Common Infrastructure

**@verifagents/common** - Shared utilities and ERC-8004 client

```bash
cd common
npm install
npm run build
```

**Features**:
- ERC-8004 client for receipt generation and verification
- IPFS client for decentralized storage
- Verification utilities and cryptographic helpers
- Cross-chain support utilities

## Prerequisites

- **Node.js** 18+
- **Python** 3.9+
- **Go** 1.21+ (for AVS)
- **Foundry** (for smart contract deployment)
- Ethereum wallet with testnet ETH
- RPC endpoints (Infura/Alchemy)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/verifagents.git
cd verifagents

# Install root dependencies
npm install

# Install module dependencies
cd modules/agent-payments && npm install && cd ../..
cd modules/proof-of-inference-market && npm install && cd ../..

# Install Python dependencies for proof-of-inference-market
cd modules/proof-of-inference-market
pip3 install web3 requests eth-account
cd ../..

# Setup environment files
cp .env.example .env
cp modules/agent-payments/local-4mica/.env.example modules/agent-payments/local-4mica/.env
cp modules/proof-of-inference-market/.env.example modules/proof-of-inference-market/.env
```

## Environment Configuration

Create `.env` files in each module with the following:

**modules/agent-payments/.env**:
```bash
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
```

**modules/proof-of-inference-market/.env**:
```bash
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0x8CbFbAc122D63B52796fbc7b967C09687Bc89BEc
```

## Running the System

### Agent Payments Demo

```bash
cd modules/agent-payments

# Two-agent payment flow
node real-two-agent-demo.js

# Multi-agent collaboration
node multi-agent-collaboration-demo.js

# Conceptual demo (no blockchain required)
node conceptual-two-agent-demo.js
```

### Proof-of-Inference Market Demo

```bash
cd modules/proof-of-inference-market

# Complete automated demo
./REAL_API_DEMO.sh

# Manual step-by-step:

# 1. Start services
./start-all-services.sh

# 2. In another terminal, run demo
python3 demo/end_to_end_demo.py

# 3. Stop services
./stop-all-services.sh
```

## Network Support

- **Base Sepolia** (Primary testnet) - Chain ID: 84532
- **Ethereum Sepolia** - Chain ID: 11155111
- **Optimism Sepolia** - Chain ID: 11155420

## Key Metrics

- **2 Production Modules** - Agent payments & Proof-of-Inference market
- **Real Deployments** - Live contracts on Base Sepolia
- **ERC-8004 Native** - Every action generates verifiable receipts
- **Real Integrations** - 4MICA, EigenLayer AVS, IPFS
- **End-to-End Demos** - Complete workflows ready to run

## Architecture Overview

```
VerifAgents System
│
├── Agent Payments Module
│   ├── 4MICA Integration (L2 payments)
│   ├── Multi-Agent Coordination
│   ├── Payment Verification
│   └── ERC-8004 Receipts
│
├── Proof-of-Inference Market
│   ├── EigenLayer AVS (Go)
│   ├── ML Verification (Python)
│   ├── ERC-8004 Service (Python)
│   ├── Payment Processing (Python)
│   └── Smart Contracts (Solidity)
│
└── Common Infrastructure
    ├── ERC-8004 Client
    ├── IPFS Integration
    └── Verification Utils
```

## Testing

```bash
# Test agent payments
cd modules/agent-payments
npm test

# Test proof-of-inference market
cd modules/proof-of-inference-market
python3 demo/test_ml_verification.py
python3 demo/test_blockchain_payment.py
```

## Deployment

Smart contracts are already deployed on Base Sepolia. To deploy your own:

```bash
cd modules/proof-of-inference-market/deploy/foundry

# Configure your .env
cp .env.example .env

# Deploy
forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Links

- **GitHub**: https://github.com/yourusername/verifagents
- **Documentation**: See individual module README files
- **ERC-8004 Standard**: https://eips.ethereum.org/EIPS/eip-8004

## Acknowledgments

- **Ethereum Foundation** - For ERC-8004 standard
- **EigenLayer** - For AVS infrastructure
- **4MICA** - For L2 payment protocol
- **OpenZeppelin** - For secure contract libraries

---

**Every ERC-8004 receipt is a line of real, on-chain GDP**
