import { ethers } from 'ethers';
import { ERC8004Client } from '@verifagents/common';
import { 
  InferenceMarketService as IInferenceMarketService,
  ModelListing,
  InferenceRequest,
  InferenceResult,
  Challenge,
  ValidatorStake,
  Delegation,
  ModelFilters,
  ValidatorPerformance,
  MarketMetrics
} from '../types';

export class InferenceMarketService implements IInferenceMarketService {
  private contract: ethers.Contract;
  private erc8004Client: ERC8004Client;
  private provider: ethers.Provider;

  constructor(
    contractAddress: string,
    provider: ethers.Provider,
    erc8004Client: ERC8004Client
  ) {
    this.provider = provider;
    this.erc8004Client = erc8004Client;
    this.contract = new ethers.Contract(contractAddress, [], provider);
  }

  async listModel(listing: ModelListing): Promise<string> {
    try {
      const tx = await this.contract.listModel(
        listing.id,
        listing.name,
        listing.description,
        this.getModelTypeEnum(listing.modelType),
        listing.tasks.map(t => this.getTaskEnum(t)),
        listing.pricePerInference,
        listing.maxConcurrentRequests,
        listing.minStake
      );

      const receipt = await tx.wait();

      // Create ERC-8004 receipt for model listing
      await this.erc8004Client.createReceipt({
        agentId: 'inference-market-manager',
        taskId: `list-model-${listing.id}`,
        result: {
          modelId: listing.id,
          name: listing.name,
          modelType: listing.modelType,
          pricePerInference: listing.pricePerInference,
          status: 'listed'
        },
        metadata: {
          type: 'model_listing',
          modelId: listing.id,
          modelType: listing.modelType
        }
      });

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Failed to list model: ${error.message}`);
    }
  }

  async requestInference(request: InferenceRequest): Promise<string> {
    try {
      const tx = await this.contract.requestInference(
        request.id,
        request.modelId,
        this.encodeInput(request.input),
        this.getTaskEnum(request.task),
        request.maxTokens || 0,
        request.temperature || 0,
        request.topP || 0,
        request.timeout || 0,
        { value: request.reward }
      );

      const receipt = await tx.wait();

      // Create ERC-8004 receipt for inference request
      await this.erc8004Client.createReceipt({
        agentId: request.requester,
        taskId: `request-inference-${request.id}`,
        result: {
          requestId: request.id,
          modelId: request.modelId,
          task: request.task,
          reward: request.reward,
          status: 'requested'
        },
        metadata: {
          type: 'inference_request',
          requestId: request.id,
          modelId: request.modelId
        }
      });

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Failed to request inference: ${error.message}`);
    }
  }

  async submitResult(result: InferenceResult): Promise<string> {
    try {
      const tx = await this.contract.submitResult(
        result.id,
        result.requestId,
        this.encodeOutput(result.output),
        Math.floor(result.confidence * 10000), // Convert to basis points
        result.latency,
        result.verificationProof || ''
      );

      const receipt = await tx.wait();

      // Create ERC-8004 receipt for inference result
      await this.erc8004Client.createReceipt({
        agentId: result.validator,
        taskId: `submit-result-${result.id}`,
        result: {
          resultId: result.id,
          requestId: result.requestId,
          modelId: result.modelId,
          confidence: result.confidence,
          latency: result.latency,
          status: 'submitted'
        },
        metadata: {
          type: 'inference_result',
          resultId: result.id,
          modelId: result.modelId
        }
      });

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Failed to submit result: ${error.message}`);
    }
  }

  async verifyInference(resultId: string, validator: string): Promise<string> {
    try {
      // Generate merkle proof (simplified)
      const merkleProof = this.generateMerkleProof(resultId, validator);
      
      const tx = await this.contract.verifyInference(resultId, merkleProof);
      const receipt = await tx.wait();

      // Create ERC-8004 receipt for verification
      await this.erc8004Client.createReceipt({
        agentId: validator,
        taskId: `verify-inference-${resultId}`,
        result: {
          resultId,
          validator,
          status: 'verified'
        },
        metadata: {
          type: 'inference_verification',
          resultId
        }
      });

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Failed to verify inference: ${error.message}`);
    }
  }

  async challengeResult(challenge: Challenge): Promise<string> {
    try {
      const tx = await this.contract.challengeResult(
        challenge.id,
        challenge.resultId,
        challenge.reason,
        challenge.evidence,
        { value: challenge.stakeAmount }
      );

      const receipt = await tx.wait();

      // Create ERC-8004 receipt for challenge
      await this.erc8004Client.createReceipt({
        agentId: challenge.challenger,
        taskId: `challenge-result-${challenge.id}`,
        result: {
          challengeId: challenge.id,
          resultId: challenge.resultId,
          reason: challenge.reason,
          stakeAmount: challenge.stakeAmount,
          status: 'submitted'
        },
        metadata: {
          type: 'inference_challenge',
          challengeId: challenge.id,
          resultId: challenge.resultId
        }
      });

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Failed to challenge result: ${error.message}`);
    }
  }

  async stakeValidator(validator: string, modelId: string, amount: string): Promise<string> {
    try {
      const tx = await this.contract.stakeValidator(modelId, { value: amount });
      const receipt = await tx.wait();

      // Create ERC-8004 receipt for staking
      await this.erc8004Client.createReceipt({
        agentId: validator,
        taskId: `stake-validator-${modelId}`,
        result: {
          validator,
          modelId,
          amount,
          status: 'staked'
        },
        metadata: {
          type: 'validator_staking',
          modelId
        }
      });

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Failed to stake validator: ${error.message}`);
    }
  }

  async delegateStake(delegation: Delegation): Promise<string> {
    try {
      const tx = await this.contract.delegateStake(
        delegation.validator,
        delegation.modelId,
        { value: delegation.amount }
      );

      const receipt = await tx.wait();

      // Create ERC-8004 receipt for delegation
      await this.erc8004Client.createReceipt({
        agentId: delegation.delegator,
        taskId: `delegate-stake-${delegation.modelId}`,
        result: {
          delegator: delegation.delegator,
          validator: delegation.validator,
          modelId: delegation.modelId,
          amount: delegation.amount,
          status: 'delegated'
        },
        metadata: {
          type: 'stake_delegation',
          modelId: delegation.modelId
        }
      });

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Failed to delegate stake: ${error.message}`);
    }
  }

  async getModelListings(filters?: ModelFilters): Promise<ModelListing[]> {
    try {
      // This would typically query events or a separate indexer
      // For now, return a placeholder
      return [];
    } catch (error) {
      throw new Error(`Failed to get model listings: ${error.message}`);
    }
  }

  async getInferenceHistory(requester: string): Promise<InferenceResult[]> {
    try {
      // This would typically query events or a separate indexer
      // For now, return a placeholder
      return [];
    } catch (error) {
      throw new Error(`Failed to get inference history: ${error.message}`);
    }
  }

  async getValidatorPerformance(validator: string): Promise<ValidatorPerformance> {
    try {
      // This would typically query events or a separate indexer
      // For now, return a placeholder
      return {
        validator,
        totalInferences: 0,
        verifiedInferences: 0,
        accuracy: 0,
        averageLatency: 0,
        uptime: 0,
        totalRewards: '0',
        slashingEvents: 0,
        reputationScore: 0
      };
    } catch (error) {
      throw new Error(`Failed to get validator performance: ${error.message}`);
    }
  }

  // Helper methods
  private encodeInput(input: any): string {
    // Convert input to bytes for smart contract
    return ethers.AbiCoder.defaultAbiCoder().encode(['string'], [JSON.stringify(input)]);
  }

  private encodeOutput(output: any): string {
    // Convert output to bytes for smart contract
    return ethers.AbiCoder.defaultAbiCoder().encode(['string'], [JSON.stringify(output)]);
  }

  private generateMerkleProof(resultId: string, validator: string): string[] {
    // Simplified merkle proof generation
    // In production, this would use a proper merkle tree implementation
    const leaf = ethers.keccak256(ethers.solidityPackedKeccak256(
      ['string', 'address', 'uint256'],
      [resultId, validator, Math.floor(Date.now() / 1000)]
    ));
    
    return [leaf];
  }

  private getModelTypeEnum(modelType: string): number {
    const modelTypeMap: Record<string, number> = {
      'LLM': 0,
      'VISION': 1,
      'AUDIO': 2,
      'MULTIMODAL': 3,
      'CUSTOM': 4
    };
    
    return modelTypeMap[modelType] || 0;
  }

  private getTaskEnum(task: string): number {
    const taskMap: Record<string, number> = {
      'TEXT_GENERATION': 0,
      'TEXT_CLASSIFICATION': 1,
      'IMAGE_CLASSIFICATION': 2,
      'OBJECT_DETECTION': 3,
      'SPEECH_RECOGNITION': 4,
      'TRANSLATION': 5,
      'SUMMARIZATION': 6,
      'QUESTION_ANSWERING': 7,
      'CUSTOM': 8
    };
    
    return taskMap[task] || 0;
  }
}