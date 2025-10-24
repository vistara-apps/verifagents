# VerifAgents Live Demo Guide

**Quick reference for live demonstrations on X/Twitter or presentations**

---

## 🎬 Demo 1: Proof-of-Inference Market (2 minutes)

**What it shows**: Real AI model verification with on-chain receipts

### Setup (30 seconds)

```bash
cd modules/proof-of-inference-market

# Make sure .env is configured with:
# - OPENROUTER_API_KEY (your key)
# - WALLET_PRIVATE_KEY (test wallet)
# - RPC_URL (Base Sepolia)
```

### Run the Demo

```bash
./REAL_API_DEMO.sh
```

### What Happens

1. ✅ **4 microservices start** (AVS, ML Agent, Payments, Receipts)
2. ✅ **3 real GPT inferences**:
   - "What is 2 + 2?" → Expects "4"
   - "Capital of France?" → Expects "Paris"
   - "Is sky blue?" → Expects "Yes"
3. ✅ **Live verification** with confidence scores
4. ✅ **On-chain receipt minting** (ERC-8004)
5. ✅ **Payment processing** through smart contracts

### Key Talking Points

- "Every inference generates a verifiable receipt on Base Sepolia"
- "Confidence scores determine payment amounts"
- "Real EigenLayer AVS integration for ML verification"
- "Contract address: 0x8CbFbAc122D63B52796fbc7b967C09687Bc89BEc"
- "View receipts on BaseScan: https://sepolia.basescan.org/address/0x8CbFbAc122D63B52796fbc7b967C09687Bc89BEc"

### Expected Output

```
🔬 PROOF-OF-INFERENCE MARKET - REAL API DEMO
════════════════════════════════════════════

STEP 1: Verify Services Running
✅ AVS Orchestrator: READY
✅ ML Agent: READY (OpenRouter API active)
✅ Payment Service: READY
✅ Receipt Service: READY

STEP 2: Test Inference #1
📝 Question: What is 2 + 2?
📝 Expected: 4
✅ Valid: true
✅ Confidence: 95%
✅ Receipt ID: 123
✅ Payment: 0.001 ETH

[Similar for tests #2 and #3]

🎉 ALL TESTS PASSED!
📊 Success Rate: 100%
💰 Total Payments: 0.003 ETH
🧾 Receipts Minted: 3
```

---

## 🤖 Demo 2: Agent-to-Agent Payments (30 seconds)

**What it shows**: Trustless payments between autonomous agents

### Setup (10 seconds)

```bash
cd modules/agent-payments

# Optional: Set your own keys
export PAYER_PRIVATE_KEY="0x..."
export RECIPIENT_PRIVATE_KEY="0x..."
```

### Run the Demo

```bash
node real-two-agent-demo.js
```

### What Happens

1. ✅ **Two agents initialized** (Payer & Recipient)
2. ✅ **Collateral deposit** (0.005 ETH)
3. ✅ **Payment tab created** (credit line established)
4. ✅ **Payment signed** (EIP-712 signature)
5. ✅ **Guarantee issued** (BLS certificate)
6. ✅ **Payment claimed** (trustless remuneration)

### Key Talking Points

- "Sub-second payment guarantees with 4MICA protocol"
- "Cryptographic payment proofs with BLS signatures"
- "Agents operate autonomously without human intervention"
- "Real blockchain transactions on Holesky testnet"
- "Every payment generates ERC-8004 receipt for reputation"

### Expected Output

```
🤖 4Mica Real Two-Agent Demo
╔══════════════════════════════════════╗
║   Complete Agent-to-Agent Payments   ║
╚══════════════════════════════════════╝

🤖 Two-Agent Setup:
• Agent 1 (Payer): 0x292F0E22...
• Agent 2 (Recipient): 0x3DA623...
• Network: Holesky Testnet

✅ Payer status retrieved
✅ Recipient collateral deposited
✅ Payment tab created
✅ Payment signed (EIP-712)
✅ Payment guarantee issued (BLS)
✅ Payment claimed successfully

🎉 DEMO COMPLETE!
```

---

## 🎯 One-Liner Pitch

> "VerifAgents: Every AI action generates a verifiable on-chain receipt. Every ERC-8004 receipt is a line of real, on-chain GDP."

---

## 📊 Key Metrics to Highlight

- **2 Production Modules**: Agent Payments + Proof-of-Inference
- **Real Deployments**: Live on Base Sepolia
- **Contract Address**: 0x8CbFbAc122D63B52796fbc7b967C09687Bc89BEc
- **ERC-8004 Native**: Every action verifiable on-chain
- **Real Integrations**: 4MICA, EigenLayer AVS, OpenRouter
- **Sub-second Payments**: Instant agent-to-agent transfers
- **Autonomous Economy**: Agents earn, spend, coordinate independently

---

## 🔗 Links to Share

- **GitHub**: https://github.com/vistara-apps/verifagents
- **Contract on BaseScan**: https://sepolia.basescan.org/address/0x8CbFbAc122D63B52796fbc7b967C09687Bc89BEc
- **Setup Guide**: See SETUP.md in repo
- **Code Review**: See CODE_REVIEW_ANALYSIS.md

---

## 📱 Tweet Template

```
Just shipped VerifAgents - production-ready verifiable AI agent economy! 🤖

✅ Real EigenLayer AVS for ML verification
✅ Agent-to-agent payments with 4MICA
✅ ERC-8004 receipts = on-chain GDP
✅ Live on Base Sepolia

Every AI action = verifiable proof
Every receipt = composable reputation

Demo: [video/gif]
Code: github.com/vistara-apps/verifagents
Contract: 0x8CbFbAc122D63B52796fbc7b967C09687Bc89BEc

#AI #Ethereum #ERC8004 #VerifiableAI
```

---

## 🎥 Recording Tips

1. **Use Asciinema** for terminal recording:
   ```bash
   asciinema rec demo.cast
   # Run your demo
   # Ctrl+D to stop
   asciinema play demo.cast
   ```

2. **Convert to GIF**:
   ```bash
   # Install svg-term-cli
   npm install -g svg-term-cli

   # Convert
   cat demo.cast | svg-term --out demo.svg
   ```

3. **Screen recording**:
   - macOS: QuickTime Player → New Screen Recording
   - Windows: Windows+G (Game Bar)
   - Linux: OBS Studio

---

## ⚠️ Pre-Demo Checklist

- [ ] .env files configured with real API keys
- [ ] Test wallet has sufficient testnet ETH
- [ ] Internet connection stable
- [ ] Terminal window sized properly for recording
- [ ] Background services stopped (no port conflicts)
- [ ] Run demo once to verify it works
- [ ] Clear terminal before recording
- [ ] Have contract address ready to share

---

## 🚨 Troubleshooting During Live Demo

**If services fail to start**:
```bash
./stop-all-services.sh && ./start-all-services.sh
```

**If RPC connection fails**:
- Switch to backup RPC in .env
- Use public RPC: https://sepolia.base.org

**If demo hangs**:
- Ctrl+C to stop
- Check `logs/` directory for errors
- Restart services

**Have a backup**:
- Record a successful demo beforehand
- Keep the recording ready to show if live demo fails

---

## 🎊 After Demo

Share:
1. Recording/GIF on Twitter
2. Link to GitHub repo
3. Link to contract on BaseScan
4. Code review analysis highlights
5. Invite contributors

Follow up:
- Monitor GitHub stars/forks
- Respond to questions/issues
- Share technical deep-dives
- Build community

---

**Ready to demo!** 🚀

Good luck with your live presentation!
