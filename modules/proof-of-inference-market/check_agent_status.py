#!/usr/bin/env python3
"""
Check if wallet already has an agent registered
"""

from web3 import Web3

# Connect to Base Sepolia
RPC_URL = "https://sepolia.base.org"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Contract
IDENTITY_REGISTRY = "0x7177a6867296406881E20d6647232314736Dd09A"
WALLET = "0x292F0E22A0245387a89d5DB50F016d18D6aF0bac"

# ABI for getAgentId
ABI = [
    {
        "inputs": [{"internalType": "address", "name": "agentAddress", "type": "address"}],
        "name": "getAgentId",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

contract = w3.eth.contract(address=IDENTITY_REGISTRY, abi=ABI)

print(f"🔍 Checking if {WALLET} has an agent...")

try:
    agent_id = contract.functions.getAgentId(WALLET).call()
    print(f"\n✅ Agent ID: {agent_id}")

    if agent_id == 0:
        print("   No agent registered - can mint new one")
    else:
        print(f"   ❌ Already has Agent #{agent_id}")
        print(f"   Cannot register multiple agents per address")
        print(f"\n💡 Solution: Use Agent #{agent_id} and update its metadata")
        print(f"   Or use a different wallet address")

except Exception as e:
    print(f"❌ Error: {e}")
