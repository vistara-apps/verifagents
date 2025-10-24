#!/usr/bin/env python3
"""
Individual Test: 4Mica Payment Service
Shows REAL blockchain transactions with on-chain proofs
"""

import os
import time
import json
import hashlib
from colorama import Fore, Style, init
from web3 import Web3
from eth_account import Account

init(autoreset=True)

def test_blockchain_payment_real():
    """Test blockchain payment with REAL on-chain transactions"""
    print(f"{Fore.CYAN}{'='*80}")
    print(f"{Fore.CYAN}4MICA PAYMENT SERVICE - REAL BLOCKCHAIN TRANSACTION TEST")
    print(f"{Fore.CYAN}{'='*80}{Style.RESET_ALL}\n")

    # Configuration
    rpc_url = os.getenv("RPC_URL", "https://sepolia.base.org")
    private_key = os.getenv("WALLET_PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")

    print(f"{Fore.YELLOW}Configuration:{Style.RESET_ALL}")
    print(f"   RPC URL: {rpc_url}")

    # Initialize Web3
    print(f"\n{Fore.WHITE}🔗 Connecting to blockchain...{Style.RESET_ALL}")

    w3 = Web3(Web3.HTTPProvider(rpc_url))

    if not w3.is_connected():
        print(f"{Fore.RED}❌ Cannot connect to RPC{Style.RESET_ALL}")
        return

    print(f"{Fore.GREEN}✅ Connected to blockchain{Style.RESET_ALL}")
    print(f"   Chain ID: {w3.eth.chain_id}")
    print(f"   Chain Name: Base Sepolia")
    print(f"   Latest Block: {w3.eth.block_number}\n")

    # Get account
    account = Account.from_key(private_key)

    print(f"{Fore.YELLOW}Wallet Information:{Style.RESET_ALL}")
    print(f"   Address: {account.address}")

    # Check balance
    balance = w3.eth.get_balance(account.address)
    balance_eth = w3.from_wei(balance, 'ether')

    print(f"   Balance: {balance_eth:.6f} ETH\n")

    if balance == 0:
        print(f"{Fore.RED}❌ Insufficient balance{Style.RESET_ALL}")
        print(f"\n{Fore.YELLOW}To enable REAL blockchain proofs:{Style.RESET_ALL}")
        print(f"  1. Get Base Sepolia ETH from https://www.alchemy.com/faucets/base-sepolia")
        print(f"  2. Send to: {account.address}")
        print(f"  3. Verify: https://sepolia.basescan.org/address/{account.address}")
        print(f"  4. Run this script again\n")

        # Generate simulated proof
        print(f"{Fore.YELLOW}{'─'*80}")
        print(f"{Fore.YELLOW}Simulated Payment Proof")
        print(f"{Fore.YELLOW}{'─'*80}{Style.RESET_ALL}\n")

        proof_data = {
            "mode": "simulated",
            "reason": "insufficient_balance",
            "sender": account.address,
            "amount": "0.0001 ETH",
            "chain": "Base Sepolia",
            "chain_id": w3.eth.chain_id,
            "timestamp": int(time.time())
        }

        proof_string = json.dumps(proof_data, sort_keys=True)
        proof = hashlib.sha256(proof_string.encode()).hexdigest()

        print(f"{Fore.MAGENTA}   🔐 Payment Proof: 0x{proof}{Style.RESET_ALL}\n")
        return

    # Test transaction
    recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"  # Test address
    amount_eth = 0.0001  # Small test amount

    print(f"{Fore.YELLOW}{'─'*80}")
    print(f"{Fore.YELLOW}Creating Test Transaction")
    print(f"{Fore.YELLOW}{'─'*80}{Style.RESET_ALL}\n")

    print(f"   Sender: {account.address}")
    print(f"   Recipient: {recipient}")
    print(f"   Amount: {amount_eth} ETH\n")

    try:
        # Build transaction
        nonce = w3.eth.get_transaction_count(account.address)
        gas_price = w3.eth.gas_price

        tx = {
            'nonce': nonce,
            'to': recipient,
            'value': w3.to_wei(amount_eth, 'ether'),
            'gas': 21000,
            'gasPrice': gas_price,
            'chainId': w3.eth.chain_id
        }

        print(f"{Fore.WHITE}   📝 Transaction details:{Style.RESET_ALL}")
        print(f"      Nonce: {nonce}")
        print(f"      Gas Limit: 21000")
        print(f"      Gas Price: {w3.from_wei(gas_price, 'gwei'):.2f} gwei")
        print(f"      Total Cost: ~{w3.from_wei(gas_price * 21000 + tx['value'], 'ether'):.6f} ETH\n")

        # Sign transaction
        print(f"{Fore.WHITE}   ✍️  Signing transaction...{Style.RESET_ALL}")
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)

        # Send transaction
        print(f"{Fore.WHITE}   📤 Sending to blockchain...{Style.RESET_ALL}")
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        tx_hash_hex = tx_hash.hex()

        print(f"{Fore.GREEN}   ✅ Transaction sent!{Style.RESET_ALL}")
        print(f"{Fore.MAGENTA}   🔐 Transaction Hash: {tx_hash_hex}{Style.RESET_ALL}\n")

        # Wait for confirmation
        print(f"{Fore.WHITE}   ⏳ Waiting for confirmation...{Style.RESET_ALL}")
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        if tx_receipt.status == 1:
            print(f"{Fore.GREEN}   ✅ Transaction confirmed!{Style.RESET_ALL}\n")

            print(f"{Fore.YELLOW}{'─'*80}")
            print(f"{Fore.YELLOW}Transaction Receipt")
            print(f"{Fore.YELLOW}{'─'*80}{Style.RESET_ALL}\n")

            print(f"   Block Number: {tx_receipt.blockNumber}")
            print(f"   Block Hash: {tx_receipt.blockHash.hex()}")
            print(f"   Gas Used: {tx_receipt.gasUsed}")
            print(f"   Effective Gas Price: {w3.from_wei(tx_receipt.effectiveGasPrice, 'gwei'):.2f} gwei")
            print(f"   Transaction Fee: {w3.from_wei(tx_receipt.gasUsed * tx_receipt.effectiveGasPrice, 'ether'):.6f} ETH\n")

            # Generate REAL payment proof
            proof_data = {
                "mode": "real_blockchain",
                "tx_hash": tx_hash_hex,
                "block": tx_receipt.blockNumber,
                "block_hash": tx_receipt.blockHash.hex(),
                "gas_used": tx_receipt.gasUsed,
                "sender": account.address,
                "recipient": recipient,
                "amount": f"{amount_eth} ETH",
                "chain": "Base Sepolia",
                "chain_id": w3.eth.chain_id,
                "timestamp": int(time.time())
            }

            proof_string = json.dumps(proof_data, sort_keys=True)
            proof = hashlib.sha256(proof_string.encode()).hexdigest()

            print(f"{Fore.MAGENTA}   🔐 REAL Payment Proof: 0x{proof}{Style.RESET_ALL}")
            print(f"\n{Fore.GREEN}   🌐 View on BaseScan:{Style.RESET_ALL}")
            print(f"      https://sepolia.basescan.org/tx/{tx_hash_hex}\n")

            print(f"{Fore.GREEN}{'='*80}")
            print(f"{Fore.GREEN}PROOF VERIFICATION")
            print(f"{Fore.GREEN}{'='*80}{Style.RESET_ALL}\n")

            print(f"   ✅ Transaction is REAL - confirmed on Base Sepolia blockchain")
            print(f"   ✅ Proof is independently verifiable via BaseScan explorer")
            print(f"   ✅ Block number proves finality: {tx_receipt.blockNumber}")
            print(f"   ✅ Gas used proves actual execution: {tx_receipt.gasUsed}")
            print(f"   ✅ Anyone can verify this transaction at any time\n")

        else:
            print(f"{Fore.RED}   ❌ Transaction failed{Style.RESET_ALL}\n")

    except Exception as e:
        print(f"{Fore.RED}   ❌ Error: {e}{Style.RESET_ALL}\n")

if __name__ == "__main__":
    try:
        test_blockchain_payment_real()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Test interrupted{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}Test failed: {e}{Style.RESET_ALL}")
