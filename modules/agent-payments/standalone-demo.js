#!/usr/bin/env node

/**
 * Agent-to-Agent Payments Demo with 4Mica Integration
 * 
 * This demo showcases how VerifAgents can use 4Mica's tab-based payment system
 * for autonomous agent economy loops with sub-second transactions.
 */

const crypto = require('crypto');

// Mock ERC-8004 Client for demo
class MockERC8004Client {
  async createReceipt(data) {
    console.log('🎫 Creating ERC-8004 receipt:', data);
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }
}

// 4Mica Configuration
const DEMO_CONFIG = {
  rpcUrl: 'http://localhost:3000',
  walletPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  ethereumHttpRpcUrl: 'http://localhost:8545',
  contractAddress: '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0',
  agentId: 'agent_001'
};

const RECIPIENT_CONFIG = {
  rpcUrl: 'http://localhost:3000',
  walletPrivateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  ethereumHttpRpcUrl: 'http://localhost:8545',
  contractAddress: '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0',
  agentId: 'agent_002'
};

// Mock 4Mica Client
class MockFourMicaClient {
  constructor(config) {
    this.config = config;
    this.walletAddress = `0x${crypto.randomBytes(20).toString('hex')}`;
  }

  async initialize() {
    console.log(`🔧 Initializing 4Mica client for agent ${this.config.agentId}`);
    console.log(`✅ Connected to 4Mica network`);
  }

  async deposit(amount) {
    console.log(`💰 Depositing ${amount} ETH as collateral for agent ${this.config.agentId}`);
    return { txHash: `0x${crypto.randomBytes(32).toString('hex')}`, success: true };
  }

  async getUserInfo() {
    return {
      collateral: '1000.0',
      withdrawalRequestAmount: '0.0',
      withdrawalRequestTimestamp: 0
    };
  }

  async createTab(userAddress, recipientAddress, ttlSeconds) {
    console.log(`📋 Creating payment tab between ${userAddress} and ${recipientAddress}`);
    const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`✅ Tab created with ID: ${tabId}`);
    return tabId;
  }

  async signPayment(claims, scheme = 'Eip712') {
    console.log(`✍️ Signing payment guarantee for tab ${claims.tabId}`);
    const signature = `0x${crypto.randomBytes(65).toString('hex')}`;
    return { signature, scheme };
  }

  async issuePaymentGuarantee(claims, signature, scheme) {
    console.log(`🎫 Issuing payment guarantee for tab ${claims.tabId}`);
    return {
      certificate: `bls_cert_${Date.now()}`,
      signature: `bls_sig_${signature.substring(0, 20)}...`,
      publicKey: `bls_pk_${this.walletAddress}`
    };
  }

  async payTab(tabId, reqId, amount, recipient) {
    console.log(`💸 Paying tab ${tabId} for amount ${amount}`);
    return { txHash: `0x${crypto.randomBytes(32).toString('hex')}`, success: true };
  }

  async getTabPaymentStatus(tabId) {
    return { paid: '250.0', remunerated: '0.0' };
  }

  async remunerate(blsCert) {
    console.log(`💰 Remunerating with BLS certificate`);
    return { txHash: `0x${crypto.randomBytes(32).toString('hex')}`, success: true };
  }
}

// Agent Payment Service
class AgentPaymentService {
  constructor(config, erc8004Client) {
    this.config = config;
    this.agentId = config.agentId;
    this.fourMicaClient = new MockFourMicaClient(config);
    this.erc8004Client = erc8004Client;
    this.activeTabs = new Map();
    this.agentAddresses = new Map();
  }

  async initialize() {
    console.log(`🤖 Initializing Agent Payment Service for ${this.agentId}`);
    await this.fourMicaClient.initialize();
    await this.fourMicaClient.deposit('10.0');
    
    await this.erc8004Client.createReceipt({
      agentId: this.agentId,
      taskId: `init-payment-service-${Date.now()}`,
      result: { status: 'initialized', collateral: '10.0' },
      metadata: { type: 'payment_service_init', agentId: this.agentId }
    });
    
    console.log(`✅ Agent Payment Service initialized`);
  }

  async registerAgent(agentId, address) {
    this.agentAddresses.set(agentId, address);
    console.log(`📝 Registered agent ${agentId} with address ${address}`);
  }

  async createPaymentTab(recipientAgentId, maxCredit, ttlHours = 24) {
    console.log(`📋 Creating payment tab with agent ${recipientAgentId}`);
    
    const recipientAddress = this.agentAddresses.get(recipientAgentId);
    if (!recipientAddress) {
      throw new Error(`Agent ${recipientAgentId} not registered`);
    }

    const tabId = await this.fourMicaClient.createTab(
      this.fourMicaClient.walletAddress,
      recipientAddress,
      ttlHours * 3600
    );

    const tab = {
      tabId,
      payerAgentId: this.agentId,
      recipientAgentId,
      maxCredit,
      currentPaid: '0',
      currentRemunerated: '0',
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttlHours * 60 * 60 * 1000),
      gracePeriod: 3600,
      transactions: []
    };

    this.activeTabs.set(tabId, tab);

    await this.erc8004Client.createReceipt({
      agentId: this.agentId,
      taskId: `create-tab-${tabId}`,
      result: { tabId, recipientAgentId, maxCredit, status: 'created' },
      metadata: { type: 'payment_tab_creation', tabId, recipientAgentId }
    });

    console.log(`✅ Payment tab created: ${tabId}`);
    return tab;
  }

  async makePayment(request) {
    console.log(`💸 Making payment to agent ${request.recipientAgentId}`);
    
    try {
      let tab = this.findActiveTab(request.recipientAgentId);
      if (!tab) {
        tab = await this.createPaymentTab(request.recipientAgentId, '1000.0');
      }

      const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const claims = {
        userAddress: this.fourMicaClient.walletAddress,
        recipientAddress: this.agentAddresses.get(request.recipientAgentId),
        tabId: tab.tabId,
        reqId,
        amount: (parseFloat(request.amount) * 1e18).toString(),
        timestamp: Math.floor(Date.now() / 1000)
      };

      const signature = await this.fourMicaClient.signPayment(claims, 'Eip712');
      const blsCert = await this.fourMicaClient.issuePaymentGuarantee(
        claims,
        signature.signature,
        signature.scheme
      );

      const transaction = {
        reqId,
        amount: request.amount,
        description: request.description,
        timestamp: Date.now(),
        status: 'guaranteed',
        signature: signature.signature,
        blsCert
      };

      tab.transactions.push(transaction);

      const receiptHash = await this.erc8004Client.createReceipt({
        agentId: this.agentId,
        taskId: `payment-${reqId}`,
        result: { 
          reqId, 
          amount: request.amount, 
          recipient: request.recipientAgentId,
          status: 'guaranteed',
          tabId: tab.tabId
        },
        metadata: { 
          type: 'agent_payment', 
          reqId, 
          tabId: tab.tabId,
          urgency: request.urgency,
          workReceiptId: request.workReceiptId
        }
      });

      transaction.receiptHash = receiptHash;

      console.log(`✅ Payment guaranteed: ${reqId}`);
      return {
        success: true,
        tabId: tab.tabId,
        reqId,
        receiptHash
      };

    } catch (error) {
      console.error('❌ Payment failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  async settleTab(tabId) {
    console.log(`💰 Settling payment tab ${tabId}`);
    
    const tab = this.activeTabs.get(tabId);
    if (!tab) {
      return { success: false };
    }

    try {
      const totalAmount = tab.transactions
        .filter(tx => tx.status === 'guaranteed')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      if (totalAmount === 0) {
        console.log(`ℹ️ No payments to settle for tab ${tabId}`);
        return { success: true };
      }

      const result = await this.fourMicaClient.payTab(
        tabId,
        'settlement',
        (totalAmount * 1e18).toString(),
        this.agentAddresses.get(tab.recipientAgentId)
      );

      if (result.success) {
        tab.transactions.forEach(tx => {
          if (tx.status === 'guaranteed') {
            tx.status = 'paid';
          }
        });
        tab.status = 'settled';
        tab.currentPaid = totalAmount.toString();

        await this.erc8004Client.createReceipt({
          agentId: this.agentId,
          taskId: `settle-tab-${tabId}`,
          result: { tabId, totalAmount, txHash: result.txHash, status: 'settled' },
          metadata: { type: 'tab_settlement', tabId, txHash: result.txHash }
        });

        console.log(`✅ Tab ${tabId} settled: ${result.txHash}`);
      }

      return { success: result.success, txHash: result.txHash };

    } catch (error) {
      console.error('❌ Tab settlement failed:', error);
      return { success: false };
    }
  }

  findActiveTab(recipientAgentId) {
    return Array.from(this.activeTabs.values())
      .find(tab => tab.recipientAgentId === recipientAgentId && tab.status === 'active') || null;
  }

  async getPaymentAnalytics() {
    const tabs = Array.from(this.activeTabs.values());
    const activeTabs = tabs.filter(tab => tab.status === 'active');
    
    const totalPaid = tabs.reduce((sum, tab) => sum + parseFloat(tab.currentPaid), 0);
    const totalRemunerated = tabs.reduce((sum, tab) => sum + parseFloat(tab.currentRemunerated), 0);
    
    const successfulTransactions = tabs
      .flatMap(tab => tab.transactions)
      .filter(tx => tx.status === 'paid' || tx.status === 'remunerated');
    
    const successRate = tabs.length > 0 ? (successfulTransactions.length / tabs.length) * 100 : 0;
    
    return {
      totalTabs: tabs.length,
      activeTabs: activeTabs.length,
      totalPaid: totalPaid.toFixed(2),
      totalRemunerated: totalRemunerated.toFixed(2),
      successRate: Math.round(successRate * 100) / 100,
      averageSettlementTime: 2.5
    };
  }

  getActiveTabs() {
    return Array.from(this.activeTabs.values())
      .filter(tab => tab.status === 'active');
  }
}

// Demo execution
async function runAgentPaymentDemo() {
  console.log('🚀 Starting Agent-to-Agent Payments Demo with 4Mica Integration\n');
  console.log('=' .repeat(70));

  try {
    const erc8004Client = new MockERC8004Client();
    
    const payerService = new AgentPaymentService(DEMO_CONFIG, erc8004Client);
    const recipientService = new AgentPaymentService(RECIPIENT_CONFIG, erc8004Client);

    await payerService.initialize();
    await recipientService.initialize();

    await payerService.registerAgent('agent_002', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
    await recipientService.registerAgent('agent_001', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');

    console.log('\n📋 Demo Scenario 1: Creating Payment Tab\n');
    
    const tab = await payerService.createPaymentTab('agent_002', '1000.0', 24);
    console.log(`✅ Payment tab created:`);
    console.log(`   Tab ID: ${tab.tabId}`);
    console.log(`   Max Credit: ${tab.maxCredit} ETH`);
    console.log(`   Expires: ${new Date(tab.expiresAt).toLocaleString()}`);

    console.log('\n💸 Demo Scenario 2: Making Payments\n');
    
    const payments = [
      {
        recipientAgentId: 'agent_002',
        amount: '50.0',
        description: 'Data processing service',
        urgency: 'high',
        workReceiptId: 'work_001'
      },
      {
        recipientAgentId: 'agent_002',
        amount: '75.0',
        description: 'ML model inference',
        urgency: 'medium',
        workReceiptId: 'work_002'
      },
      {
        recipientAgentId: 'agent_002',
        amount: '25.0',
        description: 'API call processing',
        urgency: 'low',
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
    
    const analytics = await payerService.getPaymentAnalytics();
    console.log('📈 Payment Analytics:');
    console.log(`   Total Tabs: ${analytics.totalTabs}`);
    console.log(`   Active Tabs: ${analytics.activeTabs}`);
    console.log(`   Total Paid: ${analytics.totalPaid} ETH`);
    console.log(`   Total Remunerated: ${analytics.totalRemunerated} ETH`);
    console.log(`   Success Rate: ${analytics.successRate}%`);
    console.log(`   Avg Settlement Time: ${analytics.averageSettlementTime} minutes`);

    console.log('\n💰 Demo Scenario 4: Tab Settlement\n');
    
    const settlementResult = await payerService.settleTab(tab.tabId);
    if (settlementResult.success) {
      console.log(`✅ Tab settled successfully:`);
      console.log(`   Transaction Hash: ${settlementResult.txHash}`);
      console.log(`   Total Amount: 150.0 ETH`);
    } else {
      console.log(`❌ Tab settlement failed`);
    }

    console.log('\n🎯 Demo Scenario 5: Autonomous Payment Decision\n');
    
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

function calculatePaymentAmount(receipt) {
  const baseValue = receipt.metadata?.value || 50.0;
  const confidence = receipt.result?.confidence || 50;
  const accuracy = receipt.result?.accuracy || 50;
  
  const multiplier = (confidence / 100) * (accuracy / 100);
  return Math.round(baseValue * multiplier * 100) / 100;
}

// Handle command line arguments
const args = process.argv.slice(2);
const scenario = args.find(arg => arg.startsWith('--scenario='))?.split('=')[1];

if (scenario) {
  console.log(`🎭 Running specific scenario: ${scenario}`);
  // Add specific scenario handling here if needed
} else {
  runAgentPaymentDemo();
}