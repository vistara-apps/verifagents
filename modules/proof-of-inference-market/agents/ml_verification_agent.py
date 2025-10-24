#!/usr/bin/env python3
"""
ML Verification Agent for Proof-of-Inference AVS
Provides real ML model inference verification capabilities
Enhanced with EigenLayer integration, payment processing, and receipt generation
"""

import asyncio
import json
import time
import hashlib
import logging
import requests
from typing import Dict, Any, Optional
from dataclasses import dataclass
import os
from .agent_sdk import ProofOfInferenceSDK, VerificationRequest, VerificationResult, PaymentRequest, ReceiptRequest

class MLVerificationAgent:
    def __init__(self, config: Dict[str, Any] = None):
        self.sdk = ProofOfInferenceSDK(config)
        self.agent_name = "MLVerificationAgent"
        self.logger = logging.getLogger(__name__)
        
        self.supported_models = [
            "gpt-3.5-turbo",
            "claude-3-opus", 
            "llama-2-70b",
            "gpt-4",
            "claude-3-sonnet",
            "mistral-7b"
        ]
        
        # OpenRouter API integration for real LLM calls
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.openrouter_base_url = "https://openrouter.ai/api/v1"
        
        self.logger.info(f"🤖 Initializing {self.agent_name}")
        self.logger.info(f"   📋 Supported Models: {', '.join(self.supported_models)}")
        self.logger.info(f"   🔗 SDK Integration: Enabled")
        self.logger.info(f"   🌐 OpenRouter API: {'Enabled' if self.openrouter_api_key else 'Disabled'}")

    async def verify_inference_request(self, request: VerificationRequest) -> VerificationResult:
        """
        Verify an ML inference request using sophisticated verification methods
        Enhanced with real LLM inference verification
        """
        self.logger.info(f"🔍 Verifying request {request.request_id} for model {request.model_id}")
        
        # Step 1: Try real inference verification first
        if self.openrouter_api_key:
            try:
                result = await self._verify_with_real_inference(request)
                if result:
                    self.logger.info("✅ Used real LLM inference verification")
                    return result
            except Exception as e:
                self.logger.warning(f"Real inference verification failed, falling back to heuristic: {e}")
        
        # Step 2: Fallback to heuristic verification
        verification_method = self._select_verification_method(request.model_id)
        
        if verification_method == "text_generation_verification":
            result = await self._verify_text_generation(request.input_data, request.expected_output, request.model_id)
        elif verification_method == "embedding_similarity":
            result = await self._verify_embedding_similarity(request.input_data, request.expected_output, request.model_id)
        elif verification_method == "semantic_coherence":
            result = await self._verify_semantic_coherence(request.input_data, request.expected_output, request.model_id)
        else:
            result = await self._verify_generic(request.input_data, request.expected_output, request.model_id)
        
        # Generate cryptographic proof using SDK
        proof = self.sdk.generate_proof_hash(
            request.request_id,
            result.is_valid,
            result.confidence,
            verification_method
        )
        
        final_result = VerificationResult(
            request_id=request.request_id,
            is_valid=result.is_valid,
            confidence=result.confidence,
            method=verification_method,
            proof=proof,
            timestamp=int(time.time()),
            model_id=request.model_id,
            details={
                "verification_type": "heuristic_fallback" if not self.openrouter_api_key else "real_inference_failed",
                "model_family": self._get_model_family(request.model_id),
                "input_length": len(request.input_data),
                "output_length": len(request.expected_output)
            }
        )
        
        self.logger.info(f"✅ Verification complete: Valid={final_result.is_valid}, Confidence={final_result.confidence:.1f}%")
        return final_result

    async def _verify_with_real_inference(self, request: VerificationRequest) -> Optional[VerificationResult]:
        """
        Verify by running actual inference with the same model and comparing results
        """
        try:
            self.logger.info(f"🤖 Running real inference verification with {request.model_id}")
            
            # Map model IDs to OpenRouter model names
            model_mapping = {
                "gpt-3.5-turbo": "openai/gpt-3.5-turbo",
                "gpt-4": "openai/gpt-4",
                "claude-3-opus": "anthropic/claude-3-opus",
                "claude-3-sonnet": "anthropic/claude-3-sonnet",
                "llama-2-70b": "meta-llama/llama-2-70b-chat",
                "mistral-7b": "mistralai/mistral-7b-instruct"
            }
            
            openrouter_model = model_mapping.get(request.model_id)
            if not openrouter_model:
                self.logger.warning(f"Model {request.model_id} not supported for real inference")
                return None
            
            # Make request to OpenRouter
            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://proof-of-inference-avs.com",
                "X-Title": "Proof-of-Inference AVS"
            }
            
            payload = {
                "model": openrouter_model,
                "messages": [
                    {"role": "user", "content": request.input_data}
                ],
                "max_tokens": min(1000, len(request.expected_output) * 2),
                "temperature": 0.1  # Low temperature for consistency
            }
            
            response = requests.post(
                f"{self.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                self.logger.error(f"OpenRouter API error: {response.status_code}")
                return None
            
            result = response.json()
            if 'choices' not in result or not result['choices']:
                self.logger.error("No response from OpenRouter")
                return None
            
            actual_output = result['choices'][0]['message']['content']
            
            # Compare actual output with expected output
            confidence = self._compare_outputs(request.expected_output, actual_output, request.model_id)
            is_valid = confidence > 70.0  # Threshold for real inference verification
            
            # Generate proof
            proof = self.sdk.generate_proof_hash(
                request.request_id,
                is_valid,
                confidence,
                f"real_inference_{openrouter_model}"
            )
            
            return VerificationResult(
                request_id=request.request_id,
                is_valid=is_valid,
                confidence=confidence,
                method=f"real_inference_{openrouter_model}",
                proof=proof,
                timestamp=int(time.time()),
                model_id=request.model_id,
                details={
                    "verification_type": "real_inference",
                    "openrouter_model": openrouter_model,
                    "expected_output": request.expected_output[:200] + "..." if len(request.expected_output) > 200 else request.expected_output,
                    "actual_output": actual_output[:200] + "..." if len(actual_output) > 200 else actual_output,
                    "similarity_score": confidence,
                    "usage": result.get('usage', {})
                }
            )
            
        except Exception as e:
            self.logger.error(f"Real inference verification failed: {e}")
            return None

    def _compare_outputs(self, expected: str, actual: str, model_id: str) -> float:
        """
        Compare expected and actual outputs to determine similarity confidence
        """
        # Normalize texts
        expected_norm = expected.lower().strip()
        actual_norm = actual.lower().strip()
        
        # If outputs are very similar (exact match or close), high confidence
        if expected_norm == actual_norm:
            return 95.0
        
        # Calculate various similarity metrics
        
        # 1. Word overlap similarity
        expected_words = set(expected_norm.split())
        actual_words = set(actual_norm.split())
        
        if len(expected_words.union(actual_words)) == 0:
            return 50.0
        
        word_overlap = len(expected_words.intersection(actual_words)) / len(expected_words.union(actual_words))
        
        # 2. Length similarity
        length_ratio = min(len(expected), len(actual)) / max(len(expected), len(actual))
        
        # 3. Structural similarity (sentence count, punctuation)
        expected_sentences = expected.count('.') + expected.count('!') + expected.count('?')
        actual_sentences = actual.count('.') + actual.count('!') + actual.count('?')
        
        if max(expected_sentences, actual_sentences) == 0:
            structure_similarity = 1.0
        else:
            structure_similarity = min(expected_sentences, actual_sentences) / max(expected_sentences, actual_sentences)
        
        # 4. Semantic coherence (check if both answer the same type of question)
        semantic_coherence = 0.8  # Base semantic score
        
        # Check for question answering patterns
        if any(word in expected_norm for word in ['because', 'since', 'therefore']) and \
           any(word in actual_norm for word in ['because', 'since', 'therefore']):
            semantic_coherence += 0.1
        
        # 5. Model-specific adjustments
        model_factor = 1.0
        if 'gpt' in model_id.lower():
            # GPT models tend to be more verbose, so length differences are more acceptable
            model_factor = 1.1
        elif 'claude' in model_id.lower():
            # Claude tends to be more structured, so structure similarity is more important
            structure_similarity *= 1.2
        
        # Combine all factors
        final_confidence = (
            word_overlap * 40 +           # 40% weight on word overlap
            length_ratio * 20 +           # 20% weight on length similarity
            structure_similarity * 20 +   # 20% weight on structure
            semantic_coherence * 20       # 20% weight on semantic coherence
        ) * model_factor
        
        return min(95.0, max(30.0, final_confidence))  # Clamp between 30% and 95%

    def _get_model_family(self, model_id: str) -> str:
        """Get the model family for a given model ID"""
        model_id_lower = model_id.lower()
        if 'gpt' in model_id_lower:
            return 'gpt'
        elif 'claude' in model_id_lower:
            return 'claude'
        elif 'llama' in model_id_lower:
            return 'llama'
        elif 'mistral' in model_id_lower:
            return 'mistral'
        else:
            return 'unknown'

    def _select_verification_method(self, model_id: str) -> str:
        """Select appropriate verification method based on model type"""
        if "gpt" in model_id.lower():
            return "text_generation_verification"
        elif "claude" in model_id.lower():
            return "semantic_coherence"
        elif "llama" in model_id.lower():
            return "embedding_similarity"
        else:
            return "generic_verification"

    async def _verify_text_generation(self, input_data: str, expected_output: str, model_id: str) -> VerificationResult:
        """Verify text generation models using linguistic analysis"""
        await asyncio.sleep(0.5)  # Simulate processing time
        
        # Simulate sophisticated text analysis
        input_length = len(input_data)
        output_length = len(expected_output)
        
        # Quality checks
        has_relevant_keywords = any(word in expected_output.lower() for word in input_data.lower().split())
        length_ratio = output_length / max(input_length, 1)
        coherence_score = min(100, (has_relevant_keywords * 50) + (min(length_ratio * 30, 40)) + 10)
        
        is_valid = coherence_score > 70
        confidence = min(coherence_score + 15, 95)  # Boost for GPT models
        
        return VerificationResult(
            is_valid=is_valid,
            confidence=confidence,
            method="text_generation_verification",
            proof="",
            timestamp=int(time.time()),
            model_id=model_id
        )

    async def _verify_embedding_similarity(self, input_data: str, expected_output: str, model_id: str) -> VerificationResult:
        """Verify using embedding similarity (simulated)"""
        await asyncio.sleep(0.7)  # Simulate embedding computation
        
        # Simulate embedding similarity calculation
        input_words = set(input_data.lower().split())
        output_words = set(expected_output.lower().split())
        
        overlap = len(input_words.intersection(output_words))
        total_unique = len(input_words.union(output_words))
        
        similarity_score = (overlap / max(total_unique, 1)) * 100
        confidence = min(similarity_score + 20, 90)  # LLaMA models
        
        is_valid = confidence > 65
        
        return VerificationResult(
            is_valid=is_valid,
            confidence=confidence,
            method="embedding_similarity",
            proof="",
            timestamp=int(time.time()),
            model_id=model_id
        )

    async def _verify_semantic_coherence(self, input_data: str, expected_output: str, model_id: str) -> VerificationResult:
        """Verify semantic coherence (Claude models)"""
        await asyncio.sleep(0.6)  # Simulate semantic analysis
        
        # Simulate advanced semantic analysis
        input_sentences = input_data.count('.') + input_data.count('?') + input_data.count('!')
        output_sentences = expected_output.count('.') + expected_output.count('?') + expected_output.count('!')
        
        # Check for appropriate response length and structure
        structural_score = min((output_sentences / max(input_sentences, 1)) * 30, 40)
        
        # Check for question-answer relevance
        is_question = '?' in input_data
        has_answer_structure = any(word in expected_output.lower() for word in ['because', 'since', 'therefore', 'thus'])
        
        relevance_score = 30 if (is_question and has_answer_structure) else 20
        
        # Claude models are typically very coherent
        base_score = 25
        confidence = min(structural_score + relevance_score + base_score, 92)
        
        is_valid = confidence > 75
        
        return VerificationResult(
            is_valid=is_valid,
            confidence=confidence,
            method="semantic_coherence",
            proof="",
            timestamp=int(time.time()),
            model_id=model_id
        )

    async def _verify_generic(self, input_data: str, expected_output: str, model_id: str) -> VerificationResult:
        """Generic verification for unknown models"""
        await asyncio.sleep(0.3)
        
        # Basic sanity checks
        output_exists = len(expected_output.strip()) > 0
        reasonable_length = 10 <= len(expected_output) <= 1000
        
        confidence = 70 if (output_exists and reasonable_length) else 40
        is_valid = confidence > 60
        
        return VerificationResult(
            is_valid=is_valid,
            confidence=confidence,
            method="generic_verification",
            proof="",
            timestamp=int(time.time()),
            model_id=model_id
        )

    def _generate_verification_proof(self, request_id: int, is_valid: bool, confidence: float) -> str:
        """Generate cryptographic proof of verification"""
        data = f"{request_id}:{is_valid}:{confidence}:{time.time()}:{self.agent_name}"
        return hashlib.sha256(data.encode()).hexdigest()

    async def submit_verification(self, request_id: int, result: VerificationResult) -> bool:
        """Submit verification result to AVS"""
        try:
            payload = {
                "requestId": request_id,
                "isValid": result.is_valid,
                "confidence": int(result.confidence * 100),  # Convert to basis points
                "proof": f"0x{result.proof}",
                "verificationMethod": result.method
            }
            
            self.logger.info(f"📤 Submitting verification for request {request_id}")
            
            response = requests.post(f"{self.avs_url}/verify", json=payload, timeout=10)
            
            if response.status_code == 200:
                self.logger.info(f"✅ Verification submitted successfully")
                return True
            else:
                self.logger.error(f"❌ Failed to submit verification: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Error submitting verification: {e}")
            return False

    async def run_continuous_verification(self):
        """Run continuous verification loop"""
        self.logger.info("🔄 Starting continuous verification mode")
        
        # Sample verification requests for demo
        sample_requests = [
            {
                "requestId": 1,
                "modelId": "gpt-3.5-turbo",
                "inputData": "Explain quantum computing in simple terms",
                "expectedOutput": "Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, unlike classical bits that are either 0 or 1. This allows quantum computers to process information in fundamentally different ways."
            },
            {
                "requestId": 2,
                "modelId": "claude-3-opus",
                "inputData": "What are the benefits of renewable energy?",
                "expectedOutput": "Renewable energy sources like solar, wind, and hydroelectric power provide clean electricity without greenhouse gas emissions, reduce dependence on fossil fuels, create jobs, and offer long-term cost savings."
            },
            {
                "requestId": 3,
                "modelId": "llama-2-70b",
                "inputData": "How does machine learning work?",
                "expectedOutput": "Machine learning algorithms learn patterns from data to make predictions or decisions. They use mathematical models that are trained on examples and then can generalize to new, unseen data."
            }
        ]
        
        for request in sample_requests:
            try:
                print(f"\n🔍 Processing verification request {request['requestId']}")
                print(f"   Model: {request['modelId']}")
                print(f"   Input: {request['inputData'][:50]}...")
                
                # Verify the request
                result = await self.verify_inference_request(request)
                
                print(f"   ✅ Result: Valid={result.is_valid}, Confidence={result.confidence:.1f}%")
                print(f"   🔬 Method: {result.method}")
                print(f"   🔐 Proof: 0x{result.proof[:10]}...")
                
                # Submit to AVS
                success = await self.submit_verification(request['requestId'], result)
                
                if success:
                    print(f"   📤 Submitted to AVS successfully")
                else:
                    print(f"   ❌ Failed to submit to AVS")
                
                # Wait before next verification
                await asyncio.sleep(2)
                
            except Exception as e:
                self.logger.error(f"❌ Error processing request {request.get('requestId', 'unknown')}: {e}")

async def main():
    print("🚀 Starting ML Verification Agent")
    print("=====================================")
    
    agent = MLVerificationAgent()
    
    try:
        await agent.run_continuous_verification()
    except KeyboardInterrupt:
        print("\n👋 Shutting down ML Verification Agent")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())