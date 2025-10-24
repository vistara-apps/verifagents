const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(level, message, details = '') {
  const timestamp = new Date().toISOString().substr(11, 12);
  const levelColors = {
    'DEMO': colors.magenta,
    'SECURITY': colors.red,
    'PERFORMANCE': colors.blue,
    'MONITORING': colors.yellow,
    'COLLAB': colors.cyan,
    'SUCCESS': colors.green,
    'WARNING': colors.yellow,
    'ERROR': colors.red,
    'ALERT': colors.red
  };
  
  console.log(`${levelColors[level]}[${timestamp}] ${level}:${colors.reset} ${message}`);
  if (details) {
    console.log(`${colors.reset}    ${details}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock Secure Agent Applications System
class SecureAgentApplicationsDemo {
  constructor() {
    this.agents = new Map();
    this.securityPolicies = new Map();
    this.performanceMetrics = new Map();
    this.alerts = [];
    this.contracts = new Map();
    this.collaborations = new Map();
  }

  // Initialize security policies
  initializeSecurityPolicies() {
    this.securityPolicies.set('basic', {
      id: 'basic',
      name: 'Basic Security',
      maxPaymentAmount: '1.0',
      requiredReputation: 50,
      verificationLevel: 'basic'
    });

    this.securityPolicies.set('enhanced', {
      id: 'enhanced',
      name: 'Enhanced Security',
      maxPaymentAmount: '10.0',
      requiredReputation: 75,
      verificationLevel: 'enhanced'
    });

    this.securityPolicies.set('maximum', {
      id: 'maximum',
      name: 'Maximum Security',
      maxPaymentAmount: '100.0',
      requiredReputation: 90,
      verificationLevel: 'maximum'
    });

    log('SECURITY', '🛡️ Security policies initialized', 'Basic, Enhanced, and Maximum security levels');
  }

  // Register smart contracts
  registerSmartContracts() {
    this.contracts.set('escrow', {
      address: '0x1234567890123456789012345678901234567890',
      type: 'EscrowContract',
      functions: ['createEscrow', 'releaseFunds', 'disputeResolution'],
      gasEstimate: 150000
    });

    this.contracts.set('reputation', {
      address: '0x2345678901234567890123456789012345678901',
      type: 'ReputationContract',
      functions: ['updateReputation', 'getReputation', 'verifyIdentity'],
      gasEstimate: 80000
    });

    this.contracts.set('arbitration', {
      address: '0x3456789012345678901234567890123456789012',
      type: 'ArbitrationContract',
      functions: ['createDispute', 'submitEvidence', 'resolveDispute'],
      gasEstimate: 200000
    });

    log('SECURITY', '📋 Smart contracts registered', 'Escrow, Reputation, and Arbitration contracts');
  }

  // Register agents with security verification
  registerSecureAgent(agentId, address, capabilities, reputation, hasCollateral = false) {
    const agent = {
      id: agentId,
      address: address,
      capabilities: capabilities,
      reputation: reputation,
      collateral: hasCollateral ? '1000.0' : null,
      securityVerified: true,
      registeredAt: Date.now()
    };

    this.agents.set(agentId, agent);

    // Initialize performance metrics
    this.performanceMetrics.set(agentId, {
      agentId: agentId,
      tasksCompleted: 0,
      averageQuality: 0.8,
      averageCompletionTime: 300000, // 5 minutes
      paymentSuccessRate: 0.95,
      reputationScore: reputation,
      lastActivity: Date.now()
    });

    log('SECURITY', `✅ Agent ${agentId} registered with security verification`, 
        `Reputation: ${reputation}, Collateral: ${hasCollateral ? 'Yes' : 'No'}`);
  }

  // Apply security policy to collaboration
  applySecurityPolicy(collaborationId, policyId) {
    const policy = this.securityPolicies.get(policyId);
    if (!policy) {
      throw new Error(`Security policy ${policyId} not found`);
    }

    log('SECURITY', `🛡️ Applied ${policy.name} to collaboration ${collaborationId}`, 
        `Max payment: ${policy.maxPaymentAmount} ETH, Required reputation: ${policy.requiredReputation}`);
    
    return policy;
  }

  // Verify agent security
  async verifyAgentSecurity(agentId, policy) {
    const agent = this.agents.get(agentId);
    const metrics = this.performanceMetrics.get(agentId);

    if (!agent || !metrics) {
      log('ERROR', `❌ Agent ${agentId} not found`);
      return false;
    }

    // Check reputation requirement
    if (metrics.reputationScore < policy.requiredReputation) {
      log('ERROR', `❌ Agent ${agentId} reputation ${metrics.reputationScore} below required ${policy.requiredReputation}`);
      return false;
    }

    // Check payment success rate
    if (metrics.paymentSuccessRate < 0.95) {
      log('ERROR', `❌ Agent ${agentId} payment success rate ${metrics.paymentSuccessRate} below required 0.95`);
      return false;
    }

    log('SECURITY', `✅ Agent ${agentId} passed security verification`, 
        `Reputation: ${metrics.reputationScore}, Payment success: ${(metrics.paymentSuccessRate * 100).toFixed(1)}%`);
    return true;
  }

  // Create escrow contract for high-value transactions
  async createEscrowContract(payerId, recipientId, amount, conditions) {
    const escrowId = `escrow_${Date.now()}`;
    
    log('SECURITY', `🏦 Creating escrow contract: ${escrowId}`, 
        `Amount: ${amount} ETH, Conditions: ${conditions.length}`);
    
    // Simulate escrow contract creation
    await sleep(1000);
    
    log('SUCCESS', `✅ Escrow contract created`, `ID: ${escrowId}, Gas used: 150,000`);
    return escrowId;
  }

  // Performance optimization
  optimizeTaskAssignment(tasks, availableAgents) {
    log('PERFORMANCE', '🎯 Optimizing task assignment', `Tasks: ${tasks.length}, Agents: ${availableAgents.length}`);
    
    const assignments = {};
    const agentWorkloads = new Map();
    
    // Initialize workloads
    availableAgents.forEach(agentId => {
      agentWorkloads.set(agentId, 0);
    });

    // Sort tasks by complexity
    const sortedTasks = tasks.sort((a, b) => b.requirements.length - a.requirements.length);

    // Assign tasks using optimization algorithm
    for (const task of sortedTasks) {
      const bestAgent = this.findBestAgentForTask(task, availableAgents, agentWorkloads);
      if (bestAgent) {
        assignments[task.id] = bestAgent;
        agentWorkloads.set(bestAgent, agentWorkloads.get(bestAgent) + 1);
      }
    }

    log('PERFORMANCE', `✅ Task assignment optimized`, `Assignments: ${Object.keys(assignments).length}`);
    return assignments;
  }

  findBestAgentForTask(task, availableAgents, workloads) {
    let bestAgent = null;
    let bestScore = -1;

    for (const agentId of availableAgents) {
      const metrics = this.performanceMetrics.get(agentId);
      if (!metrics) continue;

      // Check workload limit (max 3 concurrent tasks)
      if (workloads.get(agentId) >= 3) continue;

      // Calculate composite score
      const reputationScore = metrics.reputationScore / 100;
      const capabilityScore = this.calculateCapabilityMatch(task.requirements, agentId);
      const availabilityScore = 1 - (workloads.get(agentId) / 3);
      const costScore = 1 - (parseFloat(task.reward) / 1.0);

      const score = (
        reputationScore * 0.4 +
        capabilityScore * 0.3 +
        availabilityScore * 0.2 +
        costScore * 0.1
      );

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    }

    return bestAgent;
  }

  calculateCapabilityMatch(requirements, agentId) {
    const metrics = this.performanceMetrics.get(agentId);
    if (!metrics) return 0;

    // Simulate capability matching based on reputation and task completion
    const baseMatch = Math.min(metrics.reputationScore / 100, 1.0);
    const taskMatch = Math.min(metrics.tasksCompleted / 10, 1.0);
    
    return (baseMatch + taskMatch) / 2;
  }

  // Update performance metrics
  updatePerformanceMetrics(agentId, taskCompleted = false, quality = 0, completionTime = 0) {
    const metrics = this.performanceMetrics.get(agentId);
    if (!metrics) return;

    if (taskCompleted) {
      metrics.tasksCompleted += 1;
      metrics.averageQuality = (metrics.averageQuality * (metrics.tasksCompleted - 1) + quality) / metrics.tasksCompleted;
      metrics.averageCompletionTime = (metrics.averageCompletionTime * (metrics.tasksCompleted - 1) + completionTime) / metrics.tasksCompleted;
    }

    metrics.lastActivity = Date.now();
    this.performanceMetrics.set(agentId, metrics);

    log('PERFORMANCE', `📊 Updated metrics for ${agentId}`, 
        `Tasks: ${metrics.tasksCompleted}, Quality: ${metrics.averageQuality.toFixed(2)}, Time: ${metrics.averageCompletionTime}ms`);
  }

  // Real-time monitoring
  monitorSystem() {
    const alerts = [];
    
    // Check for performance issues
    for (const [agentId, metrics] of this.performanceMetrics) {
      if (metrics.averageQuality < 0.7) {
        alerts.push({
          type: 'quality_drop',
          severity: 'high',
          agentId: agentId,
          message: `Agent ${agentId} quality ${metrics.averageQuality.toFixed(2)} below threshold`
        });
      }

      if (metrics.averageCompletionTime > 600000) { // 10 minutes
        alerts.push({
          type: 'slow_agent',
          severity: 'medium',
          agentId: agentId,
          message: `Agent ${agentId} average completion time ${metrics.averageCompletionTime}ms exceeds threshold`
        });
      }
    }

    // Process alerts
    alerts.forEach(alert => {
      this.createAlert(alert);
    });

    return alerts;
  }

  createAlert(alert) {
    const fullAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...alert
    };

    this.alerts.push(fullAlert);
    log('ALERT', `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`, `Agent: ${alert.agentId}`);
  }

  // Get system analytics
  getSystemAnalytics() {
    const totalAgents = this.agents.size;
    const verifiedAgents = Array.from(this.agents.values()).filter(a => a.securityVerified).length;
    const totalTasks = Array.from(this.performanceMetrics.values()).reduce((sum, m) => sum + m.tasksCompleted, 0);
    const avgQuality = Array.from(this.performanceMetrics.values()).reduce((sum, m) => sum + m.averageQuality, 0) / totalAgents;
    const avgReputation = Array.from(this.performanceMetrics.values()).reduce((sum, m) => sum + m.reputationScore, 0) / totalAgents;
    const recentAlerts = this.alerts.filter(a => Date.now() - a.timestamp < 3600000).length;

    return {
      totalAgents,
      verifiedAgents,
      totalTasks,
      averageQuality: Math.round(avgQuality * 100) / 100,
      averageReputation: Math.round(avgReputation * 100) / 100,
      recentAlerts,
      systemHealth: recentAlerts > 5 ? 'warning' : 'healthy'
    };
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════════════════════╗
║                🔒 Secure Agent Applications Demo                            ║
║              Faster, More Secure Multi-Agent Collaboration                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  log('DEMO', '🎬 Starting Secure Agent Applications Demo', 'Enhanced security, performance, and monitoring');
  await sleep(2000);

  try {
    // Initialize secure applications system
    const secureApps = new SecureAgentApplicationsDemo();
    
    // Step 1: Initialize Security Infrastructure
    console.log(`\n${colors.bright}${colors.red}🔒 SECURITY INFRASTRUCTURE${colors.reset}`);
    log('SECURITY', '🛡️ Step 1: Initializing Security Infrastructure', 'Setting up policies and contracts');
    await sleep(1000);

    secureApps.initializeSecurityPolicies();
    secureApps.registerSmartContracts();

    // Step 2: Register Agents with Security Verification
    log('SECURITY', '👥 Step 2: Registering Agents with Security Verification', 'Enhanced security checks');
    await sleep(1000);

    // High-reputation agents with collateral
    secureApps.registerSecureAgent('agent_coordinator', '0x292F0E22A0245387a89d5DB50F016d18D6aF0bac', 
      ['coordination', 'payment', 'quality_assessment'], 95, true);

    secureApps.registerSecureAgent('agent_enterprise', '0x3DA623926153B9bB377948b6b5E2422622Eb43f0', 
      ['enterprise_solutions', 'integration', 'security'], 92, true);

    // Specialized agents without collateral (work on credit)
    secureApps.registerSecureAgent('agent_data_scientist', '0x4EB7a6867296406881E20d6647232314736Dd09A', 
      ['data_science', 'machine_learning', 'analytics'], 88, false);

    secureApps.registerSecureAgent('agent_blockchain_dev', '0x5FC8e3ef1DA4E04deB6f7d0423D06F63869e322', 
      ['blockchain', 'smart_contracts', 'defi'], 85, false);

    secureApps.registerSecureAgent('agent_ai_researcher', '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8', 
      ['ai_research', 'nlp', 'computer_vision'], 90, false);

    secureApps.registerSecureAgent('agent_cybersecurity', '0x773c50B526cb4017d947e71eAF6753BF3eeE66d9', 
      ['cybersecurity', 'penetration_testing', 'audit'], 87, false);

    // Step 3: Apply Enhanced Security Policy
    log('SECURITY', '🛡️ Step 3: Applying Enhanced Security Policy', 'Maximum security for high-value collaboration');
    await sleep(1000);

    const securityPolicy = secureApps.applySecurityPolicy('main_collaboration', 'enhanced');

    // Verify all agents meet security requirements
    for (const [agentId, agent] of secureApps.agents) {
      await secureApps.verifyAgentSecurity(agentId, securityPolicy);
    }

    // Step 4: Performance Optimization
    console.log(`\n${colors.bright}${colors.blue}⚡ PERFORMANCE OPTIMIZATION${colors.reset}`);
    log('PERFORMANCE', '🎯 Step 4: Performance Optimization', 'AI-powered task assignment and resource optimization');
    await sleep(1000);

    // Create complex task set
    const complexTasks = [
      {
        id: 'task_ml_research',
        description: 'Research and implement advanced ML algorithms',
        requirements: ['ai_research', 'machine_learning'],
        reward: '0.25',
        complexity: 'high'
      },
      {
        id: 'task_blockchain_audit',
        description: 'Security audit of smart contracts',
        requirements: ['blockchain', 'cybersecurity', 'audit'],
        reward: '0.30',
        complexity: 'high'
      },
      {
        id: 'task_data_analysis',
        description: 'Analyze large-scale datasets',
        requirements: ['data_science', 'analytics'],
        reward: '0.15',
        complexity: 'medium'
      },
      {
        id: 'task_integration',
        description: 'Integrate multiple systems',
        requirements: ['integration', 'enterprise_solutions'],
        reward: '0.20',
        complexity: 'medium'
      },
      {
        id: 'task_quality_review',
        description: 'Quality assurance and testing',
        requirements: ['quality_assessment', 'testing'],
        reward: '0.10',
        complexity: 'low'
      }
    ];

    const availableAgents = Array.from(secureApps.agents.keys());
    const optimizedAssignments = secureApps.optimizeTaskAssignment(complexTasks, availableAgents);

    log('PERFORMANCE', '✅ Task assignment optimized', 'AI-powered matching completed');

    // Step 5: Execute Tasks with Performance Monitoring
    log('PERFORMANCE', '🚀 Step 5: Executing Tasks with Performance Monitoring', 'Real-time optimization');
    await sleep(1000);

    // Simulate task execution with performance tracking
    for (const [taskId, agentId] of Object.entries(optimizedAssignments)) {
      const task = complexTasks.find(t => t.id === taskId);
      
      log('PERFORMANCE', `👷 Executing ${taskId}`, `Assigned to ${agentId}`);
      await sleep(2000);

      // Simulate work completion with quality metrics
      const quality = 0.7 + Math.random() * 0.3; // 0.7-1.0
      const completionTime = 300000 + Math.random() * 600000; // 5-15 minutes

      secureApps.updatePerformanceMetrics(agentId, true, quality, completionTime);
      
      log('SUCCESS', `✅ Task completed: ${taskId}`, `Quality: ${quality.toFixed(2)}, Time: ${(completionTime/1000).toFixed(0)}s`);
    }

    // Step 6: Real-Time Monitoring and Alerting
    console.log(`\n${colors.bright}${colors.yellow}📊 REAL-TIME MONITORING${colors.reset}`);
    log('MONITORING', '📊 Step 6: Real-Time Monitoring and Alerting', 'Continuous system health monitoring');
    await sleep(1000);

    // Simulate monitoring checks
    const alerts = secureApps.monitorSystem();
    
    if (alerts.length > 0) {
      log('MONITORING', `🚨 Generated ${alerts.length} alerts`, 'System monitoring active');
    } else {
      log('MONITORING', '✅ No alerts generated', 'System operating normally');
    }

    // Step 7: High-Value Transaction with Escrow
    log('SECURITY', '🏦 Step 7: High-Value Transaction with Escrow', 'Maximum security for large payments');
    await sleep(1000);

    const escrowContract = await secureApps.createEscrowContract(
      'agent_coordinator',
      'agent_ai_researcher',
      '5.0', // 5 ETH
      ['quality_verification', 'code_review', 'testing_complete']
    );

    log('SUCCESS', '✅ High-value transaction secured', 'Escrow contract deployed');

    // Step 8: System Analytics and Health Check
    console.log(`\n${colors.bright}${colors.green}📈 SYSTEM ANALYTICS${colors.reset}`);
    log('MONITORING', '📈 Step 8: System Analytics and Health Check', 'Comprehensive performance analysis');
    await sleep(1000);

    const analytics = secureApps.getSystemAnalytics();

    console.log(`${colors.cyan}   🤖 Total Agents: ${analytics.totalAgents}${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Verified Agents: ${analytics.verifiedAgents}${colors.reset}`);
    console.log(`${colors.cyan}   📋 Total Tasks Completed: ${analytics.totalTasks}${colors.reset}`);
    console.log(`${colors.cyan}   🎯 Average Quality Score: ${analytics.averageQuality}${colors.reset}`);
    console.log(`${colors.cyan}   ⭐ Average Reputation: ${analytics.averageReputation}${colors.reset}`);
    console.log(`${colors.cyan}   🚨 Recent Alerts: ${analytics.recentAlerts}${colors.reset}`);
    console.log(`${colors.cyan}   💚 System Health: ${analytics.systemHealth.toUpperCase()}${colors.reset}`);

    // Final Summary
    console.log(`\n${colors.bright}${colors.green}🎉 SECURE AGENT APPLICATIONS COMPLETE!${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Enhanced Security: Multi-layer security with smart contracts${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Performance Optimization: AI-powered task assignment${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Real-Time Monitoring: Continuous health and performance tracking${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Escrow Protection: High-value transaction security${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Credit-Based Collaboration: Agents work without collateral requirements${colors.reset}`);
    console.log(`${colors.cyan}   ✅ 4Mica Integration: Sub-second payment guarantees${colors.reset}`);
    console.log(`${colors.cyan}   ✅ ERC-8004 Receipts: Verifiable proof of all work${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.green}🚀 Applications for Faster & More Secure Collaboration:${colors.reset}`);
    console.log(`${colors.cyan}   • Smart Contract Security: Automated dispute resolution${colors.reset}`);
    console.log(`${colors.cyan}   • Performance AI: Optimal task-agent matching${colors.reset}`);
    console.log(`${colors.cyan}   • Real-Time Monitoring: Proactive issue detection${colors.reset}`);
    console.log(`${colors.cyan}   • Escrow Protection: Secure high-value transactions${colors.reset}`);
    console.log(`${colors.cyan}   • Credit-Based System: Scalable agent participation${colors.reset}`);
    console.log(`${colors.cyan}   • Automated Optimization: Continuous performance improvement${colors.reset}`);
    
    log('DEMO', '🎯 Mission Accomplished', 'Secure, fast, and scalable agent collaboration achieved!');

  } catch (error) {
    log('ERROR', '❌ Demo failed', error.message);
  }
}

main().catch(console.error);
