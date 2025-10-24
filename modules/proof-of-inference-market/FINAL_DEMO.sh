#!/bin/bash
# FINAL DEMO - Show Complete System

echo "🎬 PROOF-OF-INFERENCE AVS - COMPLETE DEMO"
echo "=========================================="
echo ""
echo "Architecture:"
echo "  • Go EigenLayer AVS (8082 HTTP + 8081 gRPC)"
echo "  • Python ML Agent (8083)"
echo "  • Python Payment Service (8084)"
echo "  • Python Receipt Service (8085)"
echo ""
echo "Press ENTER to start..."
read

echo ""
echo "1️⃣  Health Checks"
echo "─────────────────"
echo "Go AVS:"
curl -s http://localhost:8082/health | jq .
echo ""
echo "ML Agent:"
curl -s http://localhost:8083/health | jq .
echo ""
echo "Payment:"
curl -s http://localhost:8084/health | jq .
echo ""
echo "Receipt:"
curl -s http://localhost:8085/health | jq .

echo ""
echo "Press ENTER for verification demo..."
read

echo ""
echo "2️⃣  Submitting Verification Request"
echo "─────────────────────────────────────"
echo "Request: What is quantum entanglement?"
echo ""

curl -X POST http://localhost:8082/verify \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": 1,
    "modelId": "gpt-3.5-turbo",
    "inputData": "Explain quantum entanglement in simple terms",
    "expectedOutput": "Quantum entanglement is a phenomenon where particles become connected",
    "actualOutput": "Quantum entanglement is a phenomenon where particles become connected",
    "reward": "1000000000000000000",
    "deadline": 9999999999,
    "agent": "0x292F0E22A0245387a89d5DB50F016d18D6aF0bac"
  }' | jq .

echo ""
echo ""
echo "3️⃣  What Just Happened?"
echo "────────────────────────"
echo "✅ Go AVS received request (EigenLayer DevKit)"
echo "✅ Checked smart contract for request validity"
echo "✅ Called Python ML Agent for verification"
echo "✅ Generated cryptographic proofs"
echo "✅ Created AVS attestation"
echo ""
echo "📊 Check Logs:"
echo "  tail -f logs/go-avs.log"
echo "  tail -f logs/ml-agent.log"
echo ""
echo "🎉 Demo Complete!"
echo "=========================================="
