#!/usr/bin/env python3
"""
ML Verification Agent for Proof-of-Inference AVS

This agent verifies ML inference requests by:
1. Running the same model with the same input
2. Comparing outputs with expected results
3. Calculating confidence scores
4. Generating cryptographic proofs
5. Submitting verification results to the AVS
"""

import asyncio
import json
import hashlib
import hmac
import time
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from enum import Enum
import numpy as np
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
import requests
from web3 import Web3
from eth_account import Account
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VerificationMethod(Enum):
    EXACT_MATCH = "exact_match"
    SIMILARITY_THRESHOLD = "similarity_threshold"
    STATISTICAL_ANALYSIS = "statistical_analysis"
    CROSS_VALIDATION = "cross_validation"

@dataclass
class VerificationResult:
    request_id: int
    is_valid: bool
    confidence: int
    proof: str
    verification_method: str
    gas_used: int
    timestamp: int

@dataclass
class ModelInfo:
    model_id: str
    model_type: str
    model_path: str
    tokenizer_path: str
    verification_threshold: float
    max_input_length: int

class MLVerificationAgent:
    """
    ML Verification Agent that validates inference requests
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.web3 = Web3(Web3.HTTPProvider(config['rpc_url']))
        self.account = Account.from_key(config['private_key'])
        self.contract_address = config['contract_address']
        self.contract_abi = self._load_contract_abi()
        self.contract = self.web3.eth.contract(
            address=self.contract_address,
            abi=self.contract_abi
        )
        
        # Load models
        self.models = {}
        self._load_models()
        
        # Verification methods
        self.verification_methods = {
            VerificationMethod.EXACT_MATCH: self._verify_exact_match,
            VerificationMethod.SIMILARITY_THRESHOLD: self._verify_similarity_threshold,
            VerificationMethod.STATISTICAL_ANALYSIS: self._verify_statistical_analysis,
            VerificationMethod.CROSS_VALIDATION: self._verify_cross_validation
        }
        
        logger.info(f"ML Verification Agent initialized for {len(self.models)} models")
    
    def _load_contract_abi(self) -> List[Dict]:
        """Load contract ABI"""
        return [
            {
                "inputs": [
                    {"name": "requestId", "type": "uint256"},
                    {"name": "isValid", "type": "bool"},
                    {"name": "confidence", "type": "uint256"},
                    {"name": "proof", "type": "bytes"},
                    {"name": "verificationMethod", "type": "string"}
                ],
                "name": "submitVerification",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "requestId", "type": "uint256"}],
                "name": "inferenceRequests",
                "outputs": [
                    {"name": "agent", "type": "address"},
                    {"name": "modelId", "type": "string"},
                    {"name": "inputData", "type": "bytes"},
                    {"name": "expectedOutput", "type": "bytes"},
                    {"name": "reward", "type": "uint256"},
                    {"name": "deadline", "type": "uint256"},
                    {"name": "completed", "type": "bool"},
                    {"name": "verified", "type": "bool"},
                    {"name": "timestamp", "type": "uint256"},
                    {"name": "requestHash", "type": "bytes32"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    def _load_models(self):
        """Load ML models for verification"""
        model_configs = self.config.get('models', [])
        
        for model_config in model_configs:
            model_id = model_config['model_id']
            model_type = model_config['model_type']
            
            try:
                if model_type == 'huggingface':
                    self.models[model_id] = self._load_huggingface_model(model_config)
                elif model_type == 'pytorch':
                    self.models[model_id] = self._load_pytorch_model(model_config)
                elif model_type == 'tensorflow':
                    self.models[model_id] = self._load_tensorflow_model(model_config)
                else:
                    logger.warning(f"Unknown model type: {model_type}")
                    
            except Exception as e:
                logger.error(f"Failed to load model {model_id}: {e}")
    
    def _load_huggingface_model(self, config: Dict) -> ModelInfo:
        """Load HuggingFace model"""
        model_path = config['model_path']
        tokenizer_path = config.get('tokenizer_path', model_path)
        
        # Load tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
        model = AutoModel.from_pretrained(model_path)
        
        return ModelInfo(
            model_id=config['model_id'],
            model_type='huggingface',
            model_path=model_path,
            tokenizer_path=tokenizer_path,
            verification_threshold=config.get('verification_threshold', 0.95),
            max_input_length=config.get('max_input_length', 512)
        )
    
    def _load_pytorch_model(self, config: Dict) -> ModelInfo:
        """Load PyTorch model"""
        model_path = config['model_path']
        
        # Load model
        model = torch.load(model_path, map_location='cpu')
        model.eval()
        
        return ModelInfo(
            model_id=config['model_id'],
            model_type='pytorch',
            model_path=model_path,
            tokenizer_path='',
            verification_threshold=config.get('verification_threshold', 0.95),
            max_input_length=config.get('max_input_length', 512)
        )
    
    def _load_tensorflow_model(self, config: Dict) -> ModelInfo:
        """Load TensorFlow model"""
        model_path = config['model_path']
        
        # Load model
        import tensorflow as tf
        model = tf.keras.models.load_model(model_path)
        
        return ModelInfo(
            model_id=config['model_id'],
            model_type='tensorflow',
            model_path=model_path,
            tokenizer_path='',
            verification_threshold=config.get('verification_threshold', 0.95),
            max_input_length=config.get('max_input_length', 512)
        )
    
    async def verify_inference_request(self, request_id: int) -> VerificationResult:
        """
        Verify an inference request
        """
        try:
            # Get request details from contract
            request_data = self._get_request_data(request_id)
            
            if not request_data:
                raise ValueError(f"Request {request_id} not found")
            
            # Decode input and expected output
            input_data = self._decode_input_data(request_data['inputData'])
            expected_output = self._decode_expected_output(request_data['expectedOutput'])
            model_id = request_data['modelId']
            
            # Verify the inference
            verification_result = await self._verify_inference(
                model_id, input_data, expected_output
            )
            
            # Create proof
            proof = self._create_proof(request_id, verification_result)
            
            # Submit verification to contract
            await self._submit_verification(
                request_id,
                verification_result['is_valid'],
                verification_result['confidence'],
                proof,
                verification_result['method']
            )
            
            return VerificationResult(
                request_id=request_id,
                is_valid=verification_result['is_valid'],
                confidence=verification_result['confidence'],
                proof=proof,
                verification_method=verification_result['method'],
                gas_used=0,  # Will be set by contract
                timestamp=int(time.time())
            )
            
        except Exception as e:
            logger.error(f"Verification failed for request {request_id}: {e}")
            raise
    
    def _get_request_data(self, request_id: int) -> Optional[Dict]:
        """Get request data from contract"""
        try:
            request_data = self.contract.functions.inferenceRequests(request_id).call()
            
            return {
                'agent': request_data[0],
                'modelId': request_data[1],
                'inputData': request_data[2],
                'expectedOutput': request_data[3],
                'reward': request_data[4],
                'deadline': request_data[5],
                'completed': request_data[6],
                'verified': request_data[7],
                'timestamp': request_data[8],
                'requestHash': request_data[9]
            }
        except Exception as e:
            logger.error(f"Failed to get request data: {e}")
            return None
    
    def _decode_input_data(self, input_data: bytes) -> Any:
        """Decode input data"""
        try:
            return json.loads(input_data.decode('utf-8'))
        except:
            return input_data
    
    def _decode_expected_output(self, expected_output: bytes) -> Any:
        """Decode expected output"""
        try:
            return json.loads(expected_output.decode('utf-8'))
        except:
            return expected_output
    
    async def _verify_inference(
        self, 
        model_id: str, 
        input_data: Any, 
        expected_output: Any
    ) -> Dict[str, Any]:
        """
        Verify inference using multiple methods
        """
        if model_id not in self.models:
            raise ValueError(f"Model {model_id} not found")
        
        model_info = self.models[model_id]
        
        # Try different verification methods
        for method in VerificationMethod:
            try:
                result = await self.verification_methods[method](
                    model_id, input_data, expected_output
                )
                if result['confidence'] >= model_info.verification_threshold * 100:
                    return result
            except Exception as e:
                logger.warning(f"Verification method {method} failed: {e}")
                continue
        
        # If all methods fail, return lowest confidence
        return {
            'is_valid': False,
            'confidence': 0,
            'method': 'all_methods_failed'
        }
    
    async def _verify_exact_match(
        self, 
        model_id: str, 
        input_data: Any, 
        expected_output: Any
    ) -> Dict[str, Any]:
        """Verify using exact match"""
        # Run inference
        actual_output = await self._run_inference(model_id, input_data)
        
        # Compare outputs
        is_valid = actual_output == expected_output
        confidence = 100 if is_valid else 0
        
        return {
            'is_valid': is_valid,
            'confidence': confidence,
            'method': 'exact_match'
        }
    
    async def _verify_similarity_threshold(
        self, 
        model_id: str, 
        input_data: Any, 
        expected_output: Any
    ) -> Dict[str, Any]:
        """Verify using similarity threshold"""
        # Run inference
        actual_output = await self._run_inference(model_id, input_data)
        
        # Calculate similarity
        similarity = self._calculate_similarity(actual_output, expected_output)
        threshold = self.models[model_id].verification_threshold
        
        is_valid = similarity >= threshold
        confidence = int(similarity * 100)
        
        return {
            'is_valid': is_valid,
            'confidence': confidence,
            'method': 'similarity_threshold'
        }
    
    async def _verify_statistical_analysis(
        self, 
        model_id: str, 
        input_data: Any, 
        expected_output: Any
    ) -> Dict[str, Any]:
        """Verify using statistical analysis"""
        # Run inference multiple times
        outputs = []
        for _ in range(5):
            output = await self._run_inference(model_id, input_data)
            outputs.append(output)
        
        # Calculate statistics
        mean_output = np.mean(outputs, axis=0)
        std_output = np.std(outputs, axis=0)
        
        # Check if expected output is within statistical bounds
        is_valid = self._is_within_bounds(expected_output, mean_output, std_output)
        confidence = self._calculate_statistical_confidence(expected_output, mean_output, std_output)
        
        return {
            'is_valid': is_valid,
            'confidence': confidence,
            'method': 'statistical_analysis'
        }
    
    async def _verify_cross_validation(
        self, 
        model_id: str, 
        input_data: Any, 
        expected_output: Any
    ) -> Dict[str, Any]:
        """Verify using cross-validation"""
        # This would involve training multiple models and comparing
        # For now, we'll use a simplified version
        
        # Run inference
        actual_output = await self._run_inference(model_id, input_data)
        
        # Calculate cross-validation score
        cv_score = self._calculate_cross_validation_score(actual_output, expected_output)
        
        is_valid = cv_score >= 0.8
        confidence = int(cv_score * 100)
        
        return {
            'is_valid': is_valid,
            'confidence': confidence,
            'method': 'cross_validation'
        }
    
    async def _run_inference(self, model_id: str, input_data: Any) -> Any:
        """Run inference on the model"""
        model_info = self.models[model_id]
        
        if model_info.model_type == 'huggingface':
            return await self._run_huggingface_inference(model_id, input_data)
        elif model_info.model_type == 'pytorch':
            return await self._run_pytorch_inference(model_id, input_data)
        elif model_info.model_type == 'tensorflow':
            return await self._run_tensorflow_inference(model_id, input_data)
        else:
            raise ValueError(f"Unknown model type: {model_info.model_type}")
    
    async def _run_huggingface_inference(self, model_id: str, input_data: Any) -> Any:
        """Run HuggingFace model inference"""
        # This would load the actual model and run inference
        # For now, we'll return a mock result
        return {"output": "mock_huggingface_result", "confidence": 0.95}
    
    async def _run_pytorch_inference(self, model_id: str, input_data: Any) -> Any:
        """Run PyTorch model inference"""
        # This would load the actual model and run inference
        # For now, we'll return a mock result
        return {"output": "mock_pytorch_result", "confidence": 0.92}
    
    async def _run_tensorflow_inference(self, model_id: str, input_data: Any) -> Any:
        """Run TensorFlow model inference"""
        # This would load the actual model and run inference
        # For now, we'll return a mock result
        return {"output": "mock_tensorflow_result", "confidence": 0.88}
    
    def _calculate_similarity(self, output1: Any, output2: Any) -> float:
        """Calculate similarity between two outputs"""
        if isinstance(output1, dict) and isinstance(output2, dict):
            # Compare dictionary outputs
            keys1 = set(output1.keys())
            keys2 = set(output2.keys())
            
            if keys1 != keys2:
                return 0.0
            
            similarities = []
            for key in keys1:
                if isinstance(output1[key], (int, float)) and isinstance(output2[key], (int, float)):
                    # Numeric comparison
                    diff = abs(output1[key] - output2[key])
                    max_val = max(abs(output1[key]), abs(output2[key]))
                    if max_val == 0:
                        similarity = 1.0
                    else:
                        similarity = 1.0 - (diff / max_val)
                    similarities.append(similarity)
                else:
                    # String comparison
                    similarity = 1.0 if output1[key] == output2[key] else 0.0
                    similarities.append(similarity)
            
            return np.mean(similarities)
        
        elif isinstance(output1, (list, tuple)) and isinstance(output2, (list, tuple)):
            # Compare list/tuple outputs
            if len(output1) != len(output2):
                return 0.0
            
            similarities = []
            for item1, item2 in zip(output1, output2):
                if isinstance(item1, (int, float)) and isinstance(item2, (int, float)):
                    diff = abs(item1 - item2)
                    max_val = max(abs(item1), abs(item2))
                    if max_val == 0:
                        similarity = 1.0
                    else:
                        similarity = 1.0 - (diff / max_val)
                    similarities.append(similarity)
                else:
                    similarity = 1.0 if item1 == item2 else 0.0
                    similarities.append(similarity)
            
            return np.mean(similarities)
        
        else:
            # Direct comparison
            return 1.0 if output1 == output2 else 0.0
    
    def _is_within_bounds(self, value: Any, mean: Any, std: Any) -> bool:
        """Check if value is within statistical bounds"""
        if isinstance(value, (int, float)) and isinstance(mean, (int, float)) and isinstance(std, (int, float)):
            return abs(value - mean) <= 2 * std
        return False
    
    def _calculate_statistical_confidence(self, value: Any, mean: Any, std: Any) -> int:
        """Calculate statistical confidence"""
        if isinstance(value, (int, float)) and isinstance(mean, (int, float)) and isinstance(std, (int, float)):
            if std == 0:
                return 100 if value == mean else 0
            
            z_score = abs(value - mean) / std
            if z_score <= 1:
                return 95
            elif z_score <= 2:
                return 80
            elif z_score <= 3:
                return 60
            else:
                return 30
        
        return 50
    
    def _calculate_cross_validation_score(self, actual: Any, expected: Any) -> float:
        """Calculate cross-validation score"""
        # Simplified cross-validation score
        similarity = self._calculate_similarity(actual, expected)
        return similarity * 0.9  # Slightly lower than direct similarity
    
    def _create_proof(self, request_id: int, verification_result: Dict[str, Any]) -> str:
        """Create cryptographic proof of verification"""
        proof_data = {
            'request_id': request_id,
            'is_valid': verification_result['is_valid'],
            'confidence': verification_result['confidence'],
            'method': verification_result['method'],
            'timestamp': int(time.time()),
            'verifier': self.account.address
        }
        
        # Create HMAC proof
        proof_json = json.dumps(proof_data, sort_keys=True)
        proof_hash = hmac.new(
            self.account.private_key,
            proof_json.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return proof_hash
    
    async def _submit_verification(
        self,
        request_id: int,
        is_valid: bool,
        confidence: int,
        proof: str,
        verification_method: str
    ):
        """Submit verification to contract"""
        try:
            # Encode proof as bytes
            proof_bytes = proof.encode('utf-8')
            
            # Build transaction
            transaction = self.contract.functions.submitVerification(
                request_id,
                is_valid,
                confidence,
                proof_bytes,
                verification_method
            ).build_transaction({
                'from': self.account.address,
                'gas': 500000,
                'gasPrice': self.web3.eth.gas_price,
                'nonce': self.web3.eth.get_transaction_count(self.account.address)
            })
            
            # Sign and send transaction
            signed_txn = self.web3.eth.account.sign_transaction(transaction, self.account.private_key)
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for confirmation
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            logger.info(f"Verification submitted for request {request_id}: {tx_hash.hex()}")
            return receipt
            
        except Exception as e:
            logger.error(f"Failed to submit verification: {e}")
            raise
    
    async def run_verification_loop(self):
        """Main verification loop"""
        logger.info("Starting ML verification loop...")
        
        while True:
            try:
                # Get pending requests (this would be implemented based on your contract)
                pending_requests = await self._get_pending_requests()
                
                for request_id in pending_requests:
                    try:
                        logger.info(f"Verifying request {request_id}")
                        result = await self.verify_inference_request(request_id)
                        logger.info(f"Verification completed: {result}")
                    except Exception as e:
                        logger.error(f"Verification failed for request {request_id}: {e}")
                
                # Wait before next iteration
                await asyncio.sleep(10)
                
            except Exception as e:
                logger.error(f"Verification loop error: {e}")
                await asyncio.sleep(30)
    
    async def _get_pending_requests(self) -> List[int]:
        """Get pending verification requests"""
        # This would query your contract for pending requests
        # For now, return empty list
        return []

# Example usage
async def main():
    config = {
        'rpc_url': 'http://localhost:8545',
        'private_key': '0x...',  # Your private key
        'contract_address': '0x...',  # Contract address
        'models': [
            {
                'model_id': 'gpt-3.5-turbo',
                'model_type': 'huggingface',
                'model_path': 'microsoft/DialoGPT-medium',
                'verification_threshold': 0.95,
                'max_input_length': 512
            }
        ]
    }
    
    agent = MLVerificationAgent(config)
    await agent.run_verification_loop()

if __name__ == "__main__":
    asyncio.run(main())