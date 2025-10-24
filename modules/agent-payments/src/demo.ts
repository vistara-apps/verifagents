#!/usr/bin/env tsx

/**
 * Agent-to-Agent Payments Demo with 4Mica Integration
 * 
 * This demo showcases how VerifAgents can use 4Mica's tab-based payment system
 * for autonomous agent economy loops with sub-second transactions.
 */

import { AgentPaymentService } from './AgentPaymentService';
import { FourMicaConfig } from './AgentPaymentService';

// Mock ERC-8004 Client for demo
class MockERC8004Client {
  async createReceipt(data: any): Promise<string> {
    console.log('🎫 Creating ERC-8004 receipt:', data);
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }
}

// Demo configuration
const DEMO_CONFIG: FourMicaConfig = {
  rpcUrl: 'http://localhost:3000', // 4Mica RPC endpoint
  walletPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  ethereumHttpRpcUrl: 'http://localhost:8545',
  contractAddress: '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0',
  agentId: 'agent_001'
};

const RECIPIENT_CONFIG: FourMicaConfig = {
  rpcUrl: 'http://localhost:3000',
  walletPrivateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  ethereumHttpRpcUrl: 'http://localhost:8545',
  contractAddress: '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0',
  agentId: 'agent_002'
};

async function runAgentPaymentDemo() {
  console.log('🚀 Starting Agent-to-Agent Payments Demo with 4Mica Integration\n');
  console.log('=' .repeat(70));

  try {
    // Initialize payment services
    const erc8004Client = new MockERC8004Client();
    
    const payerService = new AgentPaymentService(DEMO_CONFIG, erc8004Client);
    const recipientService = new AgentPaymentService(RECIPIENT_CONFIG, erc8004Client);

    await payerService.initialize();
    await recipientService.initialize();

    // Register agents with each other
    await payerService.registerAgent('agent_002', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
    await recipientService.registerAgent('agent_001', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');

    console.log('\n📋 Demo Scenario 1: Creating Payment Tab\n');
    
    // Create a payment tab
    const tab = await payerService.createPaymentTab('agent_002', '1000.0', 24);
    console.log(`✅ Payment tab created:`);
    console.log(`   Tab ID: ${tab.tabId}`);
    console.log(`   Max Credit: ${tab.maxCredit} ETH`);
    console.log(`   Expires: ${new Date(tab.expiresAt).toLocaleString()}`);

    console.log('\n💸 Demo Scenario 2: Making Payments\n');
    
    // Make several payments
    const payments = [
      {
        recipientAgentId: 'agent_002',
        amount: '50.0',
        description: 'Data processing service',
        urgency: 'high' as const,
        workReceiptId: 'work_001'
      },
      {
        recipientAgentId: 'agent_002',
        amount: '75.0',
        description: 'ML model inference',
        urgency: 'medium' as const,
        workReceiptId: 'work_002'
      },
      {
        recipientAgentId: 'agent_002',
        amount: '25.0',
        description: 'API call processing',
        urgency: 'low' as const,
        workReceiptId: 'work_003'
      }
    ];

    const paymentResults = [];
    for (const payment of payments) {
      console.log(`\n💸 Making payment: ${payment.description}`);
      const result = await payerService.makePayment(payment);
      
      if (result.success) {
        console.log(`✅ Payment successful:`);
        console.log(`   Request ID: ${result.reqId}`);
        console.log(`   Amount: ${payment.amount} ETH`);
        console.log(`   Receipt: ${result.receiptHash}`);
        paymentResults.push(result);
      } else {
        console.log(`❌ Payment failed: ${result.error}`);
      }
    }

    console.log('\n📊 Demo Scenario 3: Payment Analytics\n');
    
    // Show payment analytics
    const analytics = await payerService.getPaymentAnalytics();
    console.log('📈 Payment Analytics:');
    console.log(`   Total Tabs: ${analytics.totalTabs}`);
    console.log(`   Active Tabs: ${analytics.activeTabs}`);
    console.log(`   Total Paid: ${analytics.totalPaid} ETH`);
    console.log(`   Total Remunerated: ${analytics.totalRemunerated} ETH`);
    console.log(`   Success Rate: ${analytics.successRate}%`);
    console.log(`   Avg Settlement Time: ${analytics.averageSettlementTime} minutes`);

    console.log('\n💰 Demo Scenario 4: Tab Settlement\n');
    
    // Settle the payment tab
    const settlementResult = await payerService.settleTab(tab.tabId);
    if (settlementResult.success) {
      console.log(`✅ Tab settled successfully:`);
      console.log(`   Transaction Hash: ${settlementResult.txHash}`);
      console.log(`   Total Amount: 150.0 ETH`);
    } else {
      console.log(`❌ Tab settlement failed`);
    }

    console.log('\n🎯 Demo Scenario 5: Autonomous Payment Decision\n');
    
    // Simulate autonomous payment decision based on work receipts
    const workReceipts = [
      {
        agentId: 'agent_002',
        taskId: 'work_004',
        result: { verified: true, confidence: 95, accuracy: 98.5 },
        metadata: { type: 'prediction_verification', value: 100.0 }
      },
      {
        agentId: 'agent_002',
        taskId: 'work_005',
        result: { verified: true, confidence: 87, accuracy: 92.3 },
        metadata: { type: 'research_analysis', value: 75.0 }
      }
    ];

    console.log('🧠 Making autonomous payment decisions based on work receipts...');
    
    for (const receipt of workReceipts) {
      const paymentAmount = calculatePaymentAmount(receipt);
      
      if (paymentAmount > 0) {
        const payment = await payerService.makePayment({
          recipientAgentId: receipt.agentId,
          amount: paymentAmount.toString(),
          description: `Autonomous payment for ${receipt.metadata.type}`,
          workReceiptId: receipt.taskId,
          urgency: 'high'
        });

        if (payment.success) {
          console.log(`✅ Autonomous payment made:`);
          console.log(`   Work: ${receipt.taskId}`);
          console.log(`   Amount: ${paymentAmount} ETH`);
          console.log(`   Confidence: ${receipt.result.confidence}%`);
        }
      }
    }

    console.log('\n🔍 Demo Scenario 6: Tab Status Monitoring\n');
    
    // Show tab status
    const activeTabs = payerService.getActiveTabs();
    console.log(`📋 Active Tabs: ${activeTabs.length}`);
    
    for (const activeTab of activeTabs) {
      console.log(`\n   Tab ${activeTab.tabId}:`);
      console.log(`   Recipient: ${activeTab.recipientAgentId}`);
      console.log(`   Status: ${activeTab.status}`);
      console.log(`   Transactions: ${activeTab.transactions.length}`);
      console.log(`   Current Paid: ${activeTab.currentPaid} ETH`);
      console.log(`   Current Remunerated: ${activeTab.currentRemunerated} ETH`);
    }

    console.log('\n✅ Demo Complete!\n');
    console.log('🎯 Key Takeaways:');
    console.log('• 4Mica enables tab-based payments like a bar tab system');
    console.log('• Cryptographic guarantees ensure payment security');
    console.log('• Sub-second transactions across any blockchain');
    console.log('• ERC-8004 receipts provide verifiable payment proof');
    console.log('• Autonomous agents can make payment decisions');
    console.log('• BLS signatures enable trustless remuneration');
    
    console.log('\n🚀 Perfect for autonomous AI agent economies! 🎬');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

/**
 * Calculate payment amount based on work receipt
 */
function calculatePaymentAmount(receipt: any): number {
  const baseValue = receipt.metadata?.value || 50.0;
  const confidence = receipt.result?.confidence || 50;
  const accuracy = receipt.result?.accuracy || 50;
  
  // Calculate payment based on work value, confidence, and accuracy
  const multiplier = (confidence / 100) * (accuracy / 100);
  return Math.round(baseValue * multiplier * 100) / 100;
}

/**
 * Run specific demo scenarios
 */
async function runScenario(scenario: string) {
  switch (scenario) {
    case 'basic-payment':
      await runBasicPaymentDemo();
      break;
    case 'autonomous-payment':
      await runAutonomousPaymentDemo();
      break;
    case 'tab-settlement':
      await runTabSettlementDemo();
      break;
    default:
      console.log('❌ Unknown scenario. Available: basic-payment, autonomous-payment, tab-settlement');
      process.exit(1);
  }
}

async function runBasicPaymentDemo() {
  console.log('💸 Basic Payment Demo\n');
  
  const erc8004Client = new MockERC8004Client();
  const service = new AgentPaymentService(DEMO_CONFIG, erc8004Client);
  
  await service.initialize();
  await service.registerAgent('agent_002', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  
  const payment = await service.makePayment({
    recipientAgentId: 'agent_002',
    amount: '100.0',
    description: 'Data processing service',
    urgency: 'high'
  });
  
  console.log('Payment Result:', payment);
}

async function runAutonomousPaymentDemo() {
  console.log('🤖 Autonomous Payment Demo\n');
  
  const erc8004Client = new MockERC8004Client();
  const service = new AgentPaymentService(DEMO_CONFIG, erc8004Client);
  
  await service.initialize();
  await service.registerAgent('agent_002', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  
  // Simulate work completion and autonomous payment
  const workReceipt = {
    agentId: 'agent_002',
    taskId: 'work_autonomous_001',
    result: { verified: true, confidence: 92, accuracy: 95.5 },
    metadata: { type: 'prediction_verification', value: 150.0 }
  };
  
  const paymentAmount = calculatePaymentAmount(workReceipt);
  const payment = await service.makePayment({
    recipientAgentId: workReceipt.agentId,
    amount: paymentAmount.toString(),
    description: `Autonomous payment for ${workReceipt.metadata.type}`,
    workReceiptId: workReceipt.taskId,
    urgency: 'high'
  });
  
  console.log('Autonomous Payment Result:', payment);
}

async function runTabSettlementDemo() {
  console.log('💰 Tab Settlement Demo\n');
  
  const erc8004Client = new MockERC8004Client();
  const service = new AgentPaymentService(DEMO_CONFIG, erc8004Client);
  
  await service.initialize();
  await service.registerAgent('agent_002', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
  
  // Create tab and make payments
  const tab = await service.createPaymentTab('agent_002', '500.0', 24);
  
  await service.makePayment({
    recipientAgentId: 'agent_002',
    amount: '100.0',
    description: 'Service 1',
    urgency: 'medium'
  });
  
  await service.makePayment({
    recipientAgentId: 'agent_002',
    amount: '150.0',
    description: 'Service 2',
    urgency: 'high'
  });
  
  // Settle the tab
  const settlement = await service.settleTab(tab.tabId);
  console.log('Settlement Result:', settlement);
}

// Handle command line arguments
const args = process.argv.slice(2);
const scenario = args.find(arg => arg.startsWith('--scenario='))?.split('=')[1];

if (scenario) {
  console.log(`🎭 Running specific scenario: ${scenario}`);
  runScenario(scenario);
} else {
  runAgentPaymentDemo();
}