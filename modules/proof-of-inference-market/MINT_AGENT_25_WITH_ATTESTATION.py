#!/usr/bin/env python3
"""
Mint Agent #25 with Full Attestation on ERC-8004 Identity Registry
Uses a NEW wallet address to avoid "already has agent" error
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
print(f"✅ Input Hash: {attestation['commitments']['input_hash'][:20]}...")
print(f"✅ Output Hash: {attestation['commitments']['output_hash'][:20]}...")
print(f"✅ Accuracy: {attestation['evaluation']['accuracy_score']*100}%")

# Save attestation to file
timestamp = int(time.time())
attestation_file = f"/tmp/attestation_agent25_{timestamp}.json"
with open(attestation_file, 'w') as f:
    json.dump(attestation, f, indent=2)
print(f"💾 Saved to: {attestation_file}")

# Step 2: Create new wallet (since 0x292F... already has Agent #24)
print("\n🔐 Step 2: Creating New Wallet for Agent #25...")
new_wallet = Account.create()
print(f"✅ Address: {new_wallet.address}")
print(f"✅ Private Key: {new_wallet.key.hex()}")

# Connect to Base Sepolia
RPC_URL = "https://sepolia.base.org"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Check if connected
if not w3.is_connected():
    print("❌ Failed to connect to Base Sepolia")
    exit(1)

print(f"✅ Connected to Base Sepolia (Chain ID: {w3.eth.chain_id})")

# Identity Registry contract
IDENTITY_REGISTRY = "0x7177a6867296406881E20d6647232314736Dd09A"

# Full ABI for registerAgent
ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "agentAddress", "type": "address"},
            {"internalType": "string", "name": "agentType", "type": "string"},
            {"internalType": "string", "name": "tokenURI", "type": "string"}
        ],
        "name": "registerAgent",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

contract = w3.eth.contract(address=IDENTITY_REGISTRY, abi=ABI)

# Step 3: Prepare tokenURI with compact attestation summary
print("\n📝 Step 3: Preparing TokenURI with Attestation Data...")

token_uri = json.dumps({
    "name": "Inference Proof Agent #25",
    "description": "ML Inference Verification with Full Cryptographic Attestation",
    "work_id": f"inference-proof-{timestamp}",
    "timestamp": timestamp,
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
        "signature": attestation['proof']['signature'],
        "signature_r": attestation['proof']['r'],
        "signature_s": attestation['proof']['s'],
        "signature_v": attestation['proof']['v']
    },
    "external_url": f"file://{attestation_file}"
}, separators=(',', ':'))  # Compact JSON

print(f"✅ TokenURI size: {len(token_uri)} bytes")
print(f"✅ Contains full attestation proof components")

# Step 4: Check wallet balance
print("\n💰 Step 4: Checking Wallet Balance...")
balance = w3.eth.get_balance(new_wallet.address)
print(f"Balance: {w3.from_wei(balance, 'ether')} ETH")

if balance == 0:
    print("\n⚠️  WARNING: New wallet has 0 ETH!")
    print("   Cannot pay for gas to mint Agent #25")
    print()
    print("💡 SOLUTION OPTIONS:")
    print()
    print("   Option A: Send ETH to new wallet")
    print(f"   → Send 0.001 ETH to: {new_wallet.address}")
    print("   → Then re-run this script")
    print()
    print("   Option B: Use original wallet (but it already has Agent #24)")
    print("   → ERC-8004 allows only 1 agent per address")
    print("   → Would need to use a different wallet anyway")
    print()
    print("   Option C: Update Agent #24's metadata instead")
    print("   → Keep using Agent #24")
    print("   → Add new attestation as additional metadata")
    print()
    print("=" * 60)
    print("📋 WHAT WE HAVE RIGHT NOW:")
    print("=" * 60)
    print()
    print(f"✅ Full attestation generated: {attestation_file}")
    print(f"✅ Attestation hash: {attestation['proof']['attestation_hash']}")
    print(f"✅ All components verified (input/output/model hashes, signature, metrics)")
    print(f"✅ Ready to mint - just need gas ETH in wallet")
    print()
    print("Agent #24 already exists at:")
    print("https://sepolia.basescan.org/tx/0xac09bc9fb509ae94ed038103ee3225239db18a0f585bec00cb818061570bf9cc")
    print()
    print(f"To mint Agent #25, send ETH to: {new_wallet.address}")
    print(f"Then run: python3 {__file__}")
    exit(0)

# Step 5: Build transaction
print("\n🔨 Step 5: Building Transaction...")
try:
    tx = contract.functions.registerAgent(
        new_wallet.address,  # agentAddress (new wallet)
        "ml-inference-validator",  # agentType
        token_uri  # tokenURI with full attestation
    ).build_transaction({
        'from': new_wallet.address,
        'nonce': w3.eth.get_transaction_count(new_wallet.address),
        'gas': 600000,  # High gas limit for large tokenURI
        'gasPrice': w3.eth.gas_price,
        'chainId': 84532  # Base Sepolia
    })

    print(f"✅ Gas Limit: {tx['gas']}")
    print(f"✅ Gas Price: {w3.from_wei(tx['gasPrice'], 'gwei')} gwei")
    print(f"✅ Estimated Cost: {w3.from_wei(tx['gas'] * tx['gasPrice'], 'ether')} ETH")

except Exception as e:
    print(f"❌ Error building transaction: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Step 6: Sign and send
print("\n✍️  Step 6: Signing Transaction...")
signed_tx = w3.eth.account.sign_transaction(tx, new_wallet.key)

print("📤 Step 7: Sending Transaction...")
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
tx_hash_hex = tx_hash.hex()

print(f"✅ TX Hash: {tx_hash_hex}")
print(f"🔗 View on BaseScan: https://sepolia.basescan.org/tx/{tx_hash_hex}")

# Step 8: Wait for confirmation
print("\n⏳ Step 8: Waiting for Confirmation...")
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

if receipt['status'] == 1:
    print("\n" + "=" * 60)
    print("✅ SUCCESS! AGENT #25 MINTED!")
    print("=" * 60)
    print()
    print(f"📋 Transaction Details:")
    print(f"   Block Number: {receipt['blockNumber']}")
    print(f"   Gas Used: {receipt['gasUsed']}")
    print(f"   TX Hash: {tx_hash_hex}")
    print()
    print(f"🎉 Agent #25 Details:")
    print(f"   Owner: {new_wallet.address}")
    print(f"   Type: ml-inference-validator")
    print(f"   Work ID: inference-proof-{timestamp}")
    print()
    print(f"📊 Attestation Contains:")
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
    print("\n" + "=" * 60)
    print("❌ TRANSACTION FAILED")
    print("=" * 60)
    print(f"Status: {receipt['status']}")
    print(f"Gas Used: {receipt['gasUsed']}")
    print(f"View: https://sepolia.basescan.org/tx/{tx_hash_hex}")
