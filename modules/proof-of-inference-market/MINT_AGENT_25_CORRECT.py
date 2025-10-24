#!/usr/bin/env python3
"""
Mint Agent #25 with Full Attestation - USING THE CORRECT METHOD
Same approach that worked for Agent #24
"""

import json
import time
from web3 import Web3
from eth_account import Account
from generate_full_attestation import generate_full_attestation

print("=" * 60)
print("🎯 MINTING AGENT #25 WITH FULL ATTESTATION")
print("=" * 60)

# Step 1: Generate fresh attestation
print("\n📋 Step 1: Generating Full Attestation...")
attestation = generate_full_attestation(
    input_data='What is the capital of France?',
    output_data='The capital of France is Paris.',
    model_id='gpt-3.5-turbo',
    model_version='gpt-3.5-turbo-0125',
    accuracy_score=0.95,
    validator_address='0x292F0E22A0245387a89d5DB50F016d18D6aF0bac',
    validator_private_key='0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0',
    gpu_seconds=0.25,
    flops='1.1e12'
)

print(f"✅ Attestation Hash: {attestation['proof']['attestation_hash']}")
print(f"✅ Accuracy: {attestation['evaluation']['accuracy_score']*100}%")

# Save attestation
timestamp = int(time.time())
attestation_file = f"/tmp/attestation_agent25_{timestamp}.json"
with open(attestation_file, 'w') as f:
    json.dump(attestation, f, indent=2)
print(f"💾 Saved to: {attestation_file}")

# Step 2: Setup wallet
print("\n🔐 Step 2: Setting Up Wallet...")
# Use the SAME wallet that minted Agent #24
WALLET_PK = "0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0"
account = Account.from_key(WALLET_PK)
print(f"✅ Address: {account.address}")
print(f"✅ (Same wallet that minted Agent #24)")

# Connect to Base Sepolia
RPC_URL = "https://sepolia.base.org"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

if not w3.is_connected():
    print("❌ Failed to connect")
    exit(1)

print(f"✅ Connected to Base Sepolia")

# Check balance
balance = w3.eth.get_balance(account.address)
print(f"💰 Balance: {w3.from_wei(balance, 'ether')} ETH")

if balance == 0:
    print("❌ No ETH for gas")
    exit(1)

# Identity Registry contract
IDENTITY_REGISTRY = "0x7177a6867296406881E20d6647232314736Dd09A"

# ABI - USING THE CORRECT FUNCTION: register(tokenURI)
ABI = [
    {
        "inputs": [{"internalType": "string", "name": "tokenURI_", "type": "string"}],
        "name": "register",
        "outputs": [{"internalType": "uint256", "name": "agentId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

contract = w3.eth.contract(address=IDENTITY_REGISTRY, abi=ABI)

# Step 3: Create metadata URI with full attestation
print("\n📝 Step 3: Creating Metadata URI with Full Attestation...")

metadata = {
    "name": "Inference Proof Agent #25",
    "description": "ML Inference Verification with Full Cryptographic Attestation",
    "work_id": f"inference-proof-{timestamp}",
    "timestamp": timestamp,
    "question": "What is the capital of France?",
    "answer": "The capital of France is Paris.",
    "attestation": {
        "hash": attestation['proof']['attestation_hash'],
        "input_hash": attestation['commitments']['input_hash'],
        "output_hash": attestation['commitments']['output_hash'],
        "model": f"{attestation['commitments']['model_id']}:{attestation['commitments']['model_version']}",
        "model_hash": attestation['commitments']['model_hash'],
        "gpu_seconds": attestation['compute_metrics']['gpu_seconds'],
        "flops": attestation['compute_metrics']['estimated_flops'],
        "accuracy": attestation['evaluation']['accuracy_score'],
        "meets_spec": attestation['evaluation']['meets_spec'],
        "validator": attestation['validator']['address'],
        "signature": attestation['proof']['signature'][:66],  # Truncate for size
        "signature_r": attestation['proof']['r'],
        "signature_s": attestation['proof']['s'],
        "signature_v": attestation['proof']['v']
    }
}

# Create data URI
metadata_json = json.dumps(metadata, separators=(',', ':'))
token_uri = f"data:application/json,{metadata_json}"

print(f"✅ Metadata size: {len(metadata_json)} bytes")
print(f"✅ Token URI size: {len(token_uri)} bytes")

# Step 4: Build transaction
print("\n🔨 Step 4: Building Transaction...")
try:
    nonce = w3.eth.get_transaction_count(account.address)

    tx = contract.functions.register(
        token_uri
    ).build_transaction({
        'from': account.address,
        'nonce': nonce,
        'gas': 400000,  # Higher gas for large metadata
        'gasPrice': w3.eth.gas_price,
        'chainId': 84532
    })

    print(f"✅ Gas Limit: {tx['gas']}")
    print(f"✅ Gas Price: {w3.from_wei(tx['gasPrice'], 'gwei')} gwei")
    cost = tx['gas'] * tx['gasPrice']
    print(f"✅ Est. Cost: {w3.from_wei(cost, 'ether'):.6f} ETH")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Step 5: Sign and send
print("\n✍️  Step 5: Signing & Sending Transaction...")
signed_tx = w3.eth.account.sign_transaction(tx, account.key)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
tx_hash_hex = tx_hash.hex()

print(f"✅ TX Hash: {tx_hash_hex}")
print(f"🔗 https://sepolia.basescan.org/tx/{tx_hash_hex}")

# Step 6: Wait for confirmation
print("\n⏳ Step 6: Waiting for Confirmation...")
receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)

print("\n" + "=" * 60)
if receipt['status'] == 1:
    # Parse agent ID from logs
    agent_id = None
    for log in receipt['logs']:
        try:
            if len(log['topics']) >= 3:
                agent_id = int(log['topics'][3].hex(), 16)
                break
        except:
            continue

    print("✅ SUCCESS! AGENT #25 MINTED!")
    print("=" * 60)
    print()
    print(f"🎉 Agent ID: #{agent_id}")
    print(f"📋 Owner: {account.address}")
    print(f"📦 Block: {receipt['blockNumber']}")
    print(f"⛽ Gas Used: {receipt['gasUsed']}")
    print()
    print(f"📊 Full Attestation Components:")
    print(f"   ✓ Input Hash: {attestation['commitments']['input_hash'][:20]}...")
    print(f"   ✓ Output Hash: {attestation['commitments']['output_hash'][:20]}...")
    print(f"   ✓ Model Hash: {attestation['commitments']['model_hash'][:20]}...")
    print(f"   ✓ GPU Seconds: {attestation['compute_metrics']['gpu_seconds']}")
    print(f"   ✓ FLOPs: {attestation['compute_metrics']['estimated_flops']}")
    print(f"   ✓ Accuracy: {attestation['evaluation']['accuracy_score']*100}%")
    print(f"   ✓ Validator: {attestation['validator']['address']}")
    print(f"   ✓ Signature: {attestation['proof']['signature'][:20]}...")
    print()
    print(f"🔗 View on BaseScan:")
    print(f"   https://sepolia.basescan.org/tx/{tx_hash_hex}")
    print()
    print(f"📄 Full Attestation:")
    print(f"   {attestation_file}")
    print()
    print("=" * 60)
else:
    print("❌ TRANSACTION FAILED")
    print("=" * 60)
    print(f"Status: {receipt['status']}")
    print(f"TX: https://sepolia.basescan.org/tx/{tx_hash_hex}")
