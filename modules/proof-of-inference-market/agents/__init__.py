"""
Proof-of-Inference AVS Agents Package

This package contains all the ML verification agents for the Proof-of-Inference AVS system.
Integrates with EigenLayer, ERC-8004 receipts, and 4Mica payments.
"""

from .ml_verification_agent import MLVerificationAgent
from .inference_validator_agent import InferenceValidatorAgent
from .agent_sdk import ProofOfInferenceSDK

__version__ = "1.0.0"
__all__ = ["MLVerificationAgent", "InferenceValidatorAgent", "ProofOfInferenceSDK"]