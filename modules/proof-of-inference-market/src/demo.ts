#!/usr/bin/env tsx

import { ethers } from 'ethers';
import { ERC8004Client } from '@verifagents/common';
import { InferenceMarketService } from './services/InferenceMarketService';
import { InferenceValidator } from './agents/InferenceValidator';
import { 
  ModelListing, 
  InferenceRequest, 
  InferenceResult,
  ModelType,
  InferenceTask
} from './types';

// Demo configuration
const DEMO_CONFIG = {
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
  privateKey: process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
  erc8004Registry: '0x1234567890123456789012345678901234567890',
  inferenceMarketAddress: '0x1234567890123456789012345678901234567890'
};

async function runDemo(scenario: string) {
  console.log('🚀 Starting VerifAgents Proof-of-Inference Market Demo');
  console.log(`📋 Scenario: ${scenario}`);
  console.log('=' .repeat(60));

  try {
    // Setup
    const provider = new ethers.JsonRpcProvider(DEMO_CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(DEMO_CONFIG.privateKey, provider);
    
    const erc8004Client = new ERC8004Client({
      registryAddress: DEMO_CONFIG.erc8004Registry,
      provider: provider as any,
      signer: wallet as any
    });

    const marketService = new InferenceMarketService(
      DEMO_CONFIG.inferenceMarketAddress,
      provider,
      erc8004Client
    );

    const validator = new InferenceValidator(marketService, wallet.address);

    switch (scenario) {
      case 'list-model':
        await demoListModel(marketService);
        break;
      case 'request-inference':
        await demoRequestInference(marketService);
        break;
      case 'validate-inference':
        await demoValidateInference(validator);
        break;
      case 'stake-validator':
        await demoStakeValidator(validator);
        break;
      case 'full-workflow':
        await demoFullWorkflow(marketService, validator);
        break;
      default:
        console.log('❌ Unknown scenario. Available scenarios:');
        console.log('  - list-model');
        console.log('  - request-inference');
        console.log('  - validate-inference');
        console.log('  - stake-validator');
        console.log('  - full-workflow');
        return;
    }

    console.log('✅ Demo completed successfully!');
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

async function demoListModel(marketService: InferenceMarketService) {
  console.log('\n📋 Listing Model...');
  
  const modelListing: ModelListing = {
    id: `model-${Date.now()}`,
    name: 'GPT-4 Verifiable',
    description: 'Verifiable GPT-4 model for text generation and classification',
    modelType: 'LLM' as ModelType,
    tasks: ['TEXT_GENERATION', 'TEXT_CLASSIFICATION', 'SUMMARIZATION'] as InferenceTask[],
    pricePerInference: ethers.parseEther('0.01').toString(),
    maxConcurrentRequests: 100,
    minStake: ethers.parseEther('1').toString(),
    totalStake: '0',
    validatorCount: 0,
    accuracy: 0.95,
    latency: 2000, // 2 seconds
    uptime: 0.99,
    isActive: true,
    owner: '0x1234567890123456789012345678901234567890',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const txHash = await marketService.listModel(modelListing);
  console.log(`✅ Model listed: ${modelListing.id}`);
  console.log(`🤖 Name: ${modelListing.name}`);
  console.log(`💰 Price: ${ethers.formatEther(modelListing.pricePerInference)} ETH`);
  console.log(`📄 Transaction: ${txHash}`);
}

async function demoRequestInference(marketService: InferenceMarketService) {
  console.log('\n🔄 Requesting Inference...');
  
  const request: InferenceRequest = {
    id: `request-${Date.now()}`,
    modelId: 'model-123',
    input: {
      prompt: 'Explain the concept of verifiable AI in blockchain systems',
      maxTokens: 200,
      temperature: 0.7
    },
    task: 'TEXT_GENERATION' as InferenceTask,
    maxTokens: 200,
    temperature: 0.7,
    topP: 0.9,
    timeout: 300000, // 5 minutes
    reward: ethers.parseEther('0.01').toString(),
    requester: '0x1234567890123456789012345678901234567890',
    createdAt: new Date(),
    deadline: new Date(Date.now() + 300000)
  };

  const txHash = await marketService.requestInference(request);
  console.log(`✅ Inference requested: ${request.id}`);
  console.log(`🤖 Model: ${request.modelId}`);
  console.log(`📝 Task: ${request.task}`);
  console.log(`💰 Reward: ${ethers.formatEther(request.reward)} ETH`);
  console.log(`📄 Transaction: ${txHash}`);
}

async function demoValidateInference(validator: InferenceValidator) {
  console.log('\n🔍 Starting Inference Validation...');
  
  // Start the validator
  await validator.start(5000); // 5 second intervals for demo
  
  console.log('⏳ Running for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Stop the validator
  await validator.stop();
  
  console.log('✅ Inference validation demo completed');
}

async function demoStakeValidator(validator: InferenceValidator) {
  console.log('\n💰 Staking as Validator...');
  
  const modelId = 'model-123';
  const stakeAmount = ethers.parseEther('2').toString();
  
  const txHash = await validator.stakeForModel(modelId, stakeAmount);
  console.log(`✅ Staked as validator: ${modelId}`);
  console.log(`💰 Amount: ${ethers.formatEther(stakeAmount)} ETH`);
  console.log(`📄 Transaction: ${txHash}`);
}

async function demoFullWorkflow(marketService: InferenceMarketService, validator: InferenceValidator) {
  console.log('\n🔄 Running Full Workflow Demo...');
  
  // 1. List model
  console.log('\n1️⃣ Listing Model...');
  await demoListModel(marketService);
  
  // 2. Stake as validator
  console.log('\n2️⃣ Staking as Validator...');
  await demoStakeValidator(validator);
  
  // 3. Request inference
  console.log('\n3️⃣ Requesting Inference...');
  await demoRequestInference(marketService);
  
  // 4. Start validation
  console.log('\n4️⃣ Starting Validation...');
  await demoValidateInference(validator);
  
  // 5. Get validator performance
  console.log('\n5️⃣ Getting Validator Performance...');
  const performance = await validator.getPerformance();
  console.log(`📊 Validator Performance:`);
  console.log(`   Total Inferences: ${performance.totalInferences}`);
  console.log(`   Verified Inferences: ${performance.verifiedInferences}`);
  console.log(`   Accuracy: ${(performance.accuracy * 100).toFixed(2)}%`);
  console.log(`   Average Latency: ${performance.averageLatency}ms`);
  console.log(`   Uptime: ${(performance.uptime * 100).toFixed(2)}%`);
  console.log(`   Total Rewards: ${ethers.formatEther(performance.totalRewards)} ETH`);
  console.log(`   Reputation Score: ${performance.reputationScore}`);
  
  console.log('\n✅ Full workflow demo completed!');
}

// CLI handling
const scenario = process.argv[2] || 'full-workflow';
runDemo(scenario).catch(console.error);