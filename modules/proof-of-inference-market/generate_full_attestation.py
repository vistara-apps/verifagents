#!/usr/bin/env python3
"""
Generate Full Attestation Proof with all components
"""

import json
import hashlib
import time
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct

def generate_full_attestation(
    input_data: str,
    output_data: str,
    model_id: str,
    model_version: str,
    accuracy_score: float,
    validator_address: str,
    validator_private_key: str,
    gpu_seconds: float = None,
    flops: str = None
):
    """
    Generate complete attestation proof with:
    1. Input/output commitments
    2. Model metadata
    3. Compute metrics
    4. Evaluation results
    5. Validator signature
    """

    # 1. Generate commitments (hashes)
    input_hash = Web3.keccak(text=input_data).hex()
    output_hash = Web3.keccak(text=output_data).hex()
    model_hash = Web3.keccak(text=f"{model_id}:{model_version}").hex()

    # 2. Compute metrics
    compute_metrics = {
        "gpu_seconds": gpu_seconds or 0.3,
        "estimated_flops": flops or "1.2e12",
        "timestamp": int(time.time())
    }

    # 3. Evaluation results
    evaluation = {
        "method": "semantic_similarity",
        "accuracy_score": accuracy_score,
        "meets_spec": accuracy_score >= 0.70,
        "threshold": 0.70,
        "confidence_interval": {
            "lower": max(0, accuracy_score - 0.05),
            "upper": min(1.0, accuracy_score + 0.05)
        }
    }

    # 4. Build attestation structure
    attestation = {
        "version": "1.0.0",
        "commitments": {
            "input_hash": input_hash,
            "output_hash": output_hash,
            "model_hash": model_hash,
            "model_id": model_id,
            "model_version": model_version
        },
        "compute_metrics": compute_metrics,
        "evaluation": evaluation,
        "validator": {
            "address": validator_address,
            "timestamp": int(time.time())
        }
    }

    # 5. Generate attestation hash
    attestation_json = json.dumps(attestation, sort_keys=True)
    attestation_hash = Web3.keccak(text=attestation_json).hex()

    # 6. Sign the attestation hash
    account = Account.from_key(validator_private_key)
    message = encode_defunct(text=attestation_hash)
    signature = account.sign_message(message)

    # 7. Complete attestation proof
    attestation_proof = {
        **attestation,
        "proof": {
            "attestation_hash": attestation_hash,
            "signature": signature.signature.hex(),
            "r": hex(signature.r),
            "s": hex(signature.s),
            "v": signature.v
        }
    }

    return attestation_proof

def verify_attestation(attestation_proof: dict, expected_validator: str) -> bool:
    """Verify an attestation proof"""
    try:
        # Reconstruct attestation (without proof section)
        attestation = {k: v for k, v in attestation_proof.items() if k != 'proof'}
        attestation_json = json.dumps(attestation, sort_keys=True)
        attestation_hash = Web3.keccak(text=attestation_json).hex()

        # Verify hash matches
        if attestation_hash != attestation_proof['proof']['attestation_hash']:
            print(f"  ❌ Hash mismatch")
            return False

        # Recover signer from signature
        message = encode_defunct(text=attestation_hash)

        # Get full signature (r, s, v)
        r = int(attestation_proof['proof']['r'], 16)
        s = int(attestation_proof['proof']['s'], 16)
        v = attestation_proof['proof']['v']

        # Combine into signature
        signature_bytes = r.to_bytes(32, 'big') + s.to_bytes(32, 'big') + v.to_bytes(1, 'big')

        recovered = Account.recover_message(message, signature=signature_bytes)

        return recovered.lower() == expected_validator.lower()
    except Exception as e:
        print(f"  ❌ Verification error: {e}")
        return False


if __name__ == '__main__':
    # Example usage
    print("🔐 Generating Full Attestation Proof")
    print("=" * 60)

    # Test data
    input_data = "What is 2 + 2?"
    output_data = "2 + 2 equals 4."
    model_id = "gpt-3.5-turbo"
    model_version = "gpt-3.5-turbo-0125"
    accuracy_score = 0.93
    validator_address = "0x292F0E22A0245387a89d5DB50F016d18D6aF0bac"
    validator_key = "0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0"

    # Generate attestation
    attestation = generate_full_attestation(
        input_data=input_data,
        output_data=output_data,
        model_id=model_id,
        model_version=model_version,
        accuracy_score=accuracy_score,
        validator_address=validator_address,
        validator_private_key=validator_key,
        gpu_seconds=0.3,
        flops="1.2e12"
    )

    print("\n📋 COMMITMENTS:")
    print(json.dumps(attestation['commitments'], indent=2))

    print("\n⚙️  COMPUTE METRICS:")
    print(json.dumps(attestation['compute_metrics'], indent=2))

    print("\n📊 EVALUATION:")
    print(json.dumps(attestation['evaluation'], indent=2))

    print("\n✍️  PROOF:")
    print(f"  Attestation Hash: {attestation['proof']['attestation_hash']}")
    print(f"  Signature: {attestation['proof']['signature'][:20]}...")
    print(f"  Validator: {attestation['validator']['address']}")

    # Verify
    print("\n🔍 VERIFICATION:")
    is_valid = verify_attestation(attestation, validator_address)
    print(f"  Valid: {is_valid} {'✅' if is_valid else '❌'}")

    print("\n💾 Full Attestation (JSON):")
    print(json.dumps(attestation, indent=2))
