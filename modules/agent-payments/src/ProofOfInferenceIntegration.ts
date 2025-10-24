/**
 * Proof-of-Inference Market Integration with 4Mica Payments
 * 
 * This module integrates the Proof-of-Inference AVS with 4Mica payments
 * to create a complete autonomous agent ML verification system.
 */

import { AgentPaymentService, FourMicaConfig } from './AgentPaymentService';
import { ethers } from 'ethers';

// Proof-of-Inference AVS Types
export interface InferenceRequest {
  requestId: number;
  agent: string;
  modelId: string;
  inputData: string;
  expectedOutput: string;
  reward: string;
  deadline: number;
  completed: boolean;
  verified: boolean;
  timestamp: number;
  requestHash: string;
}

export interface VerificationResult {
  verifier: string;
  isValid: boolean;
  confidence: number;
  proof: string;
  timestamp: number;
  gasUsed: number;
  verificationMethod: string;
}

export interface ModelInfo {
  modelId: string;
  owner: string;
  verificationFee: string;
  isActive: boolean;
  totalInferences: number;
  successfulVerifications: number;
  accuracy: number;
}

export interface ProofOfInferenceConfig {
  avsAddress: string;
  rpcUrl: string;
  privateKey: string;
  agentId: string;
  fourMicaConfig: FourMicaConfig;
}

/**
 * Proof-of-Inference Market Service
 * 
 * Integrates ML verification with 4Mica payments for autonomous agent economies
 */
export class ProofOfInferenceService {
  private avsContract: ethers.Contract;
  private paymentService: AgentPaymentService;
  private config: ProofOfInferenceConfig;
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;

  constructor(config: ProofOfInferenceConfig, erc8004Client: any) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    
    // Initialize 4Mica payment service
    this.paymentService = new AgentPaymentService(config.fourMicaConfig, erc8004Client);
    
    // Initialize AVS contract
    this.avsContract = new ethers.Contract(
      config.avsAddress,
      this.getAVSABI(),
      this.wallet
    );
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing Proof-of-Inference Service');
    
    // Initialize payment service
    await this.paymentService.initialize();
    
    // Register agent with payment service
    await this.paymentService.registerAgent(
      this.config.agentId,
      this.wallet.address
    );
    
    console.log('✅ Proof-of-Inference Service initialized');
  }

  /**
   * Request ML inference verification
   */
  async requestInferenceVerification(
    modelId: string,
    inputData: any,
    expectedOutput: any,
    reward: string,
    deadline: number
  ): Promise<{ requestId: number; txHash: string }> {
    console.log(`🔍 Requesting ML inference verification for model: ${modelId}`);
    
    try {
      // Encode input data
      const inputDataBytes = ethers.toUtf8Bytes(JSON.stringify(inputData));
      const expectedOutputBytes = ethers.toUtf8Bytes(JSON.stringify(expectedOutput));
      
      // Calculate verification fee
      const verificationFee = this.calculateVerificationFee(reward);
      const totalCost = BigInt(reward) + BigInt(verificationFee);
      
      // Create payment tab for verification fees
      const verificationAgentId = `verifier_${modelId}`;
      await this.paymentService.createPaymentTab(verificationAgentId, '1000.0');
      
      // Submit verification request
      const tx = await this.avsContract.requestInferenceVerification(
        modelId,
        inputDataBytes,
        expectedOutputBytes,
        reward,
        deadline,
        { value: totalCost }
      );
      
      const receipt = await tx.wait();
      const requestId = this.extractRequestIdFromReceipt(receipt);
      
      console.log(`✅ Inference verification requested: ${requestId}`);
      console.log(`📋 Transaction: ${tx.hash}`);
      
      return { requestId, txHash: tx.hash };
      
    } catch (error) {
      console.error('❌ Failed to request inference verification:', error);
      throw error;
    }
  }

  /**
   * Submit verification result (called by verifiers)
   */
  async submitVerification(
    requestId: number,
    isValid: boolean,
    confidence: number,
    proof: string,
    verificationMethod: string
  ): Promise<{ txHash: string }> {
    console.log(`✍️ Submitting verification for request: ${requestId}`);
    
    try {
      const proofBytes = ethers.toUtf8Bytes(proof);
      
      const tx = await this.avsContract.submitVerification(
        requestId,
        isValid,
        confidence,
        proofBytes,
        verificationMethod
      );
      
      const receipt = await tx.wait();
      
      console.log(`✅ Verification submitted: ${tx.hash}`);
      
      // If verification is successful, process payment
      if (isValid) {
        await this.processVerificationPayment(requestId);
      }
      
      return { txHash: tx.hash };
      
    } catch (error) {
      console.error('❌ Failed to submit verification:', error);
      throw error;
    }
  }

  /**
   * Process payment for successful verification
   */
  private async processVerificationPayment(requestId: number): Promise<void> {
    console.log(`💰 Processing payment for verified request: ${requestId}`);
    
    try {
      // Get request details
      const request = await this.getInferenceRequest(requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }
      
      // Create payment to agent
      const paymentResult = await this.paymentService.makePayment({
        recipientAgentId: `agent_${request.agent}`,
        amount: request.reward,
        description: `ML inference verification reward for model ${request.modelId}`,
        urgency: 'high',
        workReceiptId: `inference_${requestId}`
      });
      
      if (paymentResult.success) {
        console.log(`✅ Payment processed: ${paymentResult.receiptHash}`);
      } else {
        console.error('❌ Payment failed:', paymentResult.error);
      }
      
    } catch (error) {
      console.error('❌ Failed to process verification payment:', error);
    }
  }

  /**
   * Get inference request details
   */
  async getInferenceRequest(requestId: number): Promise<InferenceRequest | null> {
    try {
      const request = await this.avsContract.inferenceRequests(requestId);
      
      return {
        requestId,
        agent: request.agent,
        modelId: request.modelId,
        inputData: ethers.toUtf8String(request.inputData),
        expectedOutput: ethers.toUtf8String(request.expectedOutput),
        reward: request.reward.toString(),
        deadline: Number(request.deadline),
        completed: request.completed,
        verified: request.verified,
        timestamp: Number(request.timestamp),
        requestHash: request.requestHash
      };
    } catch (error) {
      console.error('❌ Failed to get inference request:', error);
      return null;
    }
  }

  /**
   * Get verification results for a request
   */
  async getVerificationResults(requestId: number): Promise<VerificationResult[]> {
    try {
      const results = await this.avsContract.getVerificationResults(requestId);
      
      return results.map((result: any) => ({
        verifier: result.verifier,
        isValid: result.isValid,
        confidence: Number(result.confidence),
        proof: ethers.toUtf8String(result.proof),
        timestamp: Number(result.timestamp),
        gasUsed: Number(result.gasUsed),
        verificationMethod: result.verificationMethod
      }));
    } catch (error) {
      console.error('❌ Failed to get verification results:', error);
      return [];
    }
  }

  /**
   * Register a new ML model
   */
  async registerModel(
    modelId: string,
    verificationFee: string
  ): Promise<{ txHash: string }> {
    console.log(`📝 Registering ML model: ${modelId}`);
    
    try {
      const tx = await this.avsContract.registerModel(modelId, verificationFee);
      const receipt = await tx.wait();
      
      console.log(`✅ Model registered: ${tx.hash}`);
      
      return { txHash: tx.hash };
      
    } catch (error) {
      console.error('❌ Failed to register model:', error);
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    try {
      const model = await this.avsContract.getModelInfo(modelId);
      
      return {
        modelId: model.modelId,
        owner: model.owner,
        verificationFee: model.verificationFee.toString(),
        isActive: model.isActive,
        totalInferences: Number(model.totalInferences),
        successfulVerifications: Number(model.successfulVerifications),
        accuracy: Number(model.accuracy)
      };
    } catch (error) {
      console.error('❌ Failed to get model info:', error);
      return null;
    }
  }

  /**
   * Get agent trust score
   */
  async getAgentTrustScore(agent: string): Promise<number> {
    try {
      const score = await this.avsContract.getAgentTrustScore(agent);
      return Number(score);
    } catch (error) {
      console.error('❌ Failed to get agent trust score:', error);
      return 0;
    }
  }

  /**
   * Check if request is verified
   */
  async isRequestVerified(requestId: number): Promise<boolean> {
    try {
      return await this.avsContract.isRequestVerified(requestId);
    } catch (error) {
      console.error('❌ Failed to check verification status:', error);
      return false;
    }
  }

  /**
   * Calculate verification fee
   */
  private calculateVerificationFee(reward: string): string {
    const rewardBigInt = BigInt(reward);
    const feeBps = 50; // 0.5%
    const fee = (rewardBigInt * BigInt(feeBps)) / BigInt(10000);
    return fee.toString();
  }

  /**
   * Extract request ID from transaction receipt
   */
  private extractRequestIdFromReceipt(receipt: any): number {
    // This would extract the request ID from the event logs
    // For now, return a mock ID
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * Get AVS contract ABI
   */
  private getAVSABI(): any[] {
    return [
      {
        "inputs": [
          {"name": "modelId", "type": "string"},
          {"name": "inputData", "type": "bytes"},
          {"name": "expectedOutput", "type": "bytes"},
          {"name": "reward", "type": "uint256"},
          {"name": "deadline", "type": "uint256"}
        ],
        "name": "requestInferenceVerification",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "payable",
        "type": "function"
      },
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
      },
      {
        "inputs": [{"name": "requestId", "type": "uint256"}],
        "name": "getVerificationResults",
        "outputs": [
          {
            "components": [
              {"name": "verifier", "type": "address"},
              {"name": "isValid", "type": "bool"},
              {"name": "confidence", "type": "uint256"},
              {"name": "proof", "type": "bytes"},
              {"name": "timestamp", "type": "uint256"},
              {"name": "gasUsed", "type": "uint256"},
              {"name": "verificationMethod", "type": "string"}
            ],
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "modelId", "type": "string"},
          {"name": "verificationFee", "type": "uint256"}
        ],
        "name": "registerModel",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "modelId", "type": "string"}],
        "name": "getModelInfo",
        "outputs": [
          {
            "components": [
              {"name": "modelId", "type": "string"},
              {"name": "owner", "type": "address"},
              {"name": "verificationFee", "type": "uint256"},
              {"name": "isActive", "type": "bool"},
              {"name": "totalInferences", "type": "uint256"},
              {"name": "successfulVerifications", "type": "uint256"},
              {"name": "accuracy", "type": "uint256"}
            ],
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"name": "agent", "type": "address"}],
        "name": "getAgentTrustScore",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"name": "requestId", "type": "uint256"}],
        "name": "isRequestVerified",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }
}

export default ProofOfInferenceService;