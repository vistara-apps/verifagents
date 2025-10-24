# Start the REAL EigenLayer DevKit AVS

## 🚨 Current Issue

You have a **real EigenLayer DevKit AVS** in Go (`deploy/main.go`) that is **NOT running**.

Instead, a simple Python REST API wrapper (`avs-orchestrator.py`) is running on port 8082.

---

## ✅ How to Run the Real Go AVS

### Step 1: Set Environment Variables

```bash
cd /Users/mayurchougule/development/ethereum/verifagents/modules/proof-of-inference-market/deploy

# Create .env file
cat > .env << 'EOF'
# RPC URLs
L1_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
L2_RPC_URL=https://sepolia.base.org

# Contract Addresses (need to be deployed)
PROOF_OF_INFERENCE_AVS_ADDRESS=0xYourAVSContractAddress
ERC8004_RECEIPT_ADDRESS=0x7177a6867296406881E20d6647232314736Dd09A
REWARD_TOKEN_ADDRESS=0xYourRewardTokenAddress

# Wallet
WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
EOF
```

### Step 2: Build and Run Go AVS

```bash
# Install dependencies
go mod download

# Build
go build -o avs-server main.go

# Run
./avs-server
```

Expected output:
```
✅ Loaded .env file
INFO  Starting HTTP server on :8082
INFO  Starting gRPC server on :8081
INFO  TaskWorker initialized
      avs=0xYourAVSContractAddress
      receipt=0x7177a6867296406881E20d6647232314736Dd09A
```

---

## 🔧 What the Go AVS Does (vs Python Orchestrator)

### Go AVS (`main.go`):
1. **On-Chain Validation**:
   - Calls `getInferenceRequest(requestId)` on smart contract
   - Checks `getAgentTrustScore(agent)` - requires score >= 100
   - Validates `getModelInfo(modelId)` - checks if active

2. **ML Verification**:
   - Line 382-405: Calls Python ML agents via HTTP
   - Or runs verification internally

3. **Proof Generation**:
   - Line 407-422: Generates cryptographic proof
   - Line 424-439: Creates AVS attestation hash

4. **EigenLayer Integration**:
   - Line 631-637: gRPC server for EigenLayer middleware
   - Line 640-648: HTTP server for direct access

### Python Orchestrator (`avs-orchestrator.py`):
1. ❌ No on-chain validation
2. ❌ No agent trust score checks
3. ❌ No model status verification
4. ❌ Just forwards HTTP requests
5. ❌ No real EigenLayer integration

---

## 📊 Architecture Comparison

### With Python Orchestrator (Current):
```
Request → avs-orchestrator.py (8082)
            ├─→ ML Agent (8083) [Mock mode]
            ├─→ Payment (8084) [Not called if invalid]
            └─→ Receipt (8085) [Not called if invalid]

Result: Off-chain only, no validation
```

### With Go AVS (Correct):
```
Request → main.go (8082 HTTP + 8081 gRPC)
            ├─→ Check Smart Contract (on-chain validation)
            │     ├─→ getInferenceRequest()
            │     ├─→ getAgentTrustScore()
            │     └─→ getModelInfo()
            ├─→ Call ML Agent (8083) [Real verification]
            ├─→ Generate Proof (cryptographic)
            └─→ Create AVS Attestation (EigenLayer)

Result: Full on-chain validation + real AVS attestation
```

---

## 🎯 Why This Matters for Ethereum Foundation Demo

### Current Demo Shows:
- ❌ Simple REST API wrapper
- ❌ No actual EigenLayer integration
- ❌ No on-chain contract calls
- ❌ No agent validation
- ❌ Not using DevKit at all

### With Go AVS, Demo Would Show:
- ✅ Real EigenLayer DevKit AVS
- ✅ On-chain smart contract validation
- ✅ Agent trust score verification
- ✅ Model registry checks
- ✅ Proper AVS attestations
- ✅ Both gRPC and HTTP interfaces

---

## 🔧 Integration Plan

### Option 1: Replace Python Orchestrator with Go AVS

```bash
# Stop Python services
./stop-all-services.sh

# Start Go AVS
cd deploy
./avs-server &

# Start Python agents (keep these)
cd ..
python3 python-ml-agent.py &  # Port 8083
python3 4mica-payment-service.py &  # Port 8084
python3 erc8004-receipt-service.py &  # Port 8085
```

### Option 2: Run Both (Different Ports)

```bash
# Go AVS on 8081 (gRPC) + 8082 (HTTP)
cd deploy && ./avs-server &

# Python orchestrator on 8086
cd .. && python3 avs-orchestrator.py --port 8086 &

# Python agents stay the same
python3 python-ml-agent.py &  # 8083
python3 4mica-payment-service.py &  # 8084
python3 erc8004-receipt-service.py &  # 8085
```

---

## 📝 What Needs to be Deployed

For the Go AVS to work properly, you need:

### 1. AVS Smart Contract
Location: `deploy/contracts/ProofOfInferenceAVS.sol`

Functions needed:
- `getInferenceRequest(uint256 requestId)`
- `getAgentTrustScore(address agent)`
- `getModelInfo(string modelId)`

### 2. Deploy Script
```bash
cd deploy/contracts
forge build
forge script script/Deploy.s.sol --rpc-url $L1_RPC_URL --broadcast
```

### 3. Update .env with deployed addresses

---

## 🚀 Quick Start (Modified Demo)

### Step 1: Deploy Contracts (if not done)
```bash
cd deploy/contracts
forge build
# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url $L1_RPC_URL --broadcast
```

### Step 2: Configure Go AVS
```bash
cd deploy
# Update .env with deployed contract addresses
export $(cat .env | xargs)
```

### Step 3: Build and Run
```bash
go build -o avs-server main.go
./avs-server &
```

### Step 4: Start Python Agents
```bash
cd ..
python3 python-ml-agent.py &
python3 4mica-payment-service.py &
python3 erc8004-receipt-service.py &
```

### Step 5: Test
```bash
curl -X POST http://localhost:8082/verify \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": 1,
    "modelId": "gpt-3.5-turbo",
    "inputData": "test",
    "expectedOutput": "test",
    "reward": "1000000000000000000",
    "deadline": 9999999999,
    "agent": "0x1234567890123456789012345678901234567890"
  }'
```

---

## 🎬 For Ethereum Foundation Demo

### Current State:
"We have a Python REST API that forwards requests to microservices"
- Not impressive for EigenLayer

### With Go AVS:
"We have a complete EigenLayer AVS with on-chain validation, agent trust scoring, and proper attestations"
- **This is what they want to see!**

---

## ⚠️ Current Blockers

1. **Contracts Not Deployed**: Need to deploy AVS contract to Sepolia
2. **Missing RPC Keys**: Need Alchemy/Infura key for Sepolia
3. **Integration Needed**: Go AVS needs to call Python ML agents

---

## 💡 Quick Fix for Demo

If you don't have time to deploy contracts, you can:

1. **Mock the contract calls** in `main.go`
2. **Show the code** that would call contracts
3. **Explain** this is the DevKit AVS architecture
4. **Demonstrate** the Python agents still work

The architecture is solid - just needs contract deployment!

---

## 📞 Summary

**Current**: Python REST wrapper (not using DevKit)
**Should Be**: Go EigenLayer AVS with on-chain validation
**Impact**: HUGE difference for Ethereum Foundation demo

The Go AVS is **production-quality code** but it's **not running**!
