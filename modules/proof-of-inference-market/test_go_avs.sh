#!/bin/bash
# Test Go AVS with Real EigenLayer Integration

echo "🧪 Testing Go EigenLayer AVS"
echo "=============================="

# Test 1: Health Check
echo ""
echo "1. Health Check..."
curl -s http://localhost:8082/health | jq .

# Test 2: Submit Verification
echo ""
echo "2. Submitting Verification Request..."
curl -X POST http://localhost:8082/verify \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": 999,
    "modelId": "gpt-3.5-turbo",
    "inputData": "What is 2+2?",
    "expectedOutput": "4",
    "actualOutput": "4",
    "reward": "1000000000000000000",
    "deadline": 9999999999,
    "agent": "0x292F0E22A0245387a89d5DB50F016d18D6aF0bac"
  }' | jq .

echo ""
echo "=============================="
echo "✅ Test Complete!"
echo ""
echo "Check logs:"
echo "  tail -f logs/go-avs.log"
echo ""
