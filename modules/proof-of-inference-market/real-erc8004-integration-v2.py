#!/usr/bin/env python3
"""
Real ERC-8004 Receipt Service using deployed IdentityRegistry
Uses the actual deployed contracts from trustless-agents-erc-ri
"""

import json
import time
import os
from flask import Flask, request, jsonify
from web3 import Web3
from eth_account import Account

class RealERC8004Service:
    def __init__(self):
        self.app = Flask(__name__)
        self.setup_routes()

        # Configuration
        self.rpc_url = os.getenv("RPC_URL", "https://sepolia.base.org")
        self.private_key = os.getenv("WALLET_PRIVATE_KEY", "0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0")

        # Real deployed ERC-8004 addresses on Base Sepolia
        self.identity_registry = "0x7177a6867296406881E20d6647232314736Dd09A"
        self.reputation_registry = "0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322"
        self.validation_registry = "0x662b40A526cb4017d947e71eAF6753BF3eeE66d8"

        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        if self.private_key:
            self.account = Account.from_key(self.private_key)
        else:
            self.account = None

        # Load contract ABI
        self.identity_abi = self.load_identity_abi()
        self.identity_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.identity_registry),
            abi=self.identity_abi
        )

        print(f"🚀 Real ERC-8004 Service Initialized")
        print(f"   📋 Identity Registry: {self.identity_registry}")
        print(f"   📋 Base Sepolia RPC: {self.rpc_url}")
        if self.account:
            print(f"   📋 Account: {self.account.address}")

    def load_identity_abi(self):
        """Load IdentityRegistry ABI"""
        return [
            {
                "inputs": [],
                "name": "register",
                "outputs": [{"internalType": "uint256", "name": "agentId", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "string", "name": "tokenURI_", "type": "string"}],
                "name": "register",
                "outputs": [{"internalType": "uint256", "name": "agentId", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "uint256", "name": "agentId", "type": "uint256"},
                    {"internalType": "string", "name": "key", "type": "string"},
                    {"internalType": "bytes", "name": "value", "type": "bytes"}
                ],
                "name": "setMetadata",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "uint256", "name": "agentId", "type": "uint256"},
                    {"internalType": "string", "name": "key", "type": "string"}
                ],
                "name": "getMetadata",
                "outputs": [{"internalType": "bytes", "name": "value", "type": "bytes"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "owner", "type": "address"},
                    {"internalType": "uint256", "name": "index", "type": "uint256"}
                ],
                "name": "tokenOfOwnerByIndex",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]

    def setup_routes(self):
        @self.app.route('/mint-receipt', methods=['POST'])
        def mint_receipt():
            return self.handle_mint_receipt()

        @self.app.route('/mint', methods=['POST'])
        def mint_alias():
            return self.handle_mint_receipt()

        @self.app.route('/receipt/<receipt_id>', methods=['GET'])
        def get_receipt(receipt_id):
            return self.handle_get_receipt(receipt_id)

        @self.app.route('/health', methods=['GET'])
        def health():
            return jsonify({
                "status": "healthy",
                "service": "erc8004-receipt-service",
                "version": "2.0.0",
                "mode": "real-integration",
                "contracts": {
                    "identityRegistry": self.identity_registry,
                    "reputationRegistry": self.reputation_registry,
                    "validationRegistry": self.validation_registry
                },
                "network": "base-sepolia",
                "endpoints": ["/mint-receipt", "/mint", "/receipt/<id>", "/health"]
            })

    def handle_mint_receipt(self):
        """Mint a real ERC-8004 receipt on-chain"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No JSON data provided", "success": False}), 400

            # Extract parameters
            worker_address = data.get('worker_address')
            work_id = data.get('work_id')
            prove_info = data.get('prove_info', {})

            # Extract attestation components
            attestation = data.get('attestation', {})

            if not worker_address:
                return jsonify({"error": "worker_address required", "success": False}), 400

            # Create metadata URI with verification info
            metadata_uri = f"data:application/json,{{\"work_id\":\"{work_id}\",\"description\":\"{prove_info.get('description', '')}\",\"timestamp\":{int(time.time())}}}"

            print(f"🧾 Minting ERC-8004 receipt for {worker_address}")
            print(f"   Work ID: {work_id}")

            if not self.account:
                # Mock response if no wallet configured
                receipt_hash = f"0x{int(time.time()):064x}"
                return jsonify({
                    "success": True,
                    "receiptHash": receipt_hash,
                    "receipt_hash": receipt_hash,
                    "receiptId": int(time.time()),
                    "worker": worker_address,
                    "workId": work_id,
                    "network": "base-sepolia",
                    "contract": self.identity_registry,
                    "mode": "mock - set WALLET_PRIVATE_KEY for real minting"
                })

            # Check if worker already has an agent ID
            balance = self.identity_contract.functions.balanceOf(
                Web3.to_checksum_address(worker_address)
            ).call()

            if balance > 0:
                # Get existing agent ID
                agent_id = self.identity_contract.functions.tokenOfOwnerByIndex(
                    Web3.to_checksum_address(worker_address),
                    0
                ).call()
                print(f"   ✅ Worker already has Agent ID: {agent_id}")

                # Add metadata to existing agent
                metadata_key = f"inference_{work_id}"
                metadata_value = json.dumps(prove_info).encode('utf-8')

                # Build transaction
                nonce = self.w3.eth.get_transaction_count(self.account.address)

                tx = self.identity_contract.functions.setMetadata(
                    agent_id,
                    metadata_key,
                    metadata_value
                ).build_transaction({
                    'from': self.account.address,
                    'nonce': nonce,
                    'gas': 200000,
                    'gasPrice': self.w3.eth.gas_price
                })

                # Sign and send
                signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)

                print(f"   ⏳ Waiting for metadata transaction...")
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

                print(f"   ✅ Metadata added! TX: {tx_hash.hex()}")

                return jsonify({
                    "success": True,
                    "receiptHash": tx_hash.hex(),
                    "receipt_hash": tx_hash.hex(),
                    "receiptId": agent_id,
                    "agentId": agent_id,
                    "transactionHash": tx_hash.hex(),
                    "blockNumber": receipt['blockNumber'],
                    "worker": worker_address,
                    "workId": work_id,
                    "network": "base-sepolia",
                    "contract": self.identity_registry,
                    "explorer": f"https://sepolia.basescan.org/tx/{tx_hash.hex()}",
                    "mode": "real - metadata added to existing agent"
                })

            else:
                # Register new agent with metadata URI
                print(f"   🆕 Registering new agent...")

                nonce = self.w3.eth.get_transaction_count(self.account.address)

                tx = self.identity_contract.functions.register(
                    metadata_uri
                ).build_transaction({
                    'from': self.account.address,
                    'nonce': nonce,
                    'gas': 300000,
                    'gasPrice': self.w3.eth.gas_price
                })

                # Sign and send
                signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)

                print(f"   ⏳ Waiting for registration transaction...")
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

                # Parse logs to get agent ID
                agent_id = None
                for log in receipt['logs']:
                    try:
                        # Transfer event (last log is the mint)
                        if len(log['topics']) >= 3:
                            agent_id = int(log['topics'][3].hex(), 16)
                            break
                    except:
                        continue

                print(f"   ✅ Agent registered! ID: {agent_id}, TX: {tx_hash.hex()}")

                return jsonify({
                    "success": True,
                    "receiptHash": tx_hash.hex(),
                    "receipt_hash": tx_hash.hex(),
                    "receiptId": agent_id,
                    "agentId": agent_id,
                    "transactionHash": tx_hash.hex(),
                    "blockNumber": receipt['blockNumber'],
                    "worker": worker_address,
                    "workId": work_id,
                    "network": "base-sepolia",
                    "contract": self.identity_registry,
                    "explorer": f"https://sepolia.basescan.org/tx/{tx_hash.hex()}",
                    "mode": "real - new agent registered"
                })

        except Exception as e:
            print(f"❌ Error minting receipt: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "error": str(e),
                "success": False,
                "receiptId": None
            }), 500

    def handle_get_receipt(self, receipt_id):
        """Get receipt metadata from chain"""
        try:
            agent_id = int(receipt_id)

            # Get owner
            owner = self.identity_contract.functions.ownerOf(agent_id).call()

            return jsonify({
                "success": True,
                "receiptId": agent_id,
                "agentId": agent_id,
                "owner": owner,
                "network": "base-sepolia",
                "contract": self.identity_registry,
                "explorer": f"https://sepolia.basescan.org/token/{self.identity_registry}?a={agent_id}"
            })

        except Exception as e:
            return jsonify({
                "error": str(e),
                "success": False
            }), 500

    def run(self, host='0.0.0.0', port=8085):
        print(f"\n🚀 Starting Real ERC-8004 Receipt Service")
        print(f"==================================================")
        print(f"Port: {port}")
        print(f"Endpoints:")
        print(f"  POST /mint-receipt - Mint ERC-8004 receipt")
        print(f"  POST /mint - Alias for /mint-receipt")
        print(f"  GET /receipt/<id> - Get receipt info")
        print(f"  GET /health - Health check")
        print(f"==================================================\n")
        self.app.run(host=host, port=port, debug=False)

if __name__ == '__main__':
    service = RealERC8004Service()
    service.run()
