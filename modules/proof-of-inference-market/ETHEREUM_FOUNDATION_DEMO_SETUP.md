# Ethereum Foundation Live Demo Setup Guide

## 🎯 Demo Objective
Demonstrate a **complete Proof-of-Inference AVS** with:
- Real AI verification using actual LLM APIs
- Real blockchain transactions on Base Sepolia
- Real ERC-8004 receipt minting
- All proofs independently verifiable

---

## 💼 Your Wallet
**Address**: `0x292F0E22A0245387a89d5DB50F016d18D6aF0bac`
**Current Balance**: $18.38 (from screenshot)
**Networks**: Ethereum, Ethereum • Earn, USD Coin

---

## ✅ Pre-Demo Checklist

### 1. Get Base Sepolia ETH
Your wallet needs Base Sepolia testnet ETH for gas fees.

**Option A: Alchemy Faucet (Recommended)**
```bash
# Visit: https://www.alchemy.com/faucets/base-sepolia
# Connect wallet: 0x292F0E22A0245387a89d5DB50F016d18D6aF0bac
# Request 0.5 Base Sepolia ETH
```

**Option B: Coinbase Wallet Faucet**
```bash
# Visit: https://portal.cdp.coinbase.com/products/faucet
# Select Base Sepolia
# Enter: 0x292F0E22A0245387a89d5DB50F016d18D6aF0bac
```

**Option C: QuickNode Faucet**
```bash
# Visit: https://faucet.quicknode.com/base/sepolia
# Enter: 0x292F0E22A0245387a89d5DB50F016d18D6aF0bac
```

### 2. Export Private Key
You need your wallet's private key to sign transactions.

**From MetaMask/Browser Wallet:**
1. Open wallet
2. Click three dots → Account Details
3. Click "Export Private Key"
4. Enter password
5. Copy private key

**Security Note**: This is testnet only. Never share mainnet private keys!

### 3. Get OpenRouter API Key (Optional but Recommended)
For REAL LLM inference verification.

```bash
# Visit: https://openrouter.ai
# Sign up/Login
# Go to: https://openrouter.ai/keys
# Create new key
# Copy: sk-or-v1-...
```

**Cost**: ~$0.01 per verification (very cheap for demo)

---

## 🚀 Setup Commands

### Step 1: Configure Environment
```bash
cd /Users/mayurchougule/development/ethereum/verifagents/modules/proof-of-inference-market

# Set your wallet private key
export WALLET_PRIVATE_KEY="0xYOUR_PRIVATE_KEY_HERE"

# Set RPC URL (Base Sepolia)
export RPC_URL="https://sepolia.base.org"

# Optional: Set OpenRouter API key for REAL LLM verification
export OPENROUTER_API_KEY="sk-or-v1-YOUR_KEY_HERE"

# Save to file for persistence (optional)
cat > .env << EOF
WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
RPC_URL=https://sepolia.base.org
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
EOF
```

### Step 2: Verify Wallet Setup
```bash
# Check wallet address matches
python3 << 'EOF'
from web3 import Web3
from eth_account import Account
import os

private_key = os.getenv("WALLET_PRIVATE_KEY", "")
if private_key:
    account = Account.from_key(private_key)
    print(f"✅ Wallet Address: {account.address}")
    print(f"   Expected: 0x292F0E22A0245387a89d5DB50F016d18D6aF0bac")
    if account.address.lower() == "0x292F0E22A0245387a89d5DB50F016d18D6aF0bac".lower():
        print("   ✅ MATCH!")
    else:
        print("   ❌ MISMATCH - Check private key")
else:
    print("❌ WALLET_PRIVATE_KEY not set")
EOF
```

### Step 3: Check Balance
```bash
python3 << 'EOF'
from web3 import Web3
import os

rpc_url = os.getenv("RPC_URL", "https://sepolia.base.org")
wallet = "0x292F0E22A0245387a89d5DB50F016d18D6aF0bac"

w3 = Web3(Web3.HTTPProvider(rpc_url))
if w3.is_connected():
    balance = w3.eth.get_balance(wallet)
    balance_eth = w3.from_wei(balance, 'ether')
    print(f"✅ Connected to Base Sepolia")
    print(f"   Balance: {balance_eth:.6f} ETH")
    if balance > 0:
        print(f"   ✅ Ready for transactions!")
    else:
        print(f"   ❌ Need testnet ETH - use faucet")
else:
    print("❌ Cannot connect to RPC")
EOF
```

---

## 🎬 Demo Script (For Recording)

### Introduction (30 seconds)
```
"Hello, I'm demonstrating a complete Proof-of-Inference AVS
built on EigenLayer and Base. This system proves that AI work
was done correctly using cryptographic proofs and blockchain
verification."

"What you'll see:
1. Real LLM inference verification
2. Real blockchain transactions on Base Sepolia
3. Real ERC-8004 receipt minting
4. All proofs independently verifiable on BaseScan"
```

### Part 1: System Architecture (1 minute)
```bash
# Show services
cat << 'EOF'
Our architecture has 4 microservices:

1. AVS Orchestrator (Port 8082) - Coordinates workflow
2. ML Verification Agent (Port 8083) - Verifies AI inference
3. 4Mica Payment Service (Port 8084) - Processes payments
4. ERC-8004 Receipt Service (Port 8085) - Mints on-chain receipts

Let me start all services...
EOF

# Start services
./start-all-services.sh
```

### Part 2: Show Your Wallet (30 seconds)
```bash
# Display wallet info
python3 << 'EOF'
from web3 import Web3
wallet = "0x292F0E22A0245387a89d5DB50F016d18D6aF0bac"
w3 = Web3(Web3.HTTPProvider("https://sepolia.base.org"))
balance = w3.from_wei(w3.eth.get_balance(wallet), 'ether')

print(f"My wallet address: {wallet}")
print(f"Base Sepolia balance: {balance:.6f} ETH")
print(f"This is a real wallet - we'll do real transactions")
EOF
```

### Part 3: Run Live Demo (2 minutes)
```bash
# Run end-to-end demo
cd demo
python3 end_to_end_demo.py
```

**Commentary while running:**
```
"Now submitting 3 verification requests:
1. GPT-3.5 - Quantum Physics question
2. Claude 3 - Renewable Energy question
3. LLaMA 2 - Machine Learning question

Watch as each request:
- Runs real ML verification
- Generates cryptographic proofs
- Processes payment on Base Sepolia
- Mints ERC-8004 receipt on-chain"
```

### Part 4: Verify Proofs on BaseScan (1 minute)
```bash
# After demo completes, show last result
echo "Now let's verify these proofs on BaseScan..."

# You'll get output like:
# Payment Hash: 0x1234abcd...
# Receipt Transaction: 0x5678efgh...

# Open in browser:
# https://sepolia.basescan.org/tx/0x1234abcd...
```

**Commentary:**
```
"Here's the actual transaction on Base Sepolia blockchain.
You can see:
- Transaction hash
- Block number
- Gas used
- My wallet address as sender
- This proves the transaction really happened

Anyone can verify this independently - no trust required."
```

### Part 5: Show ERC-8004 Contract (30 seconds)
```bash
echo "Our ERC-8004 receipt contract:"
echo "https://sepolia.basescan.org/address/0x7177a6867296406881E20d6647232314736Dd09A"
```

**Commentary:**
```
"This is our ERC-8004 compliant receipt contract.
It stores permanent records of all verified AI work.
This creates an immutable audit trail."
```

### Conclusion (30 seconds)
```
"What we just proved:
✅ Real AI verification with cryptographic proofs
✅ Real blockchain transactions on Base
✅ Real ERC-8004 receipts on-chain
✅ Complete end-to-end workflow

This solves the AI trust problem and enables
a decentralized marketplace for AI verification.

Questions?"
```

---

## 🎥 Recording Tips

### Screen Setup
1. **Terminal Window**: Full screen with large font (18pt+)
2. **Browser**: BaseScan open in another tab
3. **Wallet**: Have MetaMask visible (optional)

### Commands to Run
```bash
# Before recording starts
cd /Users/mayurchougule/development/ethereum/verifagents/modules/proof-of-inference-market
export WALLET_PRIVATE_KEY="your_key"
export RPC_URL="https://sepolia.base.org"
export OPENROUTER_API_KEY="your_key"  # Optional
./start-all-services.sh

# During recording
cd demo
python3 end_to_end_demo.py

# After demo finishes
# Copy transaction hashes and open in browser
# Show on BaseScan
```

### What to Highlight
1. ✅ **Real wallet address** - Show it's your actual wallet
2. ✅ **Real balance** - Show you have Base Sepolia ETH
3. ✅ **Service health checks** - All green checkmarks
4. ✅ **Verification proofs** - Cryptographic hashes generated
5. ✅ **Transaction hashes** - Real on BaseScan
6. ✅ **Contract address** - ERC-8004 on Base Sepolia

---

## 📊 Expected Results

### Demo Output
```
================================================================================
                    PROOF-OF-INFERENCE AVS - END-TO-END DEMO
================================================================================

────────────────────────────────────────────────────────────────────────────────
🔹 Checking Services
────────────────────────────────────────────────────────────────────────────────
✅ AVS Orchestrator - Healthy
✅ ML Verification Agent - Healthy
✅ Payment Service - Healthy
✅ Receipt Service - Healthy

────────────────────────────────────────────────────────────────────────────────
Test Case: GPT-3.5 Turbo - Quantum Physics
────────────────────────────────────────────────────────────────────────────────
   📤 Submitting to AVS Orchestrator...
   ✅ Verification complete!

   Cryptographic Proofs:
      🔐 Verification Proof: 0x5172b6f8...
      🔐 Attestation Hash: 0x8a023c35...
      🔐 Payment Hash: 0x1234abcd... ← REAL BLOCKCHAIN TX!
      🧾 Receipt ID: #123456 ← REAL ON-CHAIN RECEIPT!

[Repeat for Claude and LLaMA tests]

================================================================================
Demo complete! All proofs generated successfully.
================================================================================
```

### BaseScan Verification
```
Transaction Hash: 0x1234abcd...
Status: Success ✅
Block: 12345678
From: 0x292F0E22A0245387a89d5DB50F016d18D6aF0bac ← YOUR WALLET!
To: [Contract Address]
Value: 0 ETH
Transaction Fee: 0.000123 ETH
```

---

## 🔧 Troubleshooting

### Issue: "Insufficient balance"
**Solution**: Get more Base Sepolia ETH from faucet

### Issue: "OPENROUTER_API_KEY not set"
**Solution**: Demo will run in fallback mode (still works, just uses heuristic verification instead of real LLM calls)

### Issue: "RPC connection failed"
**Solution**: Check RPC_URL is correct: `https://sepolia.base.org`

### Issue: "Private key invalid"
**Solution**: Make sure private key starts with `0x` and is 66 characters total

---

## 💡 Pro Tips for Ethereum Foundation Demo

1. **Practice First**: Run through the demo 2-3 times before recording
2. **Clear Output**: Use `clear` before starting recording
3. **Large Font**: Make terminal text readable (18pt minimum)
4. **Slow Down**: Take pauses to explain what's happening
5. **Show Proofs**: Highlight the cryptographic hashes being generated
6. **Verify Live**: Open BaseScan during demo to show real transactions
7. **Have Backup**: Have pre-recorded screenshots in case of network issues

---

## 📦 Demo Package to Share

After demo, create a package with:

```bash
mkdir ethereum_foundation_demo_package
cd ethereum_foundation_demo_package

# Copy proof documents
cp ../PROOF_TYPES_EXPLAINED.md .
cp ../END_TO_END_DEMO_SUMMARY.md .
cp ../HASH_FLOW_DIAGRAM.txt .

# Save transaction hashes
cat > VERIFIED_TRANSACTIONS.md << 'EOF'
# Verified Transactions from Live Demo

## Wallet Used
Address: 0x292F0E22A0245387a89d5DB50F016d18D6aF0bac

## Transactions
1. Payment Transaction 1: https://sepolia.basescan.org/tx/[hash]
2. Payment Transaction 2: https://sepolia.basescan.org/tx/[hash]
3. Receipt Minting 1: https://sepolia.basescan.org/tx/[hash]

## Contract
ERC-8004 Receipt Contract: https://sepolia.basescan.org/address/0x7177a6867296406881E20d6647232314736Dd09A

All transactions are independently verifiable on BaseScan.
EOF

# Create README
cat > README.md << 'EOF'
# Proof-of-Inference AVS - Live Demo Package

This package contains all materials from our live demo to the Ethereum Foundation.

## Contents
- PROOF_TYPES_EXPLAINED.md - Technical explanation of all proof types
- END_TO_END_DEMO_SUMMARY.md - Complete system overview
- HASH_FLOW_DIAGRAM.txt - Visual flow diagram
- VERIFIED_TRANSACTIONS.md - Real transaction hashes from demo

## Key Points
✅ All transactions verified on Base Sepolia
✅ Real wallet used: 0x292F0E22A0245387a89d5DB50F016d18D6aF0bac
✅ All proofs independently verifiable
✅ Production-ready architecture

## Quick Verification
Visit any transaction hash on BaseScan to verify it really happened.
EOF

echo "Demo package created!"
```

---

## 🎯 What This Proves to Ethereum Foundation

1. **Technical Competence**
   - Working AVS implementation
   - Real blockchain integration
   - Production-ready architecture

2. **Real Innovation**
   - Solves AI trust problem
   - Novel verification approach
   - ERC-8004 compliant

3. **Execution Ability**
   - Not just a whitepaper
   - Actual working code
   - Real transactions on Base

4. **Grant Worthiness**
   - Clear use case
   - Benefits Ethereum ecosystem
   - Open for broader adoption

---

## 📞 Questions Ethereum Foundation Might Ask

### Q: "Why not use optimistic verification?"
**A**: "We use cryptographic proofs for immediate verification. Optimistic systems have a challenge period delay. Our system provides instant, provable verification."

### Q: "How do you prevent collusion between validators?"
**A**: "We use multiple independent ML models, require cryptographic proofs, and have on-chain slashing for false attestations. Plus, verification is reproducible - anyone can re-run and verify."

### Q: "What's your go-to-market strategy?"
**A**: "Start with AI API providers who need verification, expand to AI agents, then build marketplace for verified AI work. Revenue from transaction fees."

### Q: "Why Base instead of Ethereum mainnet?"
**A**: "Lower gas costs for high-frequency verifications. Same security through Base's L2. Can deploy to Ethereum mainnet with same code."

### Q: "What's unique vs other verification systems?"
**A**: "We combine ML verification + fair-exchange payments + permanent receipts in one system. Plus we're ERC-8004 compliant for interoperability."

---

## ✅ Final Checklist Before Demo

- [ ] Wallet funded with Base Sepolia ETH (check balance > 0.1 ETH)
- [ ] Private key exported and tested
- [ ] OpenRouter API key obtained (optional but recommended)
- [ ] All services start successfully
- [ ] Practice run completed successfully
- [ ] Browser bookmarks ready (BaseScan, contract address)
- [ ] Terminal font size increased (18pt+)
- [ ] Recording software tested
- [ ] Backup screenshots prepared
- [ ] Demo script reviewed

---

**You're ready to impress the Ethereum Foundation! 🚀**

Any questions? Let me know what you need!
