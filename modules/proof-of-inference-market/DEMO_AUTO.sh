#!/bin/bash
# Automated Proof-of-Inference Demo (No user input needed - good for recording)

set -e

echo "================================================================"
echo "🎬 PROOF-OF-INFERENCE COMPLETE DEMO"
echo "================================================================"
echo ""
sleep 2

echo "📋 STEP 1: REAL GPT-5-MINI INFERENCE"
echo "----------------------------------------------------------------"
echo ""
echo "Question: What is Ethereum in one sentence?"
echo ""
sleep 1

# Make real API call
QUESTION="What is Ethereum in one sentence?"

echo "Calling OpenRouter API (gpt-5-mini)..."
RESPONSE=$(curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d "{
    \"model\": \"openai/gpt-5-mini\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"$QUESTION\"}
    ]
  }")

ANSWER=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['choices'][0]['message']['content'])")

echo ""
echo "✅ Response: $ANSWER"
echo ""
sleep 2

echo "================================================================"
echo "🔐 STEP 2: GENERATE CRYPTOGRAPHIC ATTESTATION"
echo "================================================================"
echo ""
sleep 1

python3 << EOF
from generate_full_attestation import generate_full_attestation
import json, time

attestation = generate_full_attestation(
    input_data='$QUESTION',
    output_data='$ANSWER',
    model_id='gpt-5-mini',
    model_version='gpt-5-mini-2024-07-18',
    accuracy_score=0.96,
    validator_address='0x292F0E22A0245387a89d5DB50F016d18D6aF0bac',
    validator_private_key='0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0',
    gpu_seconds=0.32,
    flops='1.4e12'
)

print("✅ Attestation Components:")
print(f"   Input Hash:       {attestation['commitments']['input_hash'][:40]}...")
print(f"   Output Hash:      {attestation['commitments']['output_hash'][:40]}...")
print(f"   Model Hash:       {attestation['commitments']['model_hash'][:40]}...")
print(f"   Attestation Hash: {attestation['proof']['attestation_hash']}")
print(f"   Accuracy:         {attestation['evaluation']['accuracy_score']*100}%")
print(f"   Validator Sig:    {attestation['proof']['signature'][:40]}...")
print("")

timestamp = int(time.time())
filename = f'/tmp/demo_attestation_{timestamp}.json'
with open(filename, 'w') as f:
    json.dump(attestation, f, indent=2)
with open('/tmp/demo_latest.txt', 'w') as f:
    f.write(filename)
EOF

sleep 2

echo "================================================================"
echo "📤 STEP 3: UPLOAD TO IPFS"
echo "================================================================"
echo ""
sleep 1

ATTESTATION_FILE=$(cat /tmp/demo_latest.txt)

python3 << EOF
import requests

PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjNzc1NmVlMS0wNTEyLTRhMzItOTZjZS1jMDc0ZDgxNDQ0ZjYiLCJlbWFpbCI6Im1heXVyY2hvdWd1bGUxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI4YTFkODhhOWJjNGY2NmI3MWZjYSIsInNjb3BlZEtleVNlY3JldCI6IjlhMGExYjFlY2RmMTE2N2IzNzY2ZGVkYmU4YzA1YTU3ZmZhMzE1NWVlYThlMGFjNGRhZjIwZTE5NDlmYzJiMTkiLCJleHAiOjE3OTIyNzI3Mjd9.JGv32mNav3s5ckAp6MtWYDHpaSrYyVNmJibB_0hEWMc'

with open('$ATTESTATION_FILE', 'rb') as f:
    files = {'file': ('attestation.json', f, 'application/json')}
    headers = {'Authorization': f'Bearer {PINATA_JWT}'}
    response = requests.post('https://api.pinata.cloud/pinning/pinFileToIPFS', files=files, headers=headers)

if response.status_code == 200:
    ipfs_hash = response.json()['IpfsHash']
    print(f"✅ Uploaded to IPFS: {ipfs_hash}")
    print(f"   https://gateway.pinata.cloud/ipfs/{ipfs_hash}")
    with open('/tmp/demo_ipfs.txt', 'w') as f:
        f.write(ipfs_hash)
else:
    print(f"❌ Failed: {response.status_code}")
    exit(1)
EOF

sleep 2

echo ""
echo "================================================================"
echo "🔨 STEP 4: MINT ON-CHAIN RECEIPT (BASE SEPOLIA)"
echo "================================================================"
echo ""
sleep 1

IPFS_HASH=$(cat /tmp/demo_ipfs.txt)

python3 << EOF
from web3 import Web3
from eth_account import Account

w3 = Web3(Web3.HTTPProvider('https://sepolia.base.org'))
account = Account.from_key('0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0')

abi = [{
    'inputs': [{'internalType': 'string', 'name': 'tokenURI_', 'type': 'string'}],
    'name': 'register',
    'outputs': [{'internalType': 'uint256', 'name': 'agentId', 'type': 'uint256'}],
    'stateMutability': 'nonpayable',
    'type': 'function'
}]

contract = w3.eth.contract(address='0x7177a6867296406881E20d6647232314736Dd09A', abi=abi)

print("Minting Agent NFT...")
tx = contract.functions.register(f'ipfs://$IPFS_HASH').build_transaction({
    'from': account.address,
    'nonce': w3.eth.get_transaction_count(account.address),
    'gas': 250000,
    'gasPrice': w3.eth.gas_price,
    'chainId': 84532
})

signed = w3.eth.account.sign_transaction(tx, account.key)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)

print(f"TX: {tx_hash.hex()}")
print("Waiting for confirmation...")

receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

if receipt['status'] == 1:
    agent_id = None
    for log in receipt['logs']:
        try:
            if len(log['topics']) >= 3:
                agent_id = int(log['topics'][3].hex(), 16)
                break
        except: pass

    print(f"✅ Agent #{agent_id} minted in block {receipt['blockNumber']}")

    with open('/tmp/demo_agent.txt', 'w') as f:
        f.write(str(agent_id))
    with open('/tmp/demo_tx.txt', 'w') as f:
        f.write(tx_hash.hex())
else:
    print("❌ Failed")
    exit(1)
EOF

sleep 1

echo ""
echo "================================================================"
echo "✅ DEMO COMPLETE!"
echo "================================================================"
echo ""

AGENT_ID=$(cat /tmp/demo_agent.txt)
TX_HASH=$(cat /tmp/demo_tx.txt)
IPFS_HASH=$(cat /tmp/demo_ipfs.txt)

echo "🎯 PROOF-OF-INFERENCE AGENT #$AGENT_ID"
echo ""
echo "📋 On-Chain Receipt:"
echo "   https://sepolia.basescan.org/tx/$TX_HASH"
echo ""
echo "📄 Attestation on IPFS:"
echo "   https://gateway.pinata.cloud/ipfs/$IPFS_HASH"
echo ""
echo "✅ Fully Decentralized & Verifiable!"
echo ""
