#!/usr/bin/env python3
"""
Inference Validator Agent for Proof-of-Inference AVS
Provides comprehensive validation of ML inference results
Following mins-underwriter-avs patterns
"""

import asyncio
import json
import time
import hashlib
import logging
import requests
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
import os
import re
from .agent_sdk import ProofOfInferenceSDK, VerificationRequest, VerificationResult, PaymentRequest, ReceiptRequest

@dataclass
class ValidationMetrics:
    semantic_coherence: float
    factual_accuracy: float
    response_completeness: float
    language_quality: float
    contextual_relevance: float
    overall_score: float

class InferenceValidatorAgent:
    """
    Advanced ML inference validator that performs comprehensive analysis
    Integrates with EigenLayer AVS, payment processing, and receipt generation
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.sdk = ProofOfInferenceSDK(config)
        self.agent_name = "InferenceValidatorAgent"
        self.logger = logging.getLogger(__name__)
        
        # Validation thresholds
        self.min_confidence_threshold = 70.0
        self.semantic_weight = 0.25
        self.accuracy_weight = 0.25
        self.completeness_weight = 0.20
        self.quality_weight = 0.15
        self.relevance_weight = 0.15
        
        # Model-specific validation strategies
        self.model_strategies = {
            'gpt': self._validate_gpt_response,
            'claude': self._validate_claude_response,
            'llama': self._validate_llama_response,
            'mistral': self._validate_mistral_response,
            'default': self._validate_generic_response
        }
        
        self.logger.info(f"🔍 Initializing {self.agent_name}")
        self.logger.info(f"   📏 Min Confidence Threshold: {self.min_confidence_threshold}%")
        self.logger.info(f"   🎯 Validation Strategies: {list(self.model_strategies.keys())}")

    async def validate_inference_comprehensive(self, request: VerificationRequest) -> VerificationResult:
        """
        Perform comprehensive validation of ML inference results
        """
        self.logger.info(f"🔍 Starting comprehensive validation for request {request.request_id}")
        self.logger.info(f"   🤖 Model: {request.model_id}")
        self.logger.info(f"   📝 Input length: {len(request.input_data)} chars")
        self.logger.info(f"   📤 Output length: {len(request.expected_output)} chars")
        
        start_time = time.time()
        
        # Step 1: Select validation strategy based on model
        strategy = self._select_validation_strategy(request.model_id)
        
        # Step 2: Run model-specific validation
        metrics = await strategy(request.input_data, request.expected_output, request.model_id)
        
        # Step 3: Calculate overall confidence score
        confidence = self._calculate_overall_confidence(metrics)
        
        # Step 4: Determine validity
        is_valid = confidence >= self.min_confidence_threshold
        
        # Step 5: Generate cryptographic proof
        proof = self.sdk.generate_proof_hash(
            request.request_id,
            is_valid,
            confidence,
            f"comprehensive_validation_{request.model_id}"
        )
        
        # Step 6: Create detailed validation result
        validation_time = time.time() - start_time
        
        result = VerificationResult(
            request_id=request.request_id,
            is_valid=is_valid,
            confidence=confidence,
            method=f"comprehensive_validation_{strategy.__name__}",
            proof=proof,
            timestamp=int(time.time()),
            model_id=request.model_id,
            details={
                "validation_metrics": {
                    "semantic_coherence": metrics.semantic_coherence,
                    "factual_accuracy": metrics.factual_accuracy,
                    "response_completeness": metrics.response_completeness,
                    "language_quality": metrics.language_quality,
                    "contextual_relevance": metrics.contextual_relevance,
                    "overall_score": metrics.overall_score
                },
                "validation_time": validation_time,
                "strategy_used": strategy.__name__,
                "input_analysis": {
                    "word_count": len(request.input_data.split()),
                    "sentence_count": request.input_data.count('.') + request.input_data.count('!') + request.input_data.count('?'),
                    "question_type": self._classify_question_type(request.input_data)
                },
                "output_analysis": {
                    "word_count": len(request.expected_output.split()),
                    "sentence_count": request.expected_output.count('.') + request.expected_output.count('!') + request.expected_output.count('?'),
                    "response_type": self._classify_response_type(request.expected_output)
                },
                "threshold_comparison": {
                    "required_confidence": self.min_confidence_threshold,
                    "achieved_confidence": confidence,
                    "margin": confidence - self.min_confidence_threshold
                }
            }
        )
        
        self.logger.info(f"✅ Comprehensive validation completed")
        self.logger.info(f"   🎯 Confidence: {confidence:.1f}%")
        self.logger.info(f"   ✅ Valid: {is_valid}")
        self.logger.info(f"   ⏱️ Validation time: {validation_time:.2f}s")
        
        return result

    def _select_validation_strategy(self, model_id: str) -> callable:
        """Select appropriate validation strategy based on model ID"""
        model_id_lower = model_id.lower()
        
        for model_type, strategy in self.model_strategies.items():
            if model_type != 'default' and model_type in model_id_lower:
                self.logger.info(f"🎯 Selected {model_type} validation strategy")
                return strategy
        
        self.logger.info("🎯 Selected default validation strategy")
        return self.model_strategies['default']

    async def _validate_gpt_response(self, input_data: str, output: str, model_id: str) -> ValidationMetrics:
        """GPT-specific validation focusing on coherence and factual accuracy"""
        await asyncio.sleep(0.1)  # Simulate processing time
        
        # Semantic coherence analysis
        semantic_score = self._analyze_semantic_coherence(input_data, output)
        
        # Factual accuracy (simulated for GPT's strength in factual responses)
        factual_score = min(90, semantic_score + 10)  # GPT tends to be factually accurate
        
        # Response completeness
        completeness_score = self._analyze_response_completeness(input_data, output)
        
        # Language quality (GPT's strength)
        quality_score = min(95, semantic_score + 15)  # GPT has excellent language quality
        
        # Contextual relevance
        relevance_score = self._analyze_contextual_relevance(input_data, output)
        
        # Overall score with GPT-specific weighting
        overall = (
            semantic_score * 0.20 +
            factual_score * 0.30 +  # Higher weight for factual accuracy
            completeness_score * 0.20 +
            quality_score * 0.20 +
            relevance_score * 0.10
        )
        
        return ValidationMetrics(
            semantic_coherence=semantic_score,
            factual_accuracy=factual_score,
            response_completeness=completeness_score,
            language_quality=quality_score,
            contextual_relevance=relevance_score,
            overall_score=overall
        )

    async def _validate_claude_response(self, input_data: str, output: str, model_id: str) -> ValidationMetrics:
        """Claude-specific validation focusing on thoughtfulness and structure"""
        await asyncio.sleep(0.1)
        
        # Semantic coherence (Claude's strength)
        semantic_score = min(95, self._analyze_semantic_coherence(input_data, output) + 10)
        
        # Factual accuracy
        factual_score = self._analyze_factual_indicators(input_data, output)
        
        # Response completeness (Claude tends to be thorough)
        completeness_score = min(90, self._analyze_response_completeness(input_data, output) + 15)
        
        # Language quality (very high for Claude)
        quality_score = min(98, semantic_score + 5)
        
        # Contextual relevance (Claude's strength)
        relevance_score = min(95, self._analyze_contextual_relevance(input_data, output) + 10)
        
        # Overall score with Claude-specific weighting
        overall = (
            semantic_score * 0.30 +  # Higher weight for semantic coherence
            factual_score * 0.20 +
            completeness_score * 0.25 +  # Higher weight for completeness
            quality_score * 0.15 +
            relevance_score * 0.10
        )
        
        return ValidationMetrics(
            semantic_coherence=semantic_score,
            factual_accuracy=factual_score,
            response_completeness=completeness_score,
            language_quality=quality_score,
            contextual_relevance=relevance_score,
            overall_score=overall
        )

    async def _validate_llama_response(self, input_data: str, output: str, model_id: str) -> ValidationMetrics:
        """LLaMA-specific validation with focus on technical accuracy"""
        await asyncio.sleep(0.1)
        
        # Semantic coherence
        semantic_score = self._analyze_semantic_coherence(input_data, output)
        
        # Factual accuracy (good but not best)
        factual_score = max(60, semantic_score - 5)
        
        # Response completeness
        completeness_score = self._analyze_response_completeness(input_data, output)
        
        # Language quality (generally good)
        quality_score = max(70, semantic_score)
        
        # Contextual relevance
        relevance_score = self._analyze_contextual_relevance(input_data, output)
        
        # Overall score with LLaMA-specific weighting
        overall = (
            semantic_score * 0.25 +
            factual_score * 0.25 +
            completeness_score * 0.25 +
            quality_score * 0.15 +
            relevance_score * 0.10
        )
        
        return ValidationMetrics(
            semantic_coherence=semantic_score,
            factual_accuracy=factual_score,
            response_completeness=completeness_score,
            language_quality=quality_score,
            contextual_relevance=relevance_score,
            overall_score=overall
        )

    async def _validate_mistral_response(self, input_data: str, output: str, model_id: str) -> ValidationMetrics:
        """Mistral-specific validation"""
        await asyncio.sleep(0.1)
        
        # Semantic coherence
        semantic_score = self._analyze_semantic_coherence(input_data, output)
        
        # Factual accuracy
        factual_score = max(65, semantic_score - 3)
        
        # Response completeness
        completeness_score = self._analyze_response_completeness(input_data, output)
        
        # Language quality
        quality_score = max(75, semantic_score + 5)
        
        # Contextual relevance
        relevance_score = self._analyze_contextual_relevance(input_data, output)
        
        # Overall score
        overall = (
            semantic_score * self.semantic_weight +
            factual_score * self.accuracy_weight +
            completeness_score * self.completeness_weight +
            quality_score * self.quality_weight +
            relevance_score * self.relevance_weight
        )
        
        return ValidationMetrics(
            semantic_coherence=semantic_score,
            factual_accuracy=factual_score,
            response_completeness=completeness_score,
            language_quality=quality_score,
            contextual_relevance=relevance_score,
            overall_score=overall
        )

    async def _validate_generic_response(self, input_data: str, output: str, model_id: str) -> ValidationMetrics:
        """Generic validation for unknown models"""
        await asyncio.sleep(0.1)
        
        # Basic validation metrics
        semantic_score = self._analyze_semantic_coherence(input_data, output)
        factual_score = max(50, semantic_score - 10)  # Conservative for unknown models
        completeness_score = self._analyze_response_completeness(input_data, output)
        quality_score = max(60, semantic_score)
        relevance_score = self._analyze_contextual_relevance(input_data, output)
        
        # Overall score with balanced weighting
        overall = (
            semantic_score * self.semantic_weight +
            factual_score * self.accuracy_weight +
            completeness_score * self.completeness_weight +
            quality_score * self.quality_weight +
            relevance_score * self.relevance_weight
        )
        
        return ValidationMetrics(
            semantic_coherence=semantic_score,
            factual_accuracy=factual_score,
            response_completeness=completeness_score,
            language_quality=quality_score,
            contextual_relevance=relevance_score,
            overall_score=overall
        )

    def _analyze_semantic_coherence(self, input_data: str, output: str) -> float:
        """Analyze semantic coherence between input and output"""
        # Word overlap analysis
        input_words = set(input_data.lower().split())
        output_words = set(output.lower().split())
        
        overlap = len(input_words.intersection(output_words))
        total_unique = len(input_words.union(output_words))
        
        if total_unique == 0:
            return 50.0
        
        # Base semantic score from word overlap
        semantic_base = (overlap / total_unique) * 100
        
        # Boost for appropriate response structure
        structure_bonus = 0
        if '?' in input_data and len(output) > 20:  # Question answered with substantial response
            structure_bonus = 15
        if any(word in input_data.lower() for word in ['explain', 'describe', 'how', 'what', 'why']) and len(output) > 50:
            structure_bonus = 20
        
        return min(95, semantic_base + structure_bonus + 30)  # Base boost for reasonable responses

    def _analyze_factual_indicators(self, input_data: str, output: str) -> float:
        """Analyze factual accuracy indicators"""
        # Look for factual indicators
        factual_indicators = [
            'according to', 'research shows', 'studies indicate', 'data suggests',
            'evidence', 'proven', 'verified', 'confirmed', 'established'
        ]
        
        indicator_count = sum(1 for indicator in factual_indicators if indicator in output.lower())
        
        # Base score
        base_score = 70
        
        # Bonus for factual language
        factual_bonus = min(20, indicator_count * 5)
        
        # Penalty for hedging language that might indicate uncertainty
        hedge_words = ['maybe', 'perhaps', 'possibly', 'might be', 'could be']
        hedge_penalty = sum(2 for hedge in hedge_words if hedge in output.lower())
        
        return max(50, base_score + factual_bonus - hedge_penalty)

    def _analyze_response_completeness(self, input_data: str, output: str) -> float:
        """Analyze how complete the response is"""
        input_length = len(input_data)
        output_length = len(output)
        
        # Base completeness from length ratio
        if input_length == 0:
            return 50.0
        
        length_ratio = output_length / input_length
        
        # Appropriate response length varies by question type
        if '?' in input_data:  # Question format
            target_ratio = 2.0  # Good answers are typically 2x the question length
        else:  # Statement or instruction
            target_ratio = 1.5
        
        # Score based on how close to target ratio
        if length_ratio >= target_ratio:
            completeness_score = 90
        elif length_ratio >= target_ratio * 0.5:
            completeness_score = 70 + (length_ratio / target_ratio) * 20
        else:
            completeness_score = max(30, 70 * (length_ratio / (target_ratio * 0.5)))
        
        # Bonus for structured responses
        structure_indicators = ['.', ':', ';', '1.', '2.', '-', '*']
        structure_count = sum(1 for indicator in structure_indicators if indicator in output)
        structure_bonus = min(10, structure_count)
        
        return min(95, completeness_score + structure_bonus)

    def _analyze_contextual_relevance(self, input_data: str, output: str) -> float:
        """Analyze contextual relevance of the response"""
        # Check for topic consistency
        input_keywords = self._extract_keywords(input_data)
        output_keywords = self._extract_keywords(output)
        
        if not input_keywords:
            return 70.0
        
        # Calculate keyword relevance
        relevant_keywords = len(set(input_keywords).intersection(set(output_keywords)))
        relevance_ratio = relevant_keywords / len(input_keywords)
        
        base_relevance = relevance_ratio * 80
        
        # Bonus for appropriate response type
        if '?' in input_data and len(output) > 10:  # Question answered
            base_relevance += 15
        
        return min(95, base_relevance + 20)  # Base boost

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text"""
        # Simple keyword extraction (remove common words)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'}
        
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        return keywords

    def _classify_question_type(self, input_data: str) -> str:
        """Classify the type of question/input"""
        input_lower = input_data.lower()
        
        if input_lower.startswith(('what', 'who', 'where', 'when', 'which')):
            return 'factual_question'
        elif input_lower.startswith(('how', 'why')):
            return 'explanatory_question'
        elif input_lower.startswith(('do', 'does', 'did', 'is', 'are', 'was', 'were', 'can', 'could', 'will', 'would')):
            return 'yes_no_question'
        elif 'explain' in input_lower or 'describe' in input_lower:
            return 'explanation_request'
        elif '?' in input_data:
            return 'general_question'
        else:
            return 'statement_or_instruction'

    def _classify_response_type(self, output: str) -> str:
        """Classify the type of response"""
        if len(output) < 20:
            return 'brief_response'
        elif len(output) < 100:
            return 'moderate_response'
        elif len(output) < 300:
            return 'detailed_response'
        else:
            return 'comprehensive_response'

    def _calculate_overall_confidence(self, metrics: ValidationMetrics) -> float:
        """Calculate overall confidence score from validation metrics"""
        return metrics.overall_score

    async def process_verification_request(self, request: VerificationRequest) -> Dict[str, Any]:
        """
        Process a complete verification request including payment and receipt generation
        """
        try:
            # Step 1: Perform validation
            verification_result = await self.validate_inference_comprehensive(request)
            
            # Step 2: Process payment if validation is successful
            payment_hash = None
            if verification_result.is_valid:
                payment_request = PaymentRequest(
                    request_id=request.request_id,
                    agent=request.agent,
                    amount=request.reward,
                    purpose="ML_INFERENCE_VALIDATION",
                    verification_data={
                        "isValid": verification_result.is_valid,
                        "confidence": verification_result.confidence,
                        "method": verification_result.method
                    }
                )
                payment_hash = await self.sdk.process_payment(payment_request)
            
            # Step 3: Generate receipt
            receipt_id = None
            if verification_result.is_valid:
                receipt_request = ReceiptRequest(
                    agent=request.agent,
                    bounty_id=request.request_id,
                    work_description=f"ML inference validation for model {request.model_id}",
                    result_hash=self.sdk.create_attestation_hash(verification_result),
                    result_uri=f"ipfs://validation-result-{request.request_id}",
                    value_generated=request.reward,
                    completion_time=verification_result.timestamp,
                    is_verified=verification_result.is_valid,
                    payment_hash=payment_hash or "",
                    metadata={
                        "modelId": request.model_id,
                        "confidence": verification_result.confidence,
                        "method": verification_result.method,
                        "validationMetrics": verification_result.details.get("validation_metrics", {}),
                        "agentName": self.agent_name
                    }
                )
                receipt_id = await self.sdk.generate_receipt(receipt_request)
            
            # Step 4: Submit to AVS
            avs_success = await self.sdk.submit_verification_to_avs(verification_result)
            
            return {
                "verification_result": verification_result,
                "payment_hash": payment_hash,
                "receipt_id": receipt_id,
                "avs_submitted": avs_success,
                "status": "success" if verification_result.is_valid else "invalid"
            }
            
        except Exception as e:
            self.logger.error(f"❌ Error processing verification request: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

async def main():
    """Main function for running the Inference Validator Agent"""
    print("🚀 Starting Inference Validator Agent")
    print("=====================================")
    
    agent = InferenceValidatorAgent()
    
    # Sample validation requests for testing
    sample_requests = [
        VerificationRequest(
            request_id=1,
            model_id="gpt-3.5-turbo",
            input_data="Explain the principles of quantum computing in simple terms",
            expected_output="Quantum computing leverages quantum mechanical phenomena like superposition and entanglement to process information. Unlike classical bits that are either 0 or 1, quantum bits (qubits) can exist in multiple states simultaneously, allowing quantum computers to perform certain calculations exponentially faster than classical computers.",
            agent="0x1234567890123456789012345678901234567890",
            deadline=int(time.time()) + 3600,
            reward="1000000"  # 1 USDC
        ),
        VerificationRequest(
            request_id=2,
            model_id="claude-3-opus",
            input_data="What are the environmental benefits of renewable energy?",
            expected_output="Renewable energy sources like solar, wind, and hydroelectric power offer significant environmental benefits. They produce electricity without emitting greenhouse gases during operation, helping mitigate climate change. They also reduce air pollution, preserve water resources, and minimize habitat destruction compared to fossil fuel extraction and burning.",
            agent="0x1234567890123456789012345678901234567890",
            deadline=int(time.time()) + 3600,
            reward="1500000"  # 1.5 USDC
        )
    ]
    
    try:
        for request in sample_requests:
            print(f"\n🔍 Processing validation request {request.request_id}")
            print(f"   Model: {request.model_id}")
            print(f"   Input: {request.input_data[:50]}...")
            
            # Process the full verification request
            result = await agent.process_verification_request(request)
            
            print(f"   Status: {result['status']}")
            if result['status'] == 'success':
                verification = result['verification_result']
                print(f"   ✅ Valid: {verification.is_valid}")
                print(f"   🎯 Confidence: {verification.confidence:.1f}%")
                print(f"   🔬 Method: {verification.method}")
                print(f"   💰 Payment Hash: {result['payment_hash'][:10] if result['payment_hash'] else 'None'}...")
                print(f"   🧾 Receipt ID: {result['receipt_id']}")
                print(f"   📤 AVS Submitted: {result['avs_submitted']}")
            
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\n👋 Shutting down Inference Validator Agent")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())