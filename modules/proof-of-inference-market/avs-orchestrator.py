#!/usr/bin/env python3
"""
Proof-of-Inference AVS Orchestrator
Central coordinator for ML inference verification, payment, and receipt generation
"""

import asyncio
import json
import time
import hashlib
import requests
from typing import Dict, Any, List
from dataclasses import dataclass, asdict
from flask import Flask, request, jsonify
import logging

@dataclass
class VerificationRequest:
    requestId: int
    modelId: str
    inputData: str
    expectedOutput: str
    actualOutput: str
    reward: str
    deadline: int
    agent: str

@dataclass
class VerificationResponse:
    requestId: int
    status: str
    isValid: bool
    confidence: int
    verificationProof: str
    attestationHash: str
    paymentHash: str = None
    receiptId: int = None
    timestamp: int = 0

class ProofOfInferenceAVS:
    def __init__(self):
        self.app = Flask(__name__)
        self.setup_routes()

        # Service endpoints
        self.ml_verification_url = "http://localhost:8083"
        self.payment_service_url = "http://localhost:8084"
        self.receipt_service_url = "http://localhost:8085"

        # Request storage
        self.verification_requests: Dict[int, VerificationRequest] = {}
        self.verification_results: Dict[int, VerificationResponse] = {}

        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

        self.logger.info("🚀 Proof-of-Inference AVS Orchestrator initialized")
        self.logger.info(f"   📋 ML Verification: {self.ml_verification_url}")
        self.logger.info(f"   📋 Payment Service: {self.payment_service_url}")
        self.logger.info(f"   📋 Receipt Service: {self.receipt_service_url}")

    def setup_routes(self):
        @self.app.route('/verify', methods=['POST'])
        def verify_inference():
            return self.handle_verification_request()

        @self.app.route('/status/<int:request_id>', methods=['GET'])
        def get_status(request_id):
            return self.handle_status_request(request_id)

        @self.app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({
                "status": "healthy",
                "service": "proof-of-inference-avs",
                "version": "1.0.0",
                "mode": "production",
                "endpoints": ["/verify", "/status/<id>", "/health"]
            })

    def handle_verification_request(self):
        """Handle incoming verification request"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No JSON data provided"}), 400

            # Create verification request
            req = VerificationRequest(**data)
            self.verification_requests[req.requestId] = req

            self.logger.info(f"📥 Received verification request {req.requestId}")

            # Process verification asynchronously
            result = asyncio.run(self.process_verification(req))

            # Store result
            self.verification_results[req.requestId] = result

            return jsonify(asdict(result))

        except Exception as e:
            self.logger.error(f"❌ Verification request failed: {e}")
            return jsonify({"error": str(e)}), 500

    def handle_status_request(self, request_id: int):
        """Handle status check request"""
        try:
            if request_id in self.verification_results:
                result = self.verification_results[request_id]
                return jsonify(asdict(result))
            else:
                return jsonify({
                    "requestId": request_id,
                    "status": "not_found",
                    "message": "Verification request not found"
                }), 404

        except Exception as e:
            self.logger.error(f"❌ Status request failed: {e}")
            return jsonify({"error": str(e)}), 500

    async def process_verification(self, req: VerificationRequest) -> VerificationResponse:
        """Process complete verification workflow"""
        self.logger.info(f"🔄 Processing verification request {req.requestId}")

        try:
            # Step 1: ML Verification
            self.logger.info(f"   Step 1/4: ML Verification")
            ml_result = await self.call_ml_verification(req)

            if not ml_result:
                raise Exception("ML verification failed")

            is_valid = ml_result.get('is_valid', False)
            confidence = ml_result.get('confidence', 0)
            verification_proof = ml_result.get('proof', '')

            self.logger.info(f"   ✅ ML Verification: Valid={is_valid}, Confidence={confidence}%")

            # Step 2: Generate attestation
            self.logger.info(f"   Step 2/4: Generate Attestation")
            attestation_hash = self.generate_attestation(req, ml_result)
            self.logger.info(f"   ✅ Attestation: {attestation_hash[:20]}...")

            # Step 3: Process payment (if valid)
            payment_hash = None
            if is_valid:
                self.logger.info(f"   Step 3/4: Process Payment")
                payment_hash = await self.call_payment_service(req)
                if payment_hash:
                    self.logger.info(f"   ✅ Payment: {payment_hash[:20]}...")
                else:
                    self.logger.warning(f"   ⚠️  Payment failed (continuing...)")
            else:
                self.logger.info(f"   Step 3/4: Skipping payment (invalid verification)")

            # Step 4: Mint receipt
            self.logger.info(f"   Step 4/4: Mint Receipt")
            receipt_id = await self.call_receipt_service(req, ml_result, attestation_hash)
            if receipt_id:
                self.logger.info(f"   ✅ Receipt: #{receipt_id}")
            else:
                self.logger.warning(f"   ⚠️  Receipt minting failed (continuing...)")

            # Create response
            response = VerificationResponse(
                requestId=req.requestId,
                status="verified",
                isValid=is_valid,
                confidence=confidence,
                verificationProof=verification_proof,
                attestationHash=attestation_hash,
                paymentHash=payment_hash,
                receiptId=receipt_id,
                timestamp=int(time.time())
            )

            self.logger.info(f"✅ Verification complete for request {req.requestId}")

            return response

        except Exception as e:
            self.logger.error(f"❌ Verification processing failed: {e}")

            # Return error response
            return VerificationResponse(
                requestId=req.requestId,
                status="failed",
                isValid=False,
                confidence=0,
                verificationProof="0x0000000000000000000000000000000000000000000000000000000000000000",
                attestationHash="0x0000000000000000000000000000000000000000000000000000000000000000",
                timestamp=int(time.time())
            )

    async def call_ml_verification(self, req: VerificationRequest) -> Dict[str, Any]:
        """Call ML Verification Agent"""
        try:
            payload = {
                "requestId": req.requestId,
                "modelId": req.modelId,
                "inputData": req.inputData,
                "expectedOutput": req.expectedOutput
            }

            response = requests.post(
                f"{self.ml_verification_url}/verify",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                return response.json()
            else:
                self.logger.error(f"ML verification failed: {response.status_code}")
                return None

        except Exception as e:
            self.logger.error(f"ML verification error: {e}")
            return None

    async def call_payment_service(self, req: VerificationRequest) -> str:
        """Call 4Mica Payment Service"""
        try:
            payload = {
                "recipientAgentId": req.agent,
                "amount": req.reward,
                "description": f"ML inference verification for request {req.requestId}"
            }

            response = requests.post(
                f"{self.payment_service_url}/process-payment",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                return result.get('paymentHash') or result.get('transactionHash')
            else:
                self.logger.error(f"Payment failed: {response.status_code}")
                return None

        except Exception as e:
            self.logger.error(f"Payment error: {e}")
            return None

    async def call_receipt_service(self, req: VerificationRequest, ml_result: Dict, attestation: str) -> int:
        """Call ERC-8004 Receipt Service"""
        try:
            payload = {
                "agentId": req.agent,
                "taskId": str(req.requestId),
                "result": ml_result,
                "metadata": {
                    "model_id": req.modelId,
                    "attestation_hash": attestation,
                    "verification_proof": ml_result.get('proof', '')
                }
            }

            response = requests.post(
                f"{self.receipt_service_url}/mint-receipt",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                return result.get('receiptId')
            else:
                self.logger.error(f"Receipt minting failed: {response.status_code}")
                return None

        except Exception as e:
            self.logger.error(f"Receipt error: {e}")
            return None

    def generate_attestation(self, req: VerificationRequest, ml_result: Dict) -> str:
        """Generate attestation hash for the verification"""
        attestation_data = {
            "request_id": req.requestId,
            "model_id": req.modelId,
            "agent": req.agent,
            "is_valid": ml_result.get('is_valid', False),
            "confidence": ml_result.get('confidence', 0),
            "verification_proof": ml_result.get('proof', ''),
            "timestamp": int(time.time())
        }

        attestation_string = json.dumps(attestation_data, sort_keys=True)
        attestation_hash = hashlib.sha256(attestation_string.encode()).hexdigest()

        return f"0x{attestation_hash}"

def main():
    print("🚀 Starting Proof-of-Inference AVS Orchestrator")
    print("=" * 60)
    print("Port: 8082")
    print("Endpoints:")
    print("  POST /verify - Submit verification request")
    print("  GET /status/<id> - Get verification status")
    print("  GET /health - Health check")
    print("=" * 60)
    print("\nRequired Services:")
    print("  ✓ ML Verification Agent (port 8083)")
    print("  ✓ 4Mica Payment Service (port 8084)")
    print("  ✓ ERC-8004 Receipt Service (port 8085)")
    print("=" * 60)

    avs = ProofOfInferenceAVS()
    avs.app.run(host='0.0.0.0', port=8082, debug=False)

if __name__ == "__main__":
    main()
