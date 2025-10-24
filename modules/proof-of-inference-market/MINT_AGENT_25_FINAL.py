#!/usr/bin/env python3
"""
Mint Agent #25 with Full Attestation - Using Pre-Funded Wallet
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

# Step 2: Use the pre-funded wallet
print("\n🔐 Step 2: Using Pre-Funded Wallet...")
NEW_WALLET_PK = "0xce6f5a4896ffdc293360b5628defc0250087f810b24c034cbab9d093404b1662"
new_wallet = Account.from_key(NEW_WALLET_PK)
print(f"✅ Address: {new_wallet.address}")

# Connect to Base Sepolia
RPC_URL = "https://sepolia.base.org"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

if not w3.is_connected():
    print("❌ Failed to connect to Base Sepolia")
    exit(1)

print(f"✅ Connected to Base Sepolia (Chain ID: {w3.eth.chain_id})")

# Check balance
balance = w3.eth.get_balance(new_wallet.address)
print(f"💰 Balance: {w3.from_wei(balance, 'ether')} ETH")

if balance == 0:
    print("❌ Wallet still has 0 ETH - cannot mint")
    exit(1)

# Identity Registry contract
IDENTITY_REGISTRY = "0x7177a6867296406881E20d6647232314736Dd09A"

# ABI for newAgent (from real ERC-8004 implementation)
ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "agentDomain", "type": "string"},
            {"internalType": "address", "name": "agentAddress", "type": "address"}
        ],
        "name": "newAgent",
        "outputs": [{"internalType": "uint256", "name": "agentId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

contract = w3.eth.contract(address=IDENTITY_REGISTRY, abi=ABI)

# Step 3: Prepare agent domain with attestation reference
print("\n📝 Step 3: Preparing Agent Domain...")

# ERC-8004 uses agentDomain (string) not tokenURI
# We'll use domain to reference the attestation
agent_domain = f"inference-agent-25.attestation.{attestation['proof']['attestation_hash'][:16]}.eth"

print(f"✅ Agent Domain: {agent_domain}")
print(f"✅ Attestation Hash: {attestation['proof']['attestation_hash']}")
print(f"✅ Full attestation stored at: {attestation_file}")

# Step 4: Build transaction
print("\n🔨 Step 4: Building Transaction...")
try:
    tx = contract.functions.newAgent(
        agent_domain,  # agentDomain
        new_wallet.address  # agentAddress
    ).build_transaction({
        'from': new_wallet.address,
        'nonce': w3.eth.get_transaction_count(new_wallet.address),
        'gas': 300000,  # Lower gas since no large tokenURI
        'gasPrice': w3.eth.gas_price,
        'chainId': 84532
    })

    print(f"✅ Gas Limit: {tx['gas']}")
    print(f"✅ Gas Price: {w3.from_wei(tx['gasPrice'], 'gwei')} gwei")
    print(f"✅ Est. Cost: {w3.from_wei(tx['gas'] * tx['gasPrice'], 'ether'):.6f} ETH")

except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Step 5: Sign and send
print("\n✍️  Step 5: Signing & Sending Transaction...")
signed_tx = w3.eth.account.sign_transaction(tx, new_wallet.key)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
tx_hash_hex = tx_hash.hex()

print(f"✅ TX Hash: {tx_hash_hex}")
print(f"🔗 https://sepolia.basescan.org/tx/{tx_hash_hex}")

# Step 6: Wait for confirmation
print("\n⏳ Step 6: Waiting for Confirmation...")
receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)

print("\n" + "=" * 60)
if receipt['status'] == 1:
    print("✅ SUCCESS! AGENT #25 MINTED WITH FULL ATTESTATION!")
    print("=" * 60)
    print()
    print(f"📋 Transaction:")
    print(f"   Block: {receipt['blockNumber']}")
    print(f"   Gas Used: {receipt['gasUsed']}")
    print(f"   TX: {tx_hash_hex}")
    print()
    print(f"🎉 Agent #25:")
    print(f"   Owner: {new_wallet.address}")
    print(f"   Work: What is the capital of France? → Paris")
    print()
    print(f"📊 Attestation Proof Components:")
    print(f"   ✓ Input Hash: {attestation['commitments']['input_hash']}")
    print(f"   ✓ Output Hash: {attestation['commitments']['output_hash']}")
    print(f"   ✓ Model Hash: {attestation['commitments']['model_hash']}")
    print(f"   ✓ GPU Seconds: {attestation['compute_metrics']['gpu_seconds']}")
    print(f"   ✓ FLOPs: {attestation['compute_metrics']['estimated_flops']}")
    print(f"   ✓ Accuracy: {attestation['evaluation']['accuracy_score']*100}%")
    print(f"   ✓ Validator: {attestation['validator']['address']}")
    print(f"   ✓ Signature: {attestation['proof']['signature']}")
    print()
    print(f"🔗 View on BaseScan:")
    print(f"   https://sepolia.basescan.org/tx/{tx_hash_hex}")
    print()
    print(f"📄 Full Attestation Data:")
    print(f"   {attestation_file}")
    print()
    print("=" * 60)
else:
    print("❌ TRANSACTION FAILED")
    print("=" * 60)
    print(f"Status: {receipt['status']}")
    print(f"View: https://sepolia.basescan.org/tx/{tx_hash_hex}")
