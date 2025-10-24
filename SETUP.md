# VerifAgents Setup Guide

Complete setup instructions for running the VerifAgents system locally and for live demos.

## Quick Start (5 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/vistara-apps/verifagents.git
cd verifagents

# 2. Install dependencies
npm install
cd modules/proof-of-inference-market && pip3 install -r requirements.txt && cd ../..

# 3. Setup environment variables
cp modules/proof-of-inference-market/.env.example modules/proof-of-inference-market/.env
cp modules/agent-payments/local-4mica/.env.example modules/agent-payments/local-4mica/.env

# 4. Edit .env files with your API keys (see below)

# 5. Run the demo!
cd modules/proof-of-inference-market
./REAL_API_DEMO.sh
```

## Prerequisites

### Required Software

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Go** 1.21+ (for AVS)
- **Foundry** (for smart contracts)
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

### Required Accounts & API Keys

1. **OpenRouter API Key** (for ML verification)
   - Sign up at: https://openrouter.ai/keys
   - Cost: ~$5 for testing (pay-as-you-go)

2. **Ethereum Wallet**
   - Create a new wallet for testing
   - Get testnet ETH from:
     - Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
     - Holesky: https://faucet.quicknode.com/ethereum/holesky

3. **RPC Endpoints** (optional - free tier works)
   - Alchemy: https://www.alchemy.com/
   - Infura: https://infura.io/

4. **Pinata IPFS** (optional - for IPFS uploads)
   - Sign up at: https://www.pinata.cloud/

---

## Module 1: Proof-of-Inference Market

### Environment Setup

1. **Copy the example environment file**:
   ```bash
   cd modules/proof-of-inference-market
   cp .env.example .env
   ```

2. **Edit `.env` file** with your credentials:
   ```bash
   # Required: Get from https://openrouter.ai/keys
   OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE

   # Required: Your wallet private key (USE A TEST WALLET!)
   WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

   # Optional: Custom RPC (default works fine)
   RPC_URL=https://sepolia.base.org

   # Optional: Pinata for IPFS (not required for demo)
   PINATA_API_KEY=your_key_here
   PINATA_API_SECRET=your_secret_here
   ```

   **⚠️ SECURITY WARNING**:
   - NEVER commit your `.env` file
   - Use a test wallet with small amounts only
   - The private key in `.env.example` is for reference only

3. **Install Python dependencies**:
   ```bash
   pip3 install -r requirements.txt
   ```

### Running the Demo

#### Option A: Automated Full Demo (Recommended)

```bash
cd modules/proof-of-inference-market
./REAL_API_DEMO.sh
```

This script will:
1. ✅ Start all services (AVS, ML agent, ERC-8004, payments)
2. ✅ Run 3 test inferences with real GPT models
3. ✅ Verify outputs and generate receipts
4. ✅ Process payments
5. ✅ Display results with live blockchain links

**Demo runs for ~2 minutes** and shows real outputs.

#### Option B: Manual Service Control

**Start all services**:
```bash
./start-all-services.sh
```

Services will run on:
- AVS Orchestrator: `http://localhost:8082`
- ML Verification: `http://localhost:8083`
- Payment Service: `http://localhost:8084`
- ERC-8004 Receipts: `http://localhost:8085`

**Run tests manually**:
```bash
# Test ML verification
python3 demo/test_ml_verification.py

# Test blockchain payment
python3 demo/test_blockchain_payment.py

# Full end-to-end
python3 demo/end_to_end_demo.py
```

**Stop all services**:
```bash
./stop-all-services.sh
```

### Troubleshooting

**Issue**: "OpenRouter API key not found"
- **Solution**: Make sure `OPENROUTER_API_KEY` is set in `.env`

**Issue**: "Connection refused" errors
- **Solution**: Services may still be starting. Wait 10 seconds and try again

**Issue**: "Insufficient funds"
- **Solution**: Get testnet ETH from Base Sepolia faucet

**Issue**: Port already in use
- **Solution**: Kill existing services with `./stop-all-services.sh`

---

## Module 2: Agent-to-Agent Payments

### Rust Client Setup

The payment demos require the 4MICA Rust client:

```bash
cd modules/agent-payments/rust-client

# Build the Rust client (one-time setup)
cargo build --release

# Verify build
ls -la target/release/fourmica-client
```

### Environment Setup

```bash
cd modules/agent-payments
```

The demo uses environment variables for configuration:

```bash
# Set your private keys (or use defaults for testing)
export PAYER_PRIVATE_KEY="0xYOUR_PAYER_KEY"
export RECIPIENT_PRIVATE_KEY="0xYOUR_RECIPIENT_KEY"
export RPC_URL="https://api.4mica.xyz"
export CONTRACT_ADDRESS="0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9"
```

### Running the Demo

```bash
node real-two-agent-demo.js
```

This demonstrates:
1. ✅ Two agents with separate wallets
2. ✅ Collateral deposit
3. ✅ Payment tab creation
4. ✅ EIP-712 signature generation
5. ✅ BLS certificate issuance
6. ✅ Trustless remuneration

**Demo completes in ~30 seconds**.

### Alternative Demos

**Multi-agent collaboration** (3+ agents):
```bash
node multi-agent-collaboration-demo.js
```

**Conceptual flow** (no blockchain):
```bash
node conceptual-two-agent-demo.js
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Generate new private keys (never reuse test keys)
- [ ] Rotate all API keys
- [ ] Set up proper key management (AWS KMS, HashiCorp Vault, etc.)
- [ ] Configure proper RPC endpoints (not free tier)
- [ ] Set up monitoring and alerting
- [ ] Run full test suite
- [ ] Review smart contract audits
- [ ] Configure rate limiting
- [ ] Set up logging and analytics
- [ ] Document incident response procedures

---

## Troubleshooting Common Issues

### All Modules

**Problem**: `command not found: node`
```bash
# Install Node.js 18+
brew install node@18  # macOS
# or
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs  # Ubuntu/Debian
```

**Problem**: `command not found: python3`
```bash
# Install Python 3.9+
brew install python@3.9  # macOS
# or
sudo apt-get install python3.9  # Ubuntu/Debian
```

**Problem**: Module not found errors
```bash
# Reinstall dependencies
npm install
pip3 install -r requirements.txt
```

### Network Issues

**Problem**: RPC connection errors
- Check your internet connection
- Verify RPC URL is correct
- Try alternative RPC endpoints
- Check if you've hit rate limits

**Problem**: Transaction fails
- Ensure wallet has sufficient testnet ETH
- Check gas price settings
- Verify contract addresses are correct

### Demo Failures

**Problem**: Services won't start
```bash
# Check what's using the ports
lsof -i :8082 -i :8083 -i :8084 -i :8085

# Kill processes if needed
./stop-all-services.sh

# Start again
./start-all-services.sh
```

**Problem**: "Mock mode" warning
- Verify OpenRouter API key is set correctly in `.env`
- Restart services after setting the key

---

## Getting Help

- **Issues**: https://github.com/vistara-apps/verifagents/issues
- **Documentation**: See README.md and individual module READMEs
- **Code Review**: See CODE_REVIEW_ANALYSIS.md for detailed analysis

---

## Next Steps

Once you have the demos running:

1. **Explore the Code**: Review the architecture in CODE_REVIEW_ANALYSIS.md
2. **Run Tests**: Execute the test suites in each module
3. **Customize**: Modify the demos for your use case
4. **Deploy**: Follow production deployment checklist
5. **Integrate**: Add VerifAgents to your application

---

## Architecture Overview

```
VerifAgents System
│
├── Proof-of-Inference Market
│   ├── AVS Orchestrator (Python) ──> Coordinates verification
│   ├── ML Agent (Python) ──────────> Verifies model outputs
│   ├── Payment Service (Python) ───> Processes payments
│   └── ERC-8004 Service (Python) ──> Mints receipts on-chain
│
└── Agent-to-Agent Payments
    ├── 4MICA Client (Rust) ────────> Payment protocol
    ├── Payment Service (TypeScript) > High-level API
    └── Multi-Agent (TypeScript) ───> Coordination layer
```

**Every action generates an ERC-8004 receipt = Verifiable on-chain GDP**

---

**Ready to demo?** Start with `./REAL_API_DEMO.sh` in proof-of-inference-market! 🚀
