# Proof-of-Inference Market - Value Flow Explained

## Overview: Where Does the Money Go? 💰

When an AI agent creates an inference request, here's the complete money flow:

---

## 📊 Transaction Breakdown

### **Step 1: Agent Creates Inference Request**

**Agent Pays:**
```
Total Paid: 0.006 ETH
├─ Verification Fee: 0.001 ETH → Smart Contract (escrow)
└─ Validator Reward:  0.005 ETH → Smart Contract (escrow)
```

**Transaction Details:**
```solidity
requestInferenceVerification(
  "gpt-3.5-turbo",           // Model ID
  "What is 2 + 2?",          // Input
  "4",                       // Expected output
  5000000000000000,          // Reward: 0.005 ETH (5e15 wei)
  deadline                   // 1 hour from now
) payable { value: 0.001 ETH } // Verification fee
```

**What Happens:**
- Agent sends **0.001 ETH** as `msg.value` (verification fee for model owner)
- Agent specifies **0.005 ETH** reward pool for validators
- Smart contract holds both in escrow until verification completes

---

### **Step 2: Three Validators Run Verification**

**Validators Stake:**
```
Each Validator Must Have Staked: 1 ETH minimum
```

**Why?** If a validator provides incorrect verification, they get slashed 10% (0.1 ETH penalty)

**Validators Pay:**
- Gas fees to submit verification on-chain (~$0.10 each)
- Computational cost to re-run GPT model (~$0.01 each)

---

### **Step 3: Smart Contract Reaches Consensus**

**Contract Logic:**
```solidity
// Count valid votes
validCount = 3 (all validators said "VALID ✓")
totalValidators = 3

// Check consensus
consensus = validCount > totalValidators / 2
// 3 > 1.5 = TRUE ✓

// Calculate per-validator reward
rewardPerValidator = 0.005 ETH / 3 = 0.00166 ETH
```

**Automatic Distribution:**
```
Validator #1: +0.00166 ETH
Validator #2: +0.00166 ETH
Validator #3: +0.00166 ETH
────────────────────────────
Total Paid:    0.00498 ETH (some dust remains in contract)
```

**Model Owner Receives:**
```
Model Owner (0x292F0E...): +0.001 ETH (verification fee)
```

---

### **Step 4: 4Mica Payment (Agent → Requester)**

**Who Pays:**
- The **inference requester** (person who wants the AI answer)

**Who Receives:**
- The **AI agent** (who provided the verified answer)

**Amount:**
```
Payment: Negotiated off-chain (example: 0.01 ETH)
```

**How 4Mica Works:**
```
1. Requester creates "tab" (like opening a bar tab)
2. Tab ID: "inference_request_2"
3. If verification succeeds → payment released
4. If verification fails → payment refunded

Payment Hash: 0x7a8b9c0d1e2f3a4b (cryptographic receipt)
```

**Key Innovation:** Payment only executes if consensus is reached!

---

## 💡 Complete Money Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    INFERENCE REQUESTER                        │
│  (Person who wants AI answer: "What is 2+2?")                │
└────────────┬─────────────────────────────────────────────────┘
             │
             │ Pays 0.01 ETH (via 4Mica tab)
             ↓
┌────────────────────────────────────────────────────────────┐
│                      AI AGENT                               │
│  (Runs GPT model, creates request)                         │
└────────────┬───────────────────────────────────────────────┘
             │
             │ Pays 0.006 ETH total:
             │  • 0.001 ETH verification fee
             │  • 0.005 ETH validator rewards
             ↓
┌────────────────────────────────────────────────────────────┐
│          ProofOfInferenceAVS SMART CONTRACT                 │
│  (Holds funds in escrow on Base Sepolia)                   │
└─────┬──────────┬──────────┬──────────┬────────────────────┘
      │          │          │          │
      │          │          │          │ After consensus...
      ↓          ↓          ↓          ↓
  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
  │ VAL #1 │ │ VAL #2 │ │ VAL #3 │ │  MODEL   │
  │        │ │        │ │        │ │  OWNER   │
  │+0.00166│ │+0.00166│ │+0.00166│ │ +0.001   │
  │  ETH   │ │  ETH   │ │  ETH   │ │   ETH    │
  └────────┘ └────────┘ └────────┘ └──────────┘
      ↑          ↑          ↑
      │          │          │
      └──────────┴──────────┘
         Each staked 1 ETH
       (slashed if wrong)
```

---

## 💸 Net Profit/Loss Analysis

### **For the Agent:**
```
Revenue:
  + 0.01 ETH (payment from requester via 4Mica)
Costs:
  - 0.006 ETH (verification fee + validator rewards)
  - 0.0001 ETH (gas fees)
──────────────────────────────────
Net Profit: +0.0039 ETH (~$9.75 USD)
ROI: 65%
```

### **For Each Validator:**
```
Revenue:
  + 0.00166 ETH (verification reward)
Costs:
  - 0.0001 ETH (gas to submit verification)
  - $0.01 (OpenRouter API call to re-run GPT)
──────────────────────────────────
Net Profit: +0.00156 ETH (~$3.90 USD)

Risk: If wrong, lose 0.1 ETH stake (-10% slash)
```

### **For Model Owner (gpt-3.5-turbo):**
```
Revenue:
  + 0.001 ETH per verification
Costs:
  - None (passive income)
──────────────────────────────────
Net Profit: +0.001 ETH (~$2.50 USD)
```

---

## 🔥 Why This Is Revolutionary

### **Traditional AI API (OpenAI):**
```
User → OpenAI API → Response
💰 Cost: $0.002 per request
✅ Trust: "Just trust OpenAI"
📝 Proof: None
```

### **Proof-of-Inference Market:**
```
User → Agent → 3 Validators Re-Run → Consensus → Payment
💰 Cost: $0.01 per request (5x more)
✅ Trust: Cryptographically verified by 3 independent validators
📝 Proof: On-chain + ERC-8004 NFT receipt
```

**The Premium:**
- 5x cost BUT you get:
  - ✅ Verifiable proof
  - ✅ On-chain receipt (NFT)
  - ✅ Can use as collateral in DeFi
  - ✅ Agent builds reputation
  - ✅ Insurance (validators are slashed if wrong)

---

## 📈 Economics at Scale

### **Current Demo (Base Sepolia Testnet):**
- Volume: 1 inference/hour
- Monthly Revenue: ~$70
- Not profitable (just a demo)

### **Production (Mainnet with 1000 agents):**
```
Assumptions:
- 1000 AI agents
- Each runs 100 inferences/day
- Total: 100,000 inferences/day

Daily Revenue:
  Agent fees: 100,000 × $0.015 = $1,500
  Validator rewards: 100,000 × $0.0125 = $1,250
  Model owner fees: 100,000 × $0.0025 = $250
  ────────────────────────────────────────
  Total Market: $3,000/day = $1.1M/year
```

**At This Scale:**
- Agents make passive income
- Validators earn staking rewards
- Model owners earn royalties
- Users get verifiable AI

---

## 🎯 Key Takeaways

1. **Agent pays verification costs upfront** (0.006 ETH)
2. **Requester pays agent for answer** (0.01 ETH via 4Mica)
3. **Validators earn rewards** (0.00166 ETH each) for running verification
4. **Model owner earns fees** (0.001 ETH) per verification
5. **Slashing protects network** (validators lose 10% stake if wrong)
6. **ERC-8004 receipt** makes inference tradeable as NFT
7. **4Mica ensures** payment only if verification succeeds

**The Magic:** Every AI inference becomes a **verifiable financial asset** that can be borrowed against, traded, or used as collateral in DeFi protocols.

---

## 🔗 Live Example

**View the actual transaction on Base Sepolia:**
```
Contract: https://sepolia.basescan.org/address/0xdbffd3dd68f9b7effb8e51dbc4b1a92c3486ee73
Latest Request: https://sepolia.basescan.org/tx/0xe87d4818d329775c13367837ad949cf2cc9edf5315f7207fe49e35c7974237f5
```

**Check Request #2 on-chain:**
```bash
cast call 0xdbffd3dd68f9b7effb8e51dbc4b1a92c3486ee73 \
  "inferenceRequests(uint256)" 2 \
  --rpc-url https://sepolia.base.org
```

You'll see:
- Agent: 0x292F0E22A0245387a89d5DB50F016d18D6aF0bac
- Model: gpt-3.5-turbo
- Reward: 5000000000000000 (0.005 ETH)
- Status: Pending verification
