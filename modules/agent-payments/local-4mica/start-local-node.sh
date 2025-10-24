#!/bin/bash

# Start a local Ethereum node with Prague fork support
# This uses Hardhat or Anvil for local development

echo "🚀 Starting local Ethereum node with Prague fork support..."

# Check if Anvil is available (from Foundry)
if command -v anvil &> /dev/null; then
    echo "✅ Using Anvil (Foundry) for local node"
    anvil \
        --host 0.0.0.0 \
        --port 8545 \
        --chain-id 1337 \
        --gas-limit 30000000 \
        --gas-price 20000000000 \
        --fork-url https://eth-mainnet.g.alchemy.com/v2/demo \
        --fork-block-number 19000000 \
        --accounts 10 \
        --balance 10000 \
        --mnemonic "test test test test test test test test test test test junk"
else
    echo "❌ Anvil not found. Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
    echo "   Or install Hardhat: npm install -g hardhat"
    exit 1
fi
