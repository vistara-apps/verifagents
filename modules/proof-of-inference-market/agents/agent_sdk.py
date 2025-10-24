#!/usr/bin/env python3
"""
Proof-of-Inference Agent SDK
Provides shared functionality for all ML verification agents
Following mins-underwriter-avs patterns
"""

import asyncio
import json
import time
import hashlib
import logging
import requests
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import os

@dataclass
class VerificationRequest:
    request_id: int
    model_id: str
    input_data: str
    expected_output: str
    agent: str
    deadline: int
    reward: str

@dataclass
class VerificationResult:
    request_id: int
    is_valid: bool
    confidence: float
    method: str
    proof: str
    timestamp: int
    model_id: str
    details: Dict[str, Any]

@dataclass
class PaymentRequest:
    request_id: int
    agent: str
    amount: str
    purpose: str
    verification_data: Dict[str, Any]

@dataclass
class ReceiptRequest:
    agent: str
    bounty_id: int
    work_description: str
    result_hash: str
    result_uri: str
    value_generated: str
    completion_time: int
    is_verified: bool
    payment_hash: str
    metadata: Dict[str, Any]

class ProofOfInferenceSDK:
    """
    SDK for Proof-of-Inference AVS agents
    Provides common functionality for ML verification, payment processing, and receipt generation
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self.load_config()
        self.avs_url = self.config.get('avs_url', 'http://localhost:8082')
        self.payment_service_url = self.config.get('payment_service_url', 'http://localhost:3001')
        self.receipt_service_url = self.config.get('receipt_service_url', 'http://localhost:3002')
        
        # Setup logging
        logging.basicConfig(
            level=getattr(logging, self.config.get('log_level', 'INFO').upper()),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        # Agent identification
        self.agent_id = self.config.get('agent_id', 'proof-of-inference-agent')
        self.agent_version = self.config.get('agent_version', '1.0.0')
        
        self.logger.info(f"🤖 Initializing ProofOfInferenceSDK v{self.agent_version}")
        self.logger.info(f"   🔗 AVS URL: {self.avs_url}")
        self.logger.info(f"   💰 Payment Service: {self.payment_service_url}")
        self.logger.info(f"   🧾 Receipt Service: {self.receipt_service_url}")

    def load_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables or config file"""
        config = {
            'avs_url': os.getenv('AVS_URL', 'http://localhost:8082'),
            'payment_service_url': os.getenv('PAYMENT_SERVICE_URL', 'http://localhost:3001'),
            'receipt_service_url': os.getenv('RECEIPT_SERVICE_URL', 'http://localhost:3002'),
            'log_level': os.getenv('LOG_LEVEL', 'INFO'),
            'agent_id': os.getenv('AGENT_ID', 'proof-of-inference-agent'),
            'agent_version': os.getenv('AGENT_VERSION', '1.0.0'),
            'timeout': int(os.getenv('REQUEST_TIMEOUT', '30')),
            'retry_attempts': int(os.getenv('RETRY_ATTEMPTS', '3')),
        }
        
        # Try to load from config file if it exists
        config_file = os.getenv('CONFIG_FILE', 'config/contexts/default.yaml')
        if os.path.exists(config_file):
            try:
                import yaml
                with open(config_file, 'r') as f:
                    file_config = yaml.safe_load(f)
                    # Merge file config with environment config
                    if 'agents' in file_config and 'ml_verification_agent' in file_config['agents']:
                        agent_config = file_config['agents']['ml_verification_agent']
                        config.update(agent_config)
            except Exception as e:
                logging.warning(f"Failed to load config file {config_file}: {e}")
        
        return config

    async def submit_verification_to_avs(self, result: VerificationResult) -> bool:
        """Submit verification result to the AVS"""
        try:
            payload = {
                "requestId": result.request_id,
                "isValid": result.is_valid,
                "confidence": int(result.confidence * 100),  # Convert to basis points
                "proof": f"0x{result.proof}",
                "verificationMethod": result.method,
                "timestamp": result.timestamp,
                "agentId": self.agent_id,
                "agentVersion": self.agent_version
            }
            
            self.logger.info(f"📤 Submitting verification to AVS for request {result.request_id}")
            
            response = await self._make_request(
                'POST',
                f"{self.avs_url}/verify",
                payload
            )
            
            if response and response.get('status') == 'success':
                self.logger.info(f"✅ Verification submitted successfully to AVS")
                return True
            else:
                self.logger.error(f"❌ AVS verification submission failed: {response}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Error submitting verification to AVS: {e}")
            return False

    async def process_payment(self, payment_request: PaymentRequest) -> Optional[str]:
        """Process payment through 4Mica service"""
        try:
            payload = {
                "requestId": payment_request.request_id,
                "agent": payment_request.agent,
                "amount": payment_request.amount,
                "purpose": payment_request.purpose,
                "verification": payment_request.verification_data,
                "timestamp": int(time.time())
            }
            
            self.logger.info(f"💰 Processing payment for request {payment_request.request_id}")
            
            response = await self._make_request(
                'POST',
                f"{self.payment_service_url}/process-payment",
                payload
            )
            
            if response and 'paymentHash' in response:
                payment_hash = response['paymentHash']
                self.logger.info(f"✅ Payment processed successfully: {payment_hash}")
                return payment_hash
            else:
                self.logger.error(f"❌ Payment processing failed: {response}")
                return None
                
        except Exception as e:
            self.logger.error(f"❌ Error processing payment: {e}")
            return None

    async def generate_receipt(self, receipt_request: ReceiptRequest) -> Optional[int]:
        """Generate ERC-8004 receipt"""
        try:
            payload = {
                "agent": receipt_request.agent,
                "bountyId": receipt_request.bounty_id,
                "workDescription": receipt_request.work_description,
                "resultHash": receipt_request.result_hash,
                "resultURI": receipt_request.result_uri,
                "valueGenerated": receipt_request.value_generated,
                "completionTime": receipt_request.completion_time,
                "isVerified": receipt_request.is_verified,
                "paymentHash": receipt_request.payment_hash,
                "metadata": receipt_request.metadata,
                "timestamp": int(time.time())
            }
            
            self.logger.info(f"🧾 Generating receipt for bounty {receipt_request.bounty_id}")
            
            response = await self._make_request(
                'POST',
                f"{self.receipt_service_url}/mint-receipt",
                payload
            )
            
            if response and 'receiptId' in response:
                receipt_id = int(response['receiptId'])
                self.logger.info(f"✅ Receipt generated successfully: {receipt_id}")
                return receipt_id
            else:
                self.logger.error(f"❌ Receipt generation failed: {response}")
                return None
                
        except Exception as e:
            self.logger.error(f"❌ Error generating receipt: {e}")
            return None

    async def _make_request(self, method: str, url: str, payload: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Make HTTP request with retry logic"""
        for attempt in range(self.config.get('retry_attempts', 3)):
            try:
                if method.upper() == 'POST':
                    response = requests.post(
                        url,
                        json=payload,
                        timeout=self.config.get('timeout', 30),
                        headers={'Content-Type': 'application/json'}
                    )
                elif method.upper() == 'GET':
                    response = requests.get(
                        url,
                        timeout=self.config.get('timeout', 30)
                    )
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                if response.status_code == 200:
                    return response.json()
                else:
                    self.logger.warning(f"HTTP {response.status_code} on attempt {attempt + 1}: {url}")
                    
            except Exception as e:
                self.logger.warning(f"Request failed on attempt {attempt + 1}: {e}")
                
            if attempt < self.config.get('retry_attempts', 3) - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        return None

    def generate_proof_hash(self, request_id: int, is_valid: bool, confidence: float, additional_data: str = "") -> str:
        """Generate cryptographic proof hash"""
        data = f"{request_id}:{is_valid}:{confidence}:{time.time()}:{self.agent_id}:{additional_data}"
        return hashlib.sha256(data.encode()).hexdigest()

    def create_attestation_hash(self, verification_result: VerificationResult) -> str:
        """Create attestation hash for verification result"""
        attestation = {
            "requestId": verification_result.request_id,
            "modelId": verification_result.model_id,
            "isValid": verification_result.is_valid,
            "confidence": verification_result.confidence,
            "method": verification_result.method,
            "timestamp": verification_result.timestamp,
            "agentId": self.agent_id,
            "version": self.agent_version
        }
        
        attestation_bytes = json.dumps(attestation, sort_keys=True).encode()
        return hashlib.sha256(attestation_bytes).hexdigest()

    async def health_check(self) -> Dict[str, bool]:
        """Check health of all connected services"""
        health = {
            'avs': False,
            'payment_service': False,
            'receipt_service': False
        }
        
        # Check AVS
        try:
            response = await self._make_request('GET', f"{self.avs_url}/health")
            health['avs'] = response is not None and response.get('status') == 'healthy'
        except:
            pass
        
        # Check Payment Service
        try:
            response = await self._make_request('GET', f"{self.payment_service_url}/health")
            health['payment_service'] = response is not None
        except:
            pass
        
        # Check Receipt Service
        try:
            response = await self._make_request('GET', f"{self.receipt_service_url}/health")
            health['receipt_service'] = response is not None
        except:
            pass
        
        return health