# 🚀 Proof-of-Inference AVS - REAL INTEGRATION DEMO

**Complete end-to-end demo with REAL integrations for 100k people presentation**

## 🎯 What This Is

This is a **production-ready** Proof-of-Inference AVS system that replaces ALL mocks with real integrations:

- ✅ **Real LLM APIs** (OpenRouter - access to 100+ models)
- ✅ **Real ML Verification** (Python agents with actual similarity scoring)
- ✅ **Real 4Mica Payments** (Rust SDK integration)
- ✅ **Real ERC-8004 Receipts** (On-chain smart contract minting)
- ✅ **Real AVS Verification** (Multi-service architecture)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Demo Client   │───▶│  AVS Service    │───▶│  ML Agent       │───▶│  Real LLM APIs  │
│   (Python)      │    │  (Go :8082)     │    │  (Python :8083) │    │  (OpenAI/etc)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  4Mica Payment  │    │  ERC-8004       │
                       │  (Python :8084) │    │  (Python :8085) │
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Rust SDK       │    │  Smart Contract │
                       │  (4Mica)        │    │  (Ethereum)     │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
cd modules/proof-of-inference-market
cp .env.example .env
# Edit .env with your API keys
```

### 2. Install Dependencies

```bash
# Python dependencies
pip install openai anthropic replicate flask web3 eth-account requests

# Go dependencies (for AVS service)
go mod tidy
```

### 3. Start All Services

```bash
./start-real-demo.sh
```

### 4. Run Demo

```bash
python demo/avs_demo.py
```

## 🔧 Configuration

### Required API Keys

```bash
# .env file
OPENROUTER_API_KEY=sk-or-your-openrouter-key

# Blockchain
RPC_URL=https://holesky.infura.io/v3/your-key
WALLET_PRIVATE_KEY=0x1234...
AGENT_ID=agent_001

# Contract Addresses
ERC8004_ADDRESS=0x1234...
PROOF_OF_INFERENCE_AVS_ADDRESS=0x1234...
REWARD_TOKEN_ADDRESS=0x1234...
```

## 📋 Services

### 1. AVS Verification Service (Port 8082)
- **Language**: Go
- **Purpose**: Main verification orchestrator
- **Real Integrations**: Calls all other services
- **Endpoints**: 
  - `POST /verify` - Submit verification request
  - `GET /health` - Health check

### 2. ML Verification Agent (Port 8083)
- **Language**: Python
- **Purpose**: Real ML verification using OpenRouter API
- **Real Integrations**: OpenRouter (100+ models)
- **Features**:
  - Real similarity scoring
  - Model-specific verification methods
  - Cryptographic proof generation
  - Access to GPT-4, Claude-3, LLaMA, Mixtral, Gemini, and more

### 3. 4Mica Payment Service (Port 8084)
- **Language**: Python
- **Purpose**: Real payment processing via 4Mica
- **Real Integrations**: Rust SDK calls
- **Features**:
  - Payment tab creation
  - Real transaction processing
  - Receipt generation

### 4. ERC-8004 Receipt Service (Port 8085)
- **Language**: Python
- **Purpose**: On-chain receipt minting
- **Real Integrations**: Web3 smart contract calls
- **Features**:
  - Real contract interactions
  - Transaction confirmation
  - Receipt hash generation

## 🧪 Testing

### Test Individual Services

```bash
# Test AVS Service
curl -X POST http://localhost:8082/verify \
  -H 'Content-Type: application/json' \
  -d '{
    "requestId": 1,
    "modelId": "gpt-3.5-turbo",
    "inputData": "Hello world",
    "expectedOutput": "Hello there",
    "reward": "1000000000000000000",
    "deadline": 9999999999,
    "agent": "0x1234567890123456789012345678901234567890"
  }'

# Test ML Agent
curl -X POST http://localhost:8083/verify \
  -H 'Content-Type: application/json' \
  -d '{
    "requestId": 1,
    "modelId": "gpt-3.5-turbo",
    "inputData": "Explain quantum computing",
    "expectedOutput": "Quantum computing uses qubits"
  }'

# Test 4Mica Payment
curl -X POST http://localhost:8084/pay \
  -H 'Content-Type: application/json' \
  -d '{
    "recipientAgentId": "agent_001",
    "amount": "1.0",
    "description": "ML inference verification"
  }'

# Test ERC-8004 Receipt
curl -X POST http://localhost:8085/mint \
  -H 'Content-Type: application/json' \
  -d '{
    "agentId": "0x1234567890123456789012345678901234567890",
    "taskId": "inference_1",
    "result": {
      "requestId": 1,
      "modelId": "gpt-3.5-turbo",
      "isValid": true,
      "confidence": 85
    }
  }'
```

### Health Checks

```bash
curl http://localhost:8082/health  # AVS Service
curl http://localhost:8083/health  # ML Agent
curl http://localhost:8084/health  # 4Mica Payment
curl http://localhost:8085/health  # ERC-8004 Receipt
```

## 📊 Monitoring

### View Logs

```bash
# All services
tail -f logs/*.log

# Individual services
tail -f logs/avs-verification.log
tail -f logs/ml-agent.log
tail -f logs/4mica-payment.log
tail -f logs/erc8004-receipt.log
```

### Service Status

```bash
# Check running processes
ps aux | grep -E "(python|go)" | grep -E "(8082|8083|8084|8085)"

# Check ports
netstat -tlnp | grep -E "(8082|8083|8084|8085)"
```

## 🛑 Stopping Services

```bash
./stop-real-demo.sh
```

## 🔍 What Makes This "Real"

### 1. Real LLM APIs
- **OpenRouter**: Access to 100+ models including:
  - GPT-4, GPT-3.5-turbo (OpenAI)
  - Claude-3-opus, Claude-3-sonnet (Anthropic)
  - LLaMA-2-70b, LLaMA-3-70b (Meta)
  - Mixtral-8x7b (Mistral)
  - Gemini-Pro (Google)
  - And many more!

### 2. Real ML Verification
- **Similarity Scoring**: Actual text analysis algorithms
- **Confidence Calculation**: Model-specific verification methods
- **Cryptographic Proofs**: Real hash generation

### 3. Real 4Mica Integration
- **Rust SDK**: Actual 4Mica SDK calls
- **Payment Tabs**: Real tab creation and management
- **Transaction Processing**: Actual blockchain transactions

### 4. Real ERC-8004 Receipts
- **Smart Contracts**: Real on-chain interactions
- **Web3 Integration**: Actual Ethereum transactions
- **Receipt Minting**: Real NFT-style receipts

### 5. Real AVS Architecture
- **Microservices**: Actual distributed system
- **HTTP APIs**: Real service-to-service communication
- **Error Handling**: Production-ready error management

## 🎯 Demo Flow

1. **User submits inference request** → Demo client
2. **AVS Service receives request** → Go service (port 8082)
3. **ML Agent verifies inference** → Python service (port 8083)
   - Calls real LLM APIs (OpenAI/Anthropic/Replicate)
   - Calculates real similarity scores
   - Generates cryptographic proofs
4. **4Mica processes payment** → Python service (port 8084)
   - Creates payment tab via Rust SDK
   - Processes real transaction
5. **ERC-8004 mints receipt** → Python service (port 8085)
   - Calls smart contract
   - Mints on-chain receipt
6. **AVS returns verification** → Complete result with real data

## 🚨 Troubleshooting

### Common Issues

1. **API Key Errors**
   ```bash
   # Check .env file
   cat .env | grep API_KEY
   ```

2. **Port Conflicts**
   ```bash
   # Check what's using ports
   lsof -i :8082
   lsof -i :8083
   lsof -i :8084
   lsof -i :8085
   ```

3. **Service Not Starting**
   ```bash
   # Check logs
   tail -f logs/[service-name].log
   ```

4. **Rust SDK Issues**
   ```bash
   # Check if Rust client exists
   ls -la rust-client/
   cd rust-client && cargo build
   ```

## 🎉 Success Indicators

When everything is working, you should see:

- ✅ All 4 services running on their ports
- ✅ Real LLM responses (not simulated)
- ✅ Actual similarity scores (not hardcoded)
- ✅ Real payment processing (not mocked)
- ✅ On-chain receipt minting (not simulated)
- ✅ Complete end-to-end flow with real data

## 📈 Performance

- **LLM Inference**: 1-3 seconds (real API calls)
- **ML Verification**: < 1 second
- **4Mica Payment**: 2-5 seconds (blockchain)
- **ERC-8004 Receipt**: 10-30 seconds (blockchain)
- **Total Flow**: 15-40 seconds (real blockchain)

This is a **production-ready system** that demonstrates the complete Proof-of-Inference AVS architecture with real integrations suitable for a 100k people presentation.
