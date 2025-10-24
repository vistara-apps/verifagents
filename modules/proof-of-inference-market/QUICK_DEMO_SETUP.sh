#!/bin/bash
# Quick Setup for Ethereum Foundation Demo
# Using wallet: 0x292F0E22A0245387a89d5DB50F016d18D6aF0bac

echo "🚀 Ethereum Foundation Demo - Quick Setup"
echo "=========================================="
echo ""

# Check if private key is set
if [ -z "$WALLET_PRIVATE_KEY" ]; then
    echo "❌ WALLET_PRIVATE_KEY not set"
    echo ""
    echo "Please export your private key:"
    echo "  export WALLET_PRIVATE_KEY='0xyour_private_key_here'"
    echo ""
    echo "To get your private key:"
    echo "  1. Open MetaMask"
    echo "  2. Click three dots → Account Details"
    echo "  3. Export Private Key"
    echo "  4. Enter password and copy"
    echo ""
    exit 1
fi

# Set RPC URL if not set
if [ -z "$RPC_URL" ]; then
    export RPC_URL="https://sepolia.base.org"
    echo "✅ RPC_URL set to: $RPC_URL"
fi

# Check if OpenRouter API key is set (optional)
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️  OPENROUTER_API_KEY not set (will use fallback mode)"
    echo "   For REAL LLM verification, get key from: https://openrouter.ai"
else
    echo "✅ OPENROUTER_API_KEY is set"
fi

echo ""
echo "Verifying wallet setup..."

# Verify wallet address
python3 << 'PYTHON_EOF'
from web3 import Web3
from eth_account import Account
import os
import sys

expected = "0x292F0E22A0245387a89d5DB50F016d18D6aF0bac"
private_key = os.getenv("WALLET_PRIVATE_KEY")

try:
    account = Account.from_key(private_key)
    print(f"   Wallet: {account.address}")

    if account.address.lower() == expected.lower():
        print("   ✅ Wallet address MATCHES!")
    else:
        print(f"   ❌ Expected: {expected}")
        print("   ❌ Wallet MISMATCH - use correct private key")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Invalid private key: {e}")
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    exit 1
fi

echo ""
echo "Checking Base Sepolia balance..."

# Check balance
python3 << 'PYTHON_EOF'
from web3 import Web3
import os

rpc_url = os.getenv("RPC_URL", "https://sepolia.base.org")
wallet = "0x292F0E22A0245387a89d5DB50F016d18D6aF0bac"

w3 = Web3(Web3.HTTPProvider(rpc_url))
if w3.is_connected():
    balance = w3.eth.get_balance(wallet)
    balance_eth = w3.from_wei(balance, 'ether')
    print(f"   Balance: {balance_eth:.6f} ETH")

    if balance > 0:
        print("   ✅ Wallet funded - ready for REAL transactions!")
    else:
        print("   ⚠️  Wallet not funded - will use simulated mode")
        print("   Get testnet ETH: https://www.alchemy.com/faucets/base-sepolia")
else:
    print("   ❌ Cannot connect to Base Sepolia")
PYTHON_EOF

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Start services: ./start-all-services.sh"
echo "  2. Run demo: cd demo && python3 ethereum_foundation_demo.py"
echo ""
