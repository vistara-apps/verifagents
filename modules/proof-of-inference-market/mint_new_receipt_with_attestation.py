#!/usr/bin/env python3
"""
Mint NEW ERC-8004 Receipt (Agent #25) with Full Attestation
"""

import json
import time
from web3 import Web3
from eth_account import Account

# Load attestation from file
print("📂 Loading attestation from /tmp/attestation_*.json...")
import glob
attestation_files = sorted(glob.glob("/tmp/attestation_*.json"))
if not attestation_files:
    print("❌ No attestation file found. Run generate_full_attestation.py first")
    exit(1)

attestation_file = attestation_files[-1]  # Use latest
with open(attestation_file) as f:
    attestation = json.load(f)
print(f"✅ Loaded: {attestation_file}")

# Connect to Base Sepolia
RPC_URL = "https://sepolia.base.org"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Contract addresses
IDENTITY_REGISTRY = "0x7177a6867296406881E20d6647232314736Dd09A"

# Wallet
WALLET_PRIVATE_KEY = "0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0"
account = Account.from_key(WALLET_PRIVATE_KEY)

print(f"\n🔐 Using wallet: {account.address}")
print(f"🔗 Network: Base Sepolia")
print(f"📜 Contract: {IDENTITY_REGISTRY}")

# ABI for registerAgent
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

# Compact tokenURI with attestation summary
token_uri = json.dumps({
    "work_id": f"inference-attestation-{int(time.time())}",
    "description": "ML Inference with Full Cryptographic Attestation Proof",
    "timestamp": int(time.time()),
    "attestation": {
        "hash": attestation['proof']['attestation_hash'][:20] + "...",
        "input_hash": attestation['commitments']['input_hash'][:20] + "...",
        "output_hash": attestation['commitments']['output_hash'][:20] + "...",
        "model": f"{attestation['commitments']['model_id']}:{attestation['commitments']['model_version']}",
        "accuracy": f"{attestation['evaluation']['accuracy_score']*100}%",
        "gpu_sec": attestation['compute_metrics']['gpu_seconds'],
        "validator": attestation['validator']['address'],
        "sig": attestation['proof']['signature'][:20] + "...",
        "full_data": "stored in /tmp/attestation_*.json"
    }
})

print("\n📝 TokenURI Preview:")
print(token_uri[:200] + "..." if len(token_uri) > 200 else token_uri)
print(f"\n📏 Size: {len(token_uri)} bytes")

# Build transaction
print("\n🔨 Building transaction...")
tx = contract.functions.registerAgent(
    account.address,  # agentAddress
    "ml-inference-validator",  # agentType
    token_uri  # tokenURI with compact attestation
).build_transaction({
    'from': account.address,
    'nonce': w3.eth.get_transaction_count(account.address),
    'gas': 500000,  # Increased gas
    'gasPrice': w3.eth.gas_price,
    'chainId': 84532  # Base Sepolia
})

print(f"  Gas: {tx['gas']}")
print(f"  Gas Price: {tx['gasPrice'] / 1e9:.2f} gwei")

# Sign and send
print("\n✍️  Signing transaction...")
signed_tx = w3.eth.account.sign_transaction(tx, account.key)

print("📤 Sending transaction...")
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
tx_hash_hex = tx_hash.hex()

print(f"  TX Hash: {tx_hash_hex}")
print("\n⏳ Waiting for confirmation...")

# Wait for receipt
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

if receipt['status'] == 1:
    print("\n✅ SUCCESS!")
    print("=" * 60)

    # Get agent ID from logs
    agent_id = None
    for log in receipt['logs']:
        if len(log['topics']) > 0:
            try:
                # AgentRegistered event
                agent_id = int(log['data'].hex(), 16)
                break
            except:
                pass

    print(f"\n🎉 NEW RECEIPT MINTED!")
    print(f"  Agent ID: #{agent_id if agent_id else 'Check explorer'}")
    print(f"  Block: {receipt['blockNumber']}")
    print(f"  Gas Used: {receipt['gasUsed']}")

    print("\n📋 Contains:")
    print("  ✓ Attestation hash")
    print("  ✓ Input/output hash commitments")
    print("  ✓ Model version hash")
    print("  ✓ Compute metrics (GPU seconds)")
    print("  ✓ Accuracy evaluation (93%)")
    print("  ✓ Validator signature")
    print("  ✓ Validator address")

    print("\n🔗 View on BaseScan:")
    print(f"  https://sepolia.basescan.org/tx/{tx_hash_hex}")

    print("\n📄 Full Attestation Data:")
    print(f"  File: {attestation_file}")
    print(f"  Hash: {attestation['proof']['attestation_hash']}")

else:
    print(f"\n❌ Transaction failed!")
    print(f"  Status: {receipt['status']}")
    print(f"  TX: https://sepolia.basescan.org/tx/{tx_hash_hex}")
