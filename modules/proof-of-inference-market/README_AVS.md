# 🧠 Proof-of-Inference AVS

**EigenLayer AVS for ML Inference Verification with Autonomous Payments**

A complete implementation of a Proof-of-Inference Market using EigenLayer's Actively Validated Services (AVS) for decentralized ML inference verification with 4Mica payments and ERC-8004 receipts.

## 🎯 Overview

The Proof-of-Inference AVS creates a decentralized marketplace where AI agents can verify their ML inference work and get paid automatically. It combines:

- **EigenLayer AVS** - Decentralized validation with staking and slashing
- **ML Verification Agents** - Python agents that validate inference requests
- **4Mica Payments** - Sub-second autonomous payments for verification rewards
- **ERC-8004 Receipts** - Verifiable proof of ML work
- **Cryptographic Proofs** - Merkle proofs for verification integrity

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Agent      │───▶│  Proof-of-       │───▶│  EigenLayer     │
│                 │    │  Inference AVS   │    │  Validators     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │  ML Verification │             │
         │              │  Agents (Python) │             │
         │              └──────────────────┘             │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  4Mica Payments │    │  ERC-8004        │    │  Trust Scores   │
│  (Sub-second)   │    │  Receipts        │    │  & Reputation   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Foundry** - For smart contract deployment
- **Go 1.21+** - For AVS performer
- **Python 3.9+** - For ML verification agents
- **Node.js 18+** - For TypeScript services

### Installation

1. **Clone and setup**:
```bash
git clone <repository>
cd modules/proof-of-inference-market
```

2. **Deploy contracts**:
```bash
cd deploy
chmod +x deploy_avs.sh
./deploy_avs.sh sepolia https://sepolia.infura.io/v3/YOUR_KEY YOUR_PRIVATE_KEY
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
go mod tidy
```

4. **Build and run**:
```bash
# Build AVS performer
go build -o bin/avs-performer cmd/main.go

# Start AVS performer
./start_avs.sh

# Start ML agent (in another terminal)
./start_ml_agent.sh

# Run demo
./run_demo.sh
```

## 📋 Core Components

### 1. Smart Contracts

#### `ProofOfInferenceAVS.sol`
- **EigenLayer AVS integration** with staking and slashing
- **Inference request management** with deadlines and rewards
- **Consensus mechanism** for multiple validator verification
- **Trust score management** for agents
- **Reward distribution** to validators

#### `InferenceMarket.sol`
- **Model registry** for ML models
- **Marketplace functionality** for inference requests
- **Challenge and dispute resolution**
- **Performance tracking** and reputation scoring

### 2. AVS Performer (Go)

#### `cmd/main.go`
- **EigenLayer AVS performer** implementation
- **Task validation** and handling
- **On-chain contract interaction**
- **HTTP API** for external integration
- **gRPC server** for EigenLayer communication

### 3. ML Verification Agents (Python)

#### `agents/ml_verification_agent.py`
- **Multi-model support** (GPT, Claude, LLaMA, BERT, ResNet)
- **Verification methods**:
  - Exact match comparison
  - Similarity threshold validation
  - Statistical analysis
  - Cross-validation
  - Adversarial testing
- **Cryptographic proof generation**
- **Confidence scoring** and quality assessment

### 4. TypeScript Services

#### `services/InferenceMarketService.ts`
- **Contract interaction** wrapper
- **ERC-8004 receipt integration**
- **4Mica payment integration**
- **Event monitoring** and indexing

## 🔧 Configuration

### Environment Variables

```bash
# Network Configuration
L1_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
L2_RPC_URL=https://base-sepolia-rpc.publicnode.com

# Contract Addresses
PROOF_OF_INFERENCE_AVS_ADDRESS=0x...
ERC8004_RECEIPT_ADDRESS=0x...
REWARD_TOKEN_ADDRESS=0x...

# AVS Configuration
AVS_NAME=proof-of-inference-avs
AVS_VERSION=1.0.0
```

### Model Registry

```json
{
  "gpt-3.5-turbo": {
    "type": "text_generation",
    "threshold": 0.85,
    "verificationFee": "1000000000000000"
  },
  "claude-3-opus": {
    "type": "text_generation", 
    "threshold": 0.88,
    "verificationFee": "1500000000000000"
  }
}
```

## 🎬 Demo Scenarios

### Scenario 1: Model Registration
```javascript
// Register ML model for verification
await avs.registerModel('gpt-3.5-turbo', '0.001'); // 0.001 ETH fee
await avs.registerModel('claude-3-opus', '0.0015');
```

### Scenario 2: Inference Verification Request
```javascript
// Agent requests ML inference verification
const requestId = await avs.requestInferenceVerification(
  'gpt-3.5-turbo',
  'Explain quantum computing',
  'Quantum computing uses qubits...',
  '0.1', // 0.1 ETH reward
  deadline
);
```

### Scenario 3: Multi-Verifier Consensus
```javascript
// Multiple verifiers validate the inference
for (const verifier of verifiers) {
  const result = await mlAgent.verifyInference(requestId);
  await avs.submitVerification(
    requestId,
    result.isValid,
    result.confidence,
    result.proof,
    result.method
  );
}
```

### Scenario 4: Payment Processing
```javascript
// AVS reaches consensus and processes payment
if (request.verified) {
  await fourMicaClient.payTab(
    tabId,
    requestId,
    request.reward,
    request.agent
  );
}
```

## 🔐 Security Features

### Cryptographic Proofs
- **Merkle proofs** for verification integrity
- **SHA-256 hashing** for proof generation
- **Digital signatures** for validator authentication

### Staking and Slashing
- **Minimum stake** requirements for validators
- **Slashing mechanisms** for incorrect verifications
- **Trust score management** for agents

### Consensus Mechanism
- **Multi-validator consensus** (minimum 3 validators)
- **Confidence-weighted** verification results
- **Dispute resolution** for contested results

## 📊 Performance Metrics

### Verification Speed
- **Sub-second consensus** using EigenLayer
- **Parallel processing** across multiple validators
- **Efficient batching** for multiple verifications

### Cost Efficiency
- **4Mica payments** for low-cost transactions
- **Gas optimization** in smart contracts
- **Batched operations** to reduce costs

### Scalability
- **EigenLayer scaling** capabilities
- **Model diversity** support
- **Cross-chain compatibility**

## 🎯 Use Cases

### 1. AI Agent ML Work Verification
- Agents submit ML inference work for verification
- Multiple validators validate the work
- Successful verification triggers automatic payment

### 2. ML Model Performance Tracking
- Track model accuracy over time
- Build reputation for high-quality models
- Enable model selection based on performance

### 3. Decentralized ML Marketplace
- Create market for ML verification services
- Enable trustless ML work validation
- Build autonomous ML agent economies

## 🔮 Future Enhancements

### Advanced Verification Methods
- **Zero-Knowledge Proofs** for privacy-preserving verification
- **Federated Learning** for distributed model training
- **Adversarial Testing** for robustness verification

### Cross-Chain Integration
- **Multi-chain support** across different blockchains
- **Cross-chain payments** for seamless transactions
- **Universal verification** from any chain

### Advanced ML Features
- **Model versioning** and update tracking
- **A/B testing** for model comparison
- **Performance analytics** and detailed metrics

## 🛠️ Development

### Running Tests
```bash
# Smart contract tests
forge test

# Go tests
go test ./...

# Python tests
python -m pytest tests/
```

### Building
```bash
# Build contracts
forge build

# Build AVS performer
go build -o bin/avs-performer cmd/main.go

# Build TypeScript services
npm run build
```

### Deployment
```bash
# Deploy to testnet
./deploy/deploy_avs.sh sepolia

# Deploy to mainnet
./deploy/deploy_avs.sh mainnet
```

## 📚 API Reference

### AVS Performer API

#### POST `/verify`
Submit inference verification request

```json
{
  "requestId": 1,
  "modelId": "gpt-3.5-turbo",
  "inputData": "Explain quantum computing",
  "expectedOutput": "Quantum computing uses qubits...",
  "reward": "1000000000000000000",
  "deadline": 1640995200,
  "agent": "0x1234..."
}
```

#### GET `/health`
Health check endpoint

### ML Agent API

#### Command Line
```bash
python ml_verification_agent.py '{"requestId": 1, "modelId": "gpt-3.5-turbo", ...}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [Link to docs]
- **Discord**: [Link to Discord]
- **GitHub Issues**: [Link to issues]

---

**Built with ❤️ for the decentralized AI future**