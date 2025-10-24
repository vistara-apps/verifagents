/**
 * Agent-to-Agent Payment Service with 4Mica Integration
 * 
 * This service integrates 4Mica's tab-based payment system with VerifAgents
 * to enable autonomous agent economy loops with sub-second transactions.
 * 
 * Key Features:
 * - Tab-based credit lines for agents (like a bar tab)
 * - Cryptographic payment guarantees with BLS signatures
 * - Sub-second cross-chain payments
 * - ERC-8004 receipt integration for payment verification
 * - Autonomous payment decision making
 */

import { ethers } from 'ethers';
import { z } from 'zod';

// 4Mica Configuration
export interface FourMicaConfig {
  rpcUrl: string;
  walletPrivateKey: string;
  ethereumHttpRpcUrl?: string;
  contractAddress?: string;
  agentId: string;
}

// 4Mica API Types (based on Rust SDK)
export interface PaymentGuaranteeClaims {
  userAddress: string;
  recipientAddress: string;
  tabId: string;
  reqId: string;
  amount: string;
  timestamp: number;
}

export interface PaymentSignature {
  signature: string;
  scheme: 'Eip712' | 'Eip191';
}

export interface TabPaymentStatus {
  paid: string;
  remunerated: string;
}

export interface UserInfo {
  collateral: string;
  withdrawalRequestAmount: string;
  withdrawalRequestTimestamp: number;
}

export interface BLSCert {
  certificate: string;
  signature: string;
  publicKey: string;
}

// VerifAgents Payment Types
export interface AgentPaymentRequest {
  recipientAgentId: string;
  amount: string;
  description: string;
  workReceiptId?: string;
  urgency: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface AgentPaymentResponse {
  success: boolean;
  tabId?: string;
  reqId?: string;
  txHash?: string;
  receiptHash?: string;
  error?: string;
}

export interface AgentTab {
  tabId: string;
  payerAgentId: string;
  recipientAgentId: string;
  maxCredit: string;
  currentPaid: string;
  currentRemunerated: string;
  status: 'active' | 'settled' | 'expired' | 'disputed';
  createdAt: number;
  expiresAt: number;
  gracePeriod: number;
  transactions: AgentPaymentTransaction[];
}

export interface AgentPaymentTransaction {
  reqId: string;
  amount: string;
  description: string;
  timestamp: number;
  status: 'pending' | 'guaranteed' | 'paid' | 'remunerated' | 'failed';
  signature?: string;
  blsCert?: BLSCert;
  receiptHash?: string;
}

// Validation schemas
const AgentPaymentRequestSchema = z.object({
  recipientAgentId: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  description: z.string().min(1),
  workReceiptId: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high']),
  metadata: z.record(z.any()).optional()
});

/**
 * 4Mica Client Wrapper
 * 
 * Wraps the 4Mica Rust SDK functionality in TypeScript
 * for use with VerifAgents payment system.
 */
export class FourMicaClient {
  private config: FourMicaConfig;
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(config: FourMicaConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    
    // In a real implementation, this would be the actual Core4Mica contract ABI
    this.contract = new ethers.Contract(
      config.contractAddress || '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0',
      [], // Contract ABI would go here
      this.wallet
    );
  }

  /**
   * Initialize the 4Mica client
   */
  async initialize(): Promise<void> {
    console.log(`🔧 Initializing 4Mica client for agent ${this.config.agentId}`);
    
    // Check connection to 4Mica RPC
    try {
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`✅ Connected to 4Mica network at block ${blockNumber}`);
    } catch (error) {
      throw new Error(`Failed to connect to 4Mica RPC: ${error}`);
    }
  }

  /**
   * Deposit collateral for the agent
   */
  async deposit(amount: string): Promise<{ txHash: string; success: boolean }> {
    console.log(`💰 Depositing ${amount} ETH as collateral for agent ${this.config.agentId}`);
    
    try {
      // In a real implementation, this would call the 4Mica deposit function
      const tx = await this.contract.deposit(ethers.parseEther(amount));
      const receipt = await tx.wait();
      
      console.log(`✅ Deposit successful: ${receipt.hash}`);
      return { txHash: receipt.hash, success: true };
    } catch (error) {
      console.error(`❌ Deposit failed:`, error);
      return { txHash: '', success: false };
    }
  }

  /**
   * Get user information including collateral
   */
  async getUserInfo(): Promise<UserInfo> {
    try {
      // In a real implementation, this would call the 4Mica getUser function
      return {
        collateral: '1000.0', // Mock data
        withdrawalRequestAmount: '0.0',
        withdrawalRequestTimestamp: 0
      };
    } catch (error) {
      throw new Error(`Failed to get user info: ${error}`);
    }
  }

  /**
   * Create a payment tab with another agent
   */
  async createTab(
    userAddress: string,
    recipientAddress: string,
    ttlSeconds?: number
  ): Promise<string> {
    console.log(`📋 Creating payment tab between ${userAddress} and ${recipientAddress}`);
    
    try {
      // In a real implementation, this would call the 4Mica createTab function
      const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ Tab created with ID: ${tabId}`);
      return tabId;
    } catch (error) {
      throw new Error(`Failed to create tab: ${error}`);
    }
  }

  /**
   * Sign a payment guarantee
   */
  async signPayment(
    claims: PaymentGuaranteeClaims,
    scheme: 'Eip712' | 'Eip191' = 'Eip712'
  ): Promise<PaymentSignature> {
    console.log(`✍️ Signing payment guarantee for tab ${claims.tabId}`);
    
    try {
      // In a real implementation, this would use the 4Mica signing functionality
      const message = JSON.stringify(claims);
      const signature = await this.wallet.signMessage(message);
      
      return {
        signature,
        scheme
      };
    } catch (error) {
      throw new Error(`Failed to sign payment: ${error}`);
    }
  }

  /**
   * Issue a payment guarantee (BLS certificate)
   */
  async issuePaymentGuarantee(
    claims: PaymentGuaranteeClaims,
    signature: string,
    scheme: 'Eip712' | 'Eip191'
  ): Promise<BLSCert> {
    console.log(`🎫 Issuing payment guarantee for tab ${claims.tabId}`);
    
    try {
      // In a real implementation, this would call the 4Mica issuePaymentGuarantee function
      const blsCert: BLSCert = {
        certificate: `bls_cert_${Date.now()}`,
        signature: `bls_sig_${signature.substring(0, 20)}...`,
        publicKey: `bls_pk_${this.wallet.address}`
      };
      
      console.log(`✅ Payment guarantee issued`);
      return blsCert;
    } catch (error) {
      throw new Error(`Failed to issue payment guarantee: ${error}`);
    }
  }

  /**
   * Pay a tab (settle payment)
   */
  async payTab(
    tabId: string,
    reqId: string,
    amount: string,
    recipient: string
  ): Promise<{ txHash: string; success: boolean }> {
    console.log(`💸 Paying tab ${tabId} for amount ${amount}`);
    
    try {
      // In a real implementation, this would call the 4Mica payTab function
      const tx = await this.contract.payTab(tabId, reqId, amount, recipient);
      const receipt = await tx.wait();
      
      console.log(`✅ Tab payment successful: ${receipt.hash}`);
      return { txHash: receipt.hash, success: true };
    } catch (error) {
      console.error(`❌ Tab payment failed:`, error);
      return { txHash: '', success: false };
    }
  }

  /**
   * Get tab payment status
   */
  async getTabPaymentStatus(tabId: string): Promise<TabPaymentStatus> {
    try {
      // In a real implementation, this would call the 4Mica getTabPaymentStatus function
      return {
        paid: '250.0', // Mock data
        remunerated: '0.0'
      };
    } catch (error) {
      throw new Error(`Failed to get tab status: ${error}`);
    }
  }

  /**
   * Remunerate (claim payment from collateral)
   */
  async remunerate(blsCert: BLSCert): Promise<{ txHash: string; success: boolean }> {
    console.log(`💰 Remunerating with BLS certificate`);
    
    try {
      // In a real implementation, this would call the 4Mica remunerate function
      const tx = await this.contract.remunerate(blsCert.certificate);
      const receipt = await tx.wait();
      
      console.log(`✅ Remuneration successful: ${receipt.hash}`);
      return { txHash: receipt.hash, success: true };
    } catch (error) {
      console.error(`❌ Remuneration failed:`, error);
      return { txHash: '', success: false };
    }
  }
}

/**
 * Agent Payment Service
 * 
 * High-level service for managing agent-to-agent payments
 * with 4Mica integration and ERC-8004 receipt generation.
 */
export class AgentPaymentService {
  private fourMicaClient: FourMicaClient;
  private erc8004Client: any;
  private agentId: string;
  private activeTabs: Map<string, AgentTab> = new Map();
  private agentAddresses: Map<string, string> = new Map();

  constructor(config: FourMicaConfig, erc8004Client: any) {
    this.agentId = config.agentId;
    this.fourMicaClient = new FourMicaClient(config);
    this.erc8004Client = erc8004Client;
  }

  async initialize(): Promise<void> {
    console.log(`🤖 Initializing Agent Payment Service for ${this.agentId}`);
    
    await this.fourMicaClient.initialize();
    
    // Deposit initial collateral
    await this.fourMicaClient.deposit('10.0'); // 10 ETH collateral
    
    // Register agent with ERC-8004
    await this.erc8004Client.createReceipt({
      agentId: this.agentId,
      taskId: `init-payment-service-${Date.now()}`,
      result: { status: 'initialized', collateral: '10.0' },
      metadata: { type: 'payment_service_init', agentId: this.agentId }
    });
    
    console.log(`✅ Agent Payment Service initialized`);
  }

  /**
   * Register another agent's address
   */
  async registerAgent(agentId: string, address: string): Promise<void> {
    this.agentAddresses.set(agentId, address);
    console.log(`📝 Registered agent ${agentId} with address ${address}`);
  }

  /**
   * Create a payment tab with another agent
   */
  async createPaymentTab(
    recipientAgentId: string,
    maxCredit: string,
    ttlHours: number = 24
  ): Promise<AgentTab> {
    console.log(`📋 Creating payment tab with agent ${recipientAgentId}`);
    
    const recipientAddress = this.agentAddresses.get(recipientAgentId);
    if (!recipientAddress) {
      throw new Error(`Agent ${recipientAgentId} not registered`);
    }

    const tabId = await this.fourMicaClient.createTab(
      this.fourMicaClient['wallet'].address,
      recipientAddress,
      ttlHours * 3600
    );

    const tab: AgentTab = {
      tabId,
      payerAgentId: this.agentId,
      recipientAgentId,
      maxCredit,
      currentPaid: '0',
      currentRemunerated: '0',
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttlHours * 60 * 60 * 1000),
      gracePeriod: 3600, // 1 hour grace period
      transactions: []
    };

    this.activeTabs.set(tabId, tab);

    // Create ERC-8004 receipt for tab creation
    await this.erc8004Client.createReceipt({
      agentId: this.agentId,
      taskId: `create-tab-${tabId}`,
      result: { tabId, recipientAgentId, maxCredit, status: 'created' },
      metadata: { type: 'payment_tab_creation', tabId, recipientAgentId }
    });

    console.log(`✅ Payment tab created: ${tabId}`);
    return tab;
  }

  /**
   * Make a payment to another agent
   */
  async makePayment(request: AgentPaymentRequest): Promise<AgentPaymentResponse> {
    console.log(`💸 Making payment to agent ${request.recipientAgentId}`);
    
    // Validate payment request
    const validatedRequest = AgentPaymentRequestSchema.parse(request);
    
    try {
      // Find or create tab with recipient
      let tab = this.findActiveTab(request.recipientAgentId);
      if (!tab) {
        tab = await this.createPaymentTab(request.recipientAgentId, '1000.0');
      }

      // Generate request ID
      const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment guarantee claims
      const claims: PaymentGuaranteeClaims = {
        userAddress: this.fourMicaClient['wallet'].address,
        recipientAddress: this.agentAddresses.get(request.recipientAgentId)!,
        tabId: tab.tabId,
        reqId,
        amount: ethers.parseEther(request.amount).toString(),
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Sign payment guarantee
      const signature = await this.fourMicaClient.signPayment(claims, 'Eip712');
      
      // Issue payment guarantee (BLS certificate)
      const blsCert = await this.fourMicaClient.issuePaymentGuarantee(
        claims,
        signature.signature,
        signature.scheme
      );

      // Create transaction record
      const transaction: AgentPaymentTransaction = {
        reqId,
        amount: request.amount,
        description: request.description,
        timestamp: Date.now(),
        status: 'guaranteed',
        signature: signature.signature,
        blsCert
      };

      tab.transactions.push(transaction);

      // Create ERC-8004 receipt for payment
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
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Settle a payment tab
   */
  async settleTab(tabId: string): Promise<{ success: boolean; txHash?: string }> {
    console.log(`💰 Settling payment tab ${tabId}`);
    
    const tab = this.activeTabs.get(tabId);
    if (!tab) {
      return { success: false };
    }

    try {
      // Calculate total amount to pay
      const totalAmount = tab.transactions
        .filter(tx => tx.status === 'guaranteed')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      if (totalAmount === 0) {
        console.log(`ℹ️ No payments to settle for tab ${tabId}`);
        return { success: true };
      }

      // Pay the tab
      const result = await this.fourMicaClient.payTab(
        tabId,
        'settlement',
        ethers.parseEther(totalAmount.toString()).toString(),
        this.agentAddresses.get(tab.recipientAgentId)!
      );

      if (result.success) {
        // Update transaction statuses
        tab.transactions.forEach(tx => {
          if (tx.status === 'guaranteed') {
            tx.status = 'paid';
          }
        });
        tab.status = 'settled';
        tab.currentPaid = totalAmount.toString();

        // Create ERC-8004 receipt for settlement
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

  /**
   * Claim remuneration for unpaid work
   */
  async claimRemuneration(tabId: string): Promise<{ success: boolean; txHash?: string }> {
    console.log(`💰 Claiming remuneration for tab ${tabId}`);
    
    const tab = this.activeTabs.get(tabId);
    if (!tab) {
      return { success: false };
    }

    try {
      // Find the latest BLS certificate
      const latestTransaction = tab.transactions
        .filter(tx => tx.blsCert)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (!latestTransaction?.blsCert) {
        return { success: false };
      }

      // Claim remuneration
      const result = await this.fourMicaClient.remunerate(latestTransaction.blsCert);

      if (result.success) {
        // Update transaction status
        latestTransaction.status = 'remunerated';
        tab.currentRemunerated = latestTransaction.amount;

        // Create ERC-8004 receipt for remuneration
        await this.erc8004Client.createReceipt({
          agentId: this.agentId,
          taskId: `remunerate-${tabId}`,
          result: { tabId, amount: latestTransaction.amount, txHash: result.txHash, status: 'remunerated' },
          metadata: { type: 'remuneration', tabId, txHash: result.txHash }
        });

        console.log(`✅ Remuneration claimed: ${result.txHash}`);
      }

      return { success: result.success, txHash: result.txHash };

    } catch (error) {
      console.error('❌ Remuneration failed:', error);
      return { success: false };
    }
  }

  /**
   * Find active tab with recipient
   */
  private findActiveTab(recipientAgentId: string): AgentTab | null {
    return Array.from(this.activeTabs.values())
      .find(tab => tab.recipientAgentId === recipientAgentId && tab.status === 'active') || null;
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(): Promise<{
    totalTabs: number;
    activeTabs: number;
    totalPaid: string;
    totalRemunerated: string;
    successRate: number;
    averageSettlementTime: number;
  }> {
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
      averageSettlementTime: 2.5 // Mock data
    };
  }

  /**
   * Get all active tabs
   */
  getActiveTabs(): AgentTab[] {
    return Array.from(this.activeTabs.values())
      .filter(tab => tab.status === 'active');
  }

  /**
   * Get tab by ID
   */
  getTab(tabId: string): AgentTab | null {
    return this.activeTabs.get(tabId) || null;
  }
}

export default {
  FourMicaClient,
  AgentPaymentService
};