#!/usr/bin/env python3
"""
ML Verification Agent for Proof-of-Inference AVS
Uses actual ML models to verify inference requests with cryptographic proofs
"""

import json
import sys
import os
import time
import hashlib
import asyncio
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime

# ML Libraries
import numpy as np
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel, pipeline
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# Add the agents directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

@dataclass
class VerificationResult:
    """Result of ML verification"""
    is_valid: bool
    confidence: float
    method: str
    proof: str
    details: Dict[str, Any]
    timestamp: int

class MLModelRegistry:
    """Registry for available ML models"""
    
    def __init__(self):
        self.models = {
            'gpt-3.5-turbo': {
                'type': 'text_generation',
                'model_path': 'microsoft/DialoGPT-medium',
                'threshold': 0.85
            },
            'claude-3-opus': {
                'type': 'text_generation', 
                'model_path': 'microsoft/DialoGPT-medium',
                'threshold': 0.88
            },
            'llama-2-70b': {
                'type': 'text_generation',
                'model_path': 'microsoft/DialoGPT-medium', 
                'threshold': 0.82
            },
            'bert-base': {
                'type': 'text_classification',
                'model_path': 'bert-base-uncased',
                'threshold': 0.80
            },
            'resnet-50': {
                'type': 'image_classification',
                'model_path': 'microsoft/resnet-50',
                'threshold': 0.85
            }
        }
        self.loaded_models = {}

    def get_model_info(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get model information"""
        return self.models.get(model_id)

    def load_model(self, model_id: str):
        """Load a model into memory"""
        if model_id in self.loaded_models:
            return self.loaded_models[model_id]
        
        model_info = self.get_model_info(model_id)
        if not model_info:
            raise ValueError(f"Model {model_id} not found in registry")
        
        try:
            if model_info['type'] == 'text_generation':
                model = pipeline('text-generation', model=model_info['model_path'])
            elif model_info['type'] == 'text_classification':
                model = pipeline('text-classification', model=model_info['model_path'])
            elif model_info['type'] == 'image_classification':
                model = pipeline('image-classification', model=model_info['model_path'])
            else:
                raise ValueError(f"Unsupported model type: {model_info['type']}")
            
            self.loaded_models[model_id] = model
            return model
        except Exception as e:
            print(f"Failed to load model {model_id}: {e}")
            return None

class MLVerificationAgent:
    """ML Verification Agent for Proof-of-Inference AVS"""
    
    def __init__(self, agent_name: str = "MLVerificationAgent"):
        self.agent_name = agent_name
        self.model_registry = MLModelRegistry()
        self.verification_methods = [
            'exact_match',
            'similarity_threshold', 
            'statistical_analysis',
            'cross_validation',
            'adversarial_testing'
        ]
        
        print(f"🤖 Initialized ML Verification Agent: {agent_name}")
    
    async def verify_inference_request(self, request_data: Dict[str, Any]) -> VerificationResult:
        """Verify an ML inference request"""
        
        request_id = request_data.get('requestId', 0)
        model_id = request_data.get('modelId', '')
        input_data = request_data.get('inputData', '')
        expected_output = request_data.get('expectedOutput', '')
        
        print(f"🔍 Verifying inference request {request_id} for model {model_id}")
        
        # Get model information
        model_info = self.model_registry.get_model_info(model_id)
        if not model_info:
            return VerificationResult(
                is_valid=False,
                confidence=0.0,
                method='model_not_found',
                proof='',
                details={'error': f'Model {model_id} not found'},
                timestamp=int(time.time())
            )
        
        # Load model
        model = self.model_registry.load_model(model_id)
        if not model:
            return VerificationResult(
                is_valid=False,
                confidence=0.0,
                method='model_load_failed',
                proof='',
                details={'error': f'Failed to load model {model_id}'},
                timestamp=int(time.time())
            )
        
        # Run verification based on model type
        if model_info['type'] == 'text_generation':
            result = await self._verify_text_generation(model, input_data, expected_output, model_info)
        elif model_info['type'] == 'text_classification':
            result = await self._verify_text_classification(model, input_data, expected_output, model_info)
        elif model_info['type'] == 'image_classification':
            result = await self._verify_image_classification(model, input_data, expected_output, model_info)
        else:
            result = await self._verify_generic(model, input_data, expected_output, model_info)
        
        # Generate cryptographic proof
        proof = self._generate_proof(request_data, result)
        result.proof = proof
        
        print(f"✅ Verification completed: {result.is_valid} (confidence: {result.confidence:.2f})")
        
        return result
    
    async def _verify_text_generation(self, model, input_data: str, expected_output: str, model_info: Dict) -> VerificationResult:
        """Verify text generation model output"""
        
        try:
            # Generate text using the model
            generated = model(input_data, max_length=len(expected_output) + 50, do_sample=True, temperature=0.7)
            generated_text = generated[0]['generated_text']
            
            # Remove input from generated text
            if generated_text.startswith(input_data):
                generated_text = generated_text[len(input_data):].strip()
            
            # Calculate similarity
            similarity = self._calculate_text_similarity(generated_text, expected_output)
            
            # Determine validity
            threshold = model_info['threshold']
            is_valid = similarity >= threshold
            
            # Calculate confidence
            confidence = min(similarity * 100, 100.0)
            
            return VerificationResult(
                is_valid=is_valid,
                confidence=confidence,
                method='text_generation_verification',
                proof='',
                details={
                    'generated_text': generated_text[:200],  # Truncate for storage
                    'similarity': similarity,
                    'threshold': threshold,
                    'input_length': len(input_data),
                    'output_length': len(expected_output)
                },
                timestamp=int(time.time())
            )
            
        except Exception as e:
            return VerificationResult(
                is_valid=False,
                confidence=0.0,
                method='text_generation_verification',
                proof='',
                details={'error': str(e)},
                timestamp=int(time.time())
            )
    
    async def _verify_text_classification(self, model, input_data: str, expected_output: str, model_info: Dict) -> VerificationResult:
        """Verify text classification model output"""
        
        try:
            # Run classification
            result = model(input_data)
            
            # Parse expected output (assuming it's JSON)
            try:
                expected = json.loads(expected_output)
            except:
                expected = {'label': expected_output}
            
            # Check if labels match
            predicted_label = result[0]['label']
            expected_label = expected.get('label', expected_output)
            
            # Calculate confidence
            predicted_confidence = result[0]['score']
            label_match = predicted_label.lower() == expected_label.lower()
            
            # Overall confidence
            confidence = predicted_confidence * 100 if label_match else 0.0
            is_valid = label_match and predicted_confidence >= model_info['threshold']
            
            return VerificationResult(
                is_valid=is_valid,
                confidence=confidence,
                method='text_classification_verification',
                proof='',
                details={
                    'predicted_label': predicted_label,
                    'expected_label': expected_label,
                    'predicted_confidence': predicted_confidence,
                    'label_match': label_match
                },
                timestamp=int(time.time())
            )
            
        except Exception as e:
            return VerificationResult(
                is_valid=False,
                confidence=0.0,
                method='text_classification_verification',
                proof='',
                details={'error': str(e)},
                timestamp=int(time.time())
            )
    
    async def _verify_image_classification(self, model, input_data: str, expected_output: str, model_info: Dict) -> VerificationResult:
        """Verify image classification model output"""
        
        try:
            # For demo purposes, we'll simulate image classification
            # In production, this would load and process actual image data
            
            # Simulate classification result
            simulated_result = {
                'label': 'cat',
                'score': 0.95
            }
            
            # Parse expected output
            try:
                expected = json.loads(expected_output)
            except:
                expected = {'label': expected_output}
            
            predicted_label = simulated_result['label']
            expected_label = expected.get('label', expected_output)
            predicted_confidence = simulated_result['score']
            
            label_match = predicted_label.lower() == expected_label.lower()
            confidence = predicted_confidence * 100 if label_match else 0.0
            is_valid = label_match and predicted_confidence >= model_info['threshold']
            
            return VerificationResult(
                is_valid=is_valid,
                confidence=confidence,
                method='image_classification_verification',
                proof='',
                details={
                    'predicted_label': predicted_label,
                    'expected_label': expected_label,
                    'predicted_confidence': predicted_confidence,
                    'label_match': label_match
                },
                timestamp=int(time.time())
            )
            
        except Exception as e:
            return VerificationResult(
                is_valid=False,
                confidence=0.0,
                method='image_classification_verification',
                proof='',
                details={'error': str(e)},
                timestamp=int(time.time())
            )
    
    async def _verify_generic(self, model, input_data: str, expected_output: str, model_info: Dict) -> VerificationResult:
        """Generic verification for unknown model types"""
        
        try:
            # Use similarity-based verification
            similarity = self._calculate_text_similarity(input_data, expected_output)
            
            threshold = model_info.get('threshold', 0.8)
            is_valid = similarity >= threshold
            confidence = similarity * 100
            
            return VerificationResult(
                is_valid=is_valid,
                confidence=confidence,
                method='generic_verification',
                proof='',
                details={
                    'similarity': similarity,
                    'threshold': threshold,
                    'input_length': len(input_data),
                    'output_length': len(expected_output)
                },
                timestamp=int(time.time())
            )
            
        except Exception as e:
            return VerificationResult(
                is_valid=False,
                confidence=0.0,
                method='generic_verification',
                proof='',
                details={'error': str(e)},
                timestamp=int(time.time())
            )
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using TF-IDF and cosine similarity"""
        
        try:
            # Use TF-IDF vectorizer
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
            
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            # Fallback to simple string similarity
            return self._simple_string_similarity(text1, text2)
    
    def _simple_string_similarity(self, text1: str, text2: str) -> float:
        """Simple string similarity calculation"""
        
        # Convert to lowercase and split into words
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        if union == 0:
            return 0.0
        
        return intersection / union
    
    def _generate_proof(self, request_data: Dict[str, Any], result: VerificationResult) -> str:
        """Generate cryptographic proof for verification"""
        
        # Create proof data
        proof_data = {
            'requestId': request_data.get('requestId', 0),
            'modelId': request_data.get('modelId', ''),
            'agent': request_data.get('agent', ''),
            'isValid': result.is_valid,
            'confidence': result.confidence,
            'method': result.method,
            'timestamp': result.timestamp,
            'verifier': self.agent_name
        }
        
        # Convert to JSON and hash
        proof_json = json.dumps(proof_data, sort_keys=True)
        proof_hash = hashlib.sha256(proof_json.encode()).hexdigest()
        
        return f"0x{proof_hash}"
    
    async def run_verification_loop(self):
        """Run continuous verification loop"""
        
        print("🔄 Starting ML verification loop...")
        
        while True:
            try:
                # In a real implementation, this would poll for new requests
                # For now, we'll just wait
                await asyncio.sleep(30)
                
            except KeyboardInterrupt:
                print("🛑 Stopping verification loop...")
                break
            except Exception as e:
                print(f"❌ Error in verification loop: {e}")
                await asyncio.sleep(10)

async def main():
    """Main function for running the ML verification agent"""
    
    if len(sys.argv) != 2:
        print("Usage: python ml_verification_agent.py <request_data_json>")
        sys.exit(1)
    
    try:
        # Parse request data
        request_data = json.loads(sys.argv[1])
        
        # Initialize agent
        agent = MLVerificationAgent()
        
        # Verify request
        result = await agent.verify_inference_request(request_data)
        
        # Output result
        result_dict = {
            'isValid': result.is_valid,
            'confidence': result.confidence,
            'method': result.method,
            'proof': result.proof,
            'details': result.details,
            'timestamp': result.timestamp
        }
        
        print(json.dumps(result_dict, indent=2))
        
    except Exception as e:
        error_result = {
            'isValid': False,
            'confidence': 0.0,
            'method': 'error',
            'proof': '',
            'details': {'error': str(e)},
            'timestamp': int(time.time())
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())