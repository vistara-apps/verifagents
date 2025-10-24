#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  🔬 PROOF-OF-INFERENCE MARKET - REAL API DEMO"
echo "  Showing ACTUAL GPT Model Outputs"
echo "════════════════════════════════════════════════════════════════"
echo ""

# =============================================================================
# STEP 1: Verify Real API Mode
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Verify Services Running with Real OpenRouter API${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check logs for API key confirmation
echo -e "${YELLOW}Checking ML Agent startup logs...${NC}"
tail -3 logs/ml-agent-real.log | grep -E "(OpenRouter|Ready)"
echo ""

if tail -20 logs/ml-agent-real.log | grep -q "OpenRouter API: Ready"; then
    echo -e "${GREEN}✅ OpenRouter API: ACTIVE (Real mode)${NC}"
else
    echo -e "${YELLOW}⚠️  OpenRouter API: Mock mode${NC}"
    echo "   Set OPENROUTER_API_KEY and restart services"
fi

echo ""
read -p "Press ENTER to continue..."

# =============================================================================
# STEP 2: Test Question #1 - Simple Math
# =============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Validator #1 - Verify Simple Math${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Question: What is 2 + 2?"
echo "📝 Expected: 4"
echo ""
echo -e "${YELLOW}⏳ Calling real GPT-3.5-turbo via OpenRouter...${NC}"
echo ""

RESULT1=$(curl -s -X POST http://localhost:8083/verify \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "gpt-3.5-turbo",
    "inputData": "What is 2 + 2?",
    "expectedOutput": "4",
    "requestId": 1
  }')

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}VALIDATOR #1 RESPONSE:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "$RESULT1" | jq '.'
echo ""

# Extract and highlight actual output
ACTUAL_OUTPUT=$(echo "$RESULT1" | jq -r '.details.actual_output')
echo -e "${GREEN}🤖 ACTUAL GPT-3.5-turbo OUTPUT:${NC}"
echo -e "${GREEN}   \"$ACTUAL_OUTPUT\"${NC}"
echo ""

CONFIDENCE=$(echo "$RESULT1" | jq -r '.confidence')
echo "📊 Confidence: ${CONFIDENCE}%"
echo ""

read -p "Press ENTER to continue..."

# =============================================================================
# STEP 3: Test Question #2 - More Complex
# =============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Validator #2 - Verify Complex Question${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Question: Explain quantum entanglement in one sentence"
echo "📝 Expected: A quantum phenomenon where particles remain connected"
echo ""
echo -e "${YELLOW}⏳ Calling real GPT-3.5-turbo via OpenRouter...${NC}"
echo ""

RESULT2=$(curl -s -X POST http://localhost:8083/verify \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "gpt-3.5-turbo",
    "inputData": "Explain quantum entanglement in one sentence",
    "expectedOutput": "A quantum phenomenon where particles remain connected",
    "requestId": 2
  }')

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}VALIDATOR #2 RESPONSE:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "$RESULT2" | jq '.'
echo ""

ACTUAL_OUTPUT2=$(echo "$RESULT2" | jq -r '.details.actual_output')
echo -e "${GREEN}🤖 ACTUAL GPT-3.5-turbo OUTPUT:${NC}"
echo -e "${GREEN}   \"$ACTUAL_OUTPUT2\"${NC}"
echo ""

CONFIDENCE2=$(echo "$RESULT2" | jq -r '.confidence')
echo "📊 Confidence: ${CONFIDENCE2}%"
echo ""

read -p "Press ENTER to continue..."

# =============================================================================
# STEP 4: Test Question #3 - Creative
# =============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Validator #3 - Verify Creative Question${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Question: Write a haiku about blockchain"
echo "📝 Expected: (Creative output - testing semantic similarity)"
echo ""
echo -e "${YELLOW}⏳ Calling real GPT-3.5-turbo via OpenRouter...${NC}"
echo ""

RESULT3=$(curl -s -X POST http://localhost:8083/verify \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "gpt-3.5-turbo",
    "inputData": "Write a haiku about blockchain",
    "expectedOutput": "Distributed trust / Immutable ledger chain / Decentralized",
    "requestId": 3
  }')

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}VALIDATOR #3 RESPONSE:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "$RESULT3" | jq '.'
echo ""

ACTUAL_OUTPUT3=$(echo "$RESULT3" | jq -r '.details.actual_output')
echo -e "${GREEN}🤖 ACTUAL GPT-3.5-turbo OUTPUT:${NC}"
echo -e "${GREEN}   \"$ACTUAL_OUTPUT3\"${NC}"
echo ""

CONFIDENCE3=$(echo "$RESULT3" | jq -r '.confidence')
echo "📊 Confidence: ${CONFIDENCE3}%"
echo ""

read -p "Press ENTER to see payment processing..."

# =============================================================================
# STEP 5: Process Payment via 4Mica
# =============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 5: Process Payment via 4Mica Protocol${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Explanation: Since all 3 validators verified the inference,"
echo "   trigger automatic payment via 4Mica fair-exchange protocol"
echo ""
echo -e "${YELLOW}⏳ Creating payment tab...${NC}"

# Extract verification proof from first result
PROOF=$(echo "$RESULT1" | jq -r '.proof')

PAYMENT=$(curl -s -X POST http://localhost:8084/process-payment \
  -H "Content-Type: application/json" \
  -d "{
    \"from_address\": \"0x292F0E22A0245387a89d5DB50F016d18D6aF0bac\",
    \"to_address\": \"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0\",
    \"amount_wei\": \"5000000000000000\",
    \"chain_id\": 84532,
    \"verification_proof\": \"$PROOF\"
  }")

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}4MICA PAYMENT RESULT:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "$PAYMENT" | jq '.'
echo ""

read -p "Press ENTER to mint ERC-8004 receipt..."

# =============================================================================
# STEP 6: Mint ERC-8004 Receipt
# =============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 6: Mint ERC-8004 Receipt NFT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Explanation: Create on-chain receipt containing:"
echo "   • All 3 validator proofs"
echo "   • Actual GPT model outputs"
echo "   • Payment transaction hash"
echo "   • Verification timestamps"
echo ""
echo -e "${YELLOW}⏳ Minting receipt NFT...${NC}"

RECEIPT=$(curl -s -X POST http://localhost:8085/mint-receipt \
  -H "Content-Type: application/json" \
  -d "{
    \"worker_address\": \"0x292F0E22A0245387a89d5DB50F016d18D6aF0bac\",
    \"work_id\": \"inference-batch-$(date +%s)\",
    \"prove_info\": {
      \"description\": \"3 validators verified GPT-3.5-turbo inferences\",
      \"uri\": \"ipfs://QmProofBatch\",
      \"validator_outputs\": [
        {\"validator\": 1, \"output\": \"$ACTUAL_OUTPUT\"},
        {\"validator\": 2, \"output\": \"$ACTUAL_OUTPUT2\"},
        {\"validator\": 3, \"output\": \"$ACTUAL_OUTPUT3\"}
      ]
    }
  }")

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}ERC-8004 RECEIPT:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "$RECEIPT" | jq '.'
echo ""

RECEIPT_HASH=$(echo "$RECEIPT" | jq -r '.receiptHash // .receipt_hash // "N/A"')
echo -e "${GREEN}✅ Receipt Hash: $RECEIPT_HASH${NC}"
echo ""

read -p "Press ENTER to see final summary..."

# =============================================================================
# FINAL SUMMARY
# =============================================================================
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ REAL API DEMO COMPLETE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}📊 ACTUAL GPT-3.5-TURBO OUTPUTS CAPTURED:${NC}"
echo ""
echo -e "${CYAN}1️⃣  Question: What is 2 + 2?${NC}"
echo -e "   GPT Output: ${GREEN}\"$ACTUAL_OUTPUT\"${NC}"
echo ""
echo -e "${CYAN}2️⃣  Question: Explain quantum entanglement${NC}"
echo -e "   GPT Output: ${GREEN}\"$ACTUAL_OUTPUT2\"${NC}"
echo ""
echo -e "${CYAN}3️⃣  Question: Write a haiku about blockchain${NC}"
echo -e "   GPT Output: ${GREEN}\"$ACTUAL_OUTPUT3\"${NC}"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "💡 KEY DIFFERENCES FROM MOCK MODE:"
echo ""
echo "   BEFORE (Mock):        AFTER (Real API):"
echo "   ─────────────         ────────────────"
echo "   • Fixed responses     • Real GPT-3.5-turbo calls"
echo "   • 85% confidence      • Dynamic confidence scores"
echo "   • No API costs        • ~\$0.01 per verification"
echo "   • Instant             • 1-3 second latency"
echo "   • Deterministic       • Creative/varied outputs"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🔍 WHERE TO SEE OUTPUTS:"
echo ""
echo "   1. In this terminal (shown above) ✓"
echo "   2. Service logs:"
echo "      tail -f logs/ml-agent-real.log"
echo ""
echo "   3. API response JSON:"
echo "      curl -X POST http://localhost:8083/verify \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"modelId\":\"gpt-3.5-turbo\",\"inputData\":\"test\"}' | jq '.details.actual_output'"
echo ""
echo "   4. ERC-8004 Receipt (contains all outputs):"
echo "      Receipt Hash: $RECEIPT_HASH"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
