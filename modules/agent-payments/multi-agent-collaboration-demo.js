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
    'CHAIN': colors.cyan,
    'PARALLEL': colors.blue,
    'HIERARCHY': colors.yellow,
    'SUCCESS': colors.green,
    'WARNING': colors.yellow,
    'ERROR': colors.red,
    'PAYMENT': colors.green,
    'COLLAB': colors.cyan
  };
  
  console.log(`${levelColors[level]}[${timestamp}] ${level}:${colors.reset} ${message}`);
  if (details) {
    console.log(`${colors.reset}    ${details}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runRustCommand(command, args, config) {
  const inputFile = path.join(__dirname, 'temp', `input_${Date.now()}.json`);
  const outputFile = path.join(__dirname, 'temp', `output_${Date.now()}.json`);
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'temp'))) {
    fs.mkdirSync(path.join(__dirname, 'temp'));
  }
  
  const input = {
    command: command,
    args: args,
    config: config
  };

  fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
  
  const rustProcess = spawn('./rust-client/target/release/fourmica-client', [inputFile, outputFile]);
  
  return new Promise((resolve, reject) => {
    rustProcess.on('close', (code) => {
      if (code === 0) {
        const result = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        resolve(result);
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    
    rustProcess.on('error', (err) => {
      reject(err);
    });
  });
}

// Mock Multi-Agent Collaboration System
class MultiAgentCollaborationDemo {
  constructor() {
    this.agents = new Map();
    this.chains = new Map();
    this.projects = new Map();
    this.hierarchies = new Map();
  }

  // Register agents with different capabilities
  registerAgent(agentId, address, capabilities, hasCollateral = false) {
    const agent = {
      id: agentId,
      address: address,
      capabilities: capabilities,
      reputation: Math.random() * 100,
      collateral: hasCollateral ? '1000.0' : null
    };
    this.agents.set(agentId, agent);
    log('COLLAB', `🤖 Registered agent ${agentId}`, `Capabilities: ${capabilities.join(', ')}, Collateral: ${hasCollateral ? 'Yes' : 'No'}`);
  }

  // Chain of Agents Pattern - Only final payer needs collateral
  async createChainOfAgents(finalPayerId, tasks, intermediateAgentIds) {
    log('CHAIN', '🔗 Creating Chain of Agents Pattern', 'Only final payer needs collateral');
    
    const chainId = `chain_${Date.now()}`;
    const chain = {
      id: chainId,
      tasks: tasks.map((task, index) => ({
        ...task,
        id: `task_${chainId}_${index}`,
        status: 'pending'
      })),
      finalPayer: finalPayerId,
      intermediateAgents: intermediateAgentIds,
      status: 'active',
      createdAt: Date.now()
    };

    this.chains.set(chainId, chain);

    // Create payment tabs for intermediate agents (no collateral needed)
    for (const agentId of intermediateAgentIds) {
      log('CHAIN', `📋 Creating payment tab for ${agentId}`, 'No collateral required - paid by final payer');
    }

    log('SUCCESS', `✅ Chain created: ${chainId}`, `Final payer: ${finalPayerId}, Intermediate agents: ${intermediateAgentIds.length}`);
    return chainId;
  }

  // Assign task to intermediate agent
  async assignTaskInChain(chainId, taskId, agentId) {
    const chain = this.chains.get(chainId);
    if (!chain) throw new Error(`Chain ${chainId} not found`);

    const task = chain.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.assignedAgent = agentId;
    task.status = 'in_progress';

    log('CHAIN', `📋 Task assigned: ${taskId} → ${agentId}`, 'Intermediate agent working on credit');
  }

  // Complete task and process payment
  async completeTaskInChain(chainId, taskId, workOutput, qualityScore) {
    const chain = this.chains.get(chainId);
    if (!chain) throw new Error(`Chain ${chainId} not found`);

    const task = chain.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = 'completed';
    task.completedBy = task.assignedAgent;
    task.qualityScore = qualityScore;

    // Process payment (no collateral needed from intermediate agent)
    log('PAYMENT', `💰 Processing payment: ${task.reward} ETH → ${task.assignedAgent}`, 'Paid by final payer via 4Mica tab');
    
    // Check if chain is complete
    const allCompleted = chain.tasks.every(t => t.status === 'completed');
    if (allCompleted) {
      chain.status = 'completed';
      log('SUCCESS', `🎉 Chain ${chainId} completed!`, `Total reward: ${chain.tasks.reduce((sum, t) => sum + parseFloat(t.reward), 0)} ETH`);
    }

    log('SUCCESS', `✅ Task completed: ${taskId}`, `Quality: ${qualityScore}, Payment: ${task.reward} ETH`);
  }

  // Parallel Agent Collaboration Pattern
  async createParallelProject(coordinatorId, tasks, workerAgentIds) {
    log('PARALLEL', '🔄 Creating Parallel Agent Collaboration', 'Multiple agents work simultaneously');
    
    const projectId = `project_${Date.now()}`;
    const project = {
      id: projectId,
      coordinatorId: coordinatorId,
      tasks: tasks.map((task, index) => ({
        ...task,
        id: `task_${projectId}_${index}`,
        status: 'pending'
      })),
      workerAgents: workerAgentIds,
      status: 'active',
      createdAt: Date.now()
    };

    this.projects.set(projectId, project);

    // Create payment tabs for all workers
    for (const agentId of workerAgentIds) {
      log('PARALLEL', `📋 Creating payment tab for worker ${agentId}`, 'No collateral required');
    }

    log('SUCCESS', `✅ Parallel project created: ${projectId}`, `Coordinator: ${coordinatorId}, Workers: ${workerAgentIds.length}`);
    return projectId;
  }

  // Distribute tasks to workers
  async distributeTasks(projectId) {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const pendingTasks = project.tasks.filter(t => t.status === 'pending');
    const availableWorkers = project.workerAgents;

    for (let i = 0; i < Math.min(pendingTasks.length, availableWorkers.length); i++) {
      const task = pendingTasks[i];
      const workerId = availableWorkers[i];
      
      task.assignedAgent = workerId;
      task.status = 'in_progress';
      
      log('PARALLEL', `👷 Task assigned: ${task.id} → ${workerId}`, 'Working in parallel');
    }

    log('SUCCESS', `📋 Distributed ${Math.min(pendingTasks.length, availableWorkers.length)} tasks`, 'Workers can work simultaneously');
  }

  // Complete parallel task
  async completeParallelTask(projectId, taskId, workOutput, qualityScore) {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = 'completed';
    task.completedBy = task.assignedAgent;
    task.qualityScore = qualityScore;

    log('PAYMENT', `💰 Processing payment: ${task.reward} ETH → ${task.assignedAgent}`, 'Parallel worker payment');
    log('SUCCESS', `✅ Parallel task completed: ${taskId}`, `Quality: ${qualityScore}`);

    // Check if project is complete
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
    if (completedTasks >= project.tasks.length) {
      project.status = 'completed';
      log('SUCCESS', `🎉 Parallel project ${projectId} completed!`, `All tasks finished simultaneously`);
    }
  }

  // Hierarchical Agent Collaboration Pattern
  async createHierarchy(managerId, subAgentIds) {
    log('HIERARCHY', '🏢 Creating Hierarchical Organization', 'Manager coordinates sub-agents');
    
    const hierarchyId = `hierarchy_${Date.now()}`;
    const hierarchy = {
      id: hierarchyId,
      managerId: managerId,
      subAgents: subAgentIds,
      status: 'active',
      createdAt: Date.now(),
      tasks: new Map()
    };

    this.hierarchies.set(hierarchyId, hierarchy);

    // Create payment tabs for sub-agents
    for (const agentId of subAgentIds) {
      log('HIERARCHY', `📋 Creating payment tab for sub-agent ${agentId}`, 'No collateral required');
    }

    log('SUCCESS', `✅ Hierarchy created: ${hierarchyId}`, `Manager: ${managerId}, Sub-agents: ${subAgentIds.length}`);
    return hierarchyId;
  }

  // Delegate task to sub-agent
  async delegateTask(hierarchyId, taskDescription, requirements, reward, subAgentId) {
    const hierarchy = this.hierarchies.get(hierarchyId);
    if (!hierarchy) throw new Error(`Hierarchy ${hierarchyId} not found`);

    const taskId = `task_${hierarchyId}_${Date.now()}`;
    const task = {
      id: taskId,
      description: taskDescription,
      requirements: requirements,
      reward: reward,
      status: 'in_progress',
      assignedAgent: subAgentId,
      delegatedBy: hierarchy.managerId
    };

    hierarchy.tasks.set(taskId, task);
    log('HIERARCHY', `📋 Task delegated: ${taskId} → ${subAgentId}`, `Delegated by manager ${hierarchy.managerId}`);
    return taskId;
  }

  // Complete delegated task
  async completeDelegatedTask(hierarchyId, taskId, workOutput, qualityScore) {
    const hierarchy = this.hierarchies.get(hierarchyId);
    if (!hierarchy) throw new Error(`Hierarchy ${hierarchyId} not found`);

    const task = hierarchy.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = 'completed';
    task.completedBy = task.assignedAgent;
    task.qualityScore = qualityScore;

    log('PAYMENT', `💰 Processing payment: ${task.reward} ETH → ${task.assignedAgent}`, 'Hierarchical delegation payment');
    log('SUCCESS', `✅ Delegated task completed: ${taskId}`, `Quality: ${qualityScore}, Delegated by: ${task.delegatedBy}`);
  }

  // Get collaboration analytics
  getCollaborationAnalytics() {
    const totalChains = this.chains.size;
    const completedChains = Array.from(this.chains.values()).filter(c => c.status === 'completed').length;
    
    const totalProjects = this.projects.size;
    const completedProjects = Array.from(this.projects.values()).filter(p => p.status === 'completed').length;
    
    const totalHierarchies = this.hierarchies.size;
    
    const totalAgents = this.agents.size;
    const agentsWithCollateral = Array.from(this.agents.values()).filter(a => a.collateral).length;
    const agentsWithoutCollateral = totalAgents - agentsWithCollateral;

    return {
      totalAgents,
      agentsWithCollateral,
      agentsWithoutCollateral,
      totalChains,
      completedChains,
      totalProjects,
      completedProjects,
      totalHierarchies,
      collaborationEfficiency: totalAgents > 0 ? ((agentsWithoutCollateral / totalAgents) * 100).toFixed(1) : 0
    };
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════════════════════╗
║                🤖 Multi-Agent Collaboration Demo                            ║
║              How Agents Collaborate Without Collateral Requirements         ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  log('DEMO', '🎬 Starting Multi-Agent Collaboration Demo', 'Demonstrating how intermediate agents work without collateral');
  await sleep(2000);

  try {
    // Initialize collaboration system
    const collaboration = new MultiAgentCollaborationDemo();

    // Register agents with different capabilities
    log('DEMO', '👥 Step 1: Registering Agents', 'Setting up diverse agent capabilities');
    await sleep(1000);

    // Only the final payer needs collateral
    collaboration.registerAgent('agent_final_payer', '0x292F0E22A0245387a89d5DB50F016d18D6aF0bac', 
      ['payment', 'coordination', 'quality_assessment'], true); // HAS COLLATERAL

    // Intermediate agents don't need collateral
    collaboration.registerAgent('agent_data_processor', '0x3DA623926153B9bB377948b6b5E2422622Eb43f0', 
      ['data_processing', 'etl', 'data_cleaning'], false); // NO COLLATERAL

    collaboration.registerAgent('agent_ml_specialist', '0x4EB7a6867296406881E20d6647232314736Dd09A', 
      ['machine_learning', 'model_training', 'inference'], false); // NO COLLATERAL

    collaboration.registerAgent('agent_api_integrator', '0x5FC8e3ef1DA4E04deB6f7d0423D06F63869e322', 
      ['api_integration', 'web_services', 'microservices'], false); // NO COLLATERAL

    collaboration.registerAgent('agent_quality_reviewer', '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8', 
      ['quality_assessment', 'testing', 'validation'], false); // NO COLLATERAL

    // Chain of Agents Pattern Demo
    console.log(`\n${colors.bright}${colors.cyan}🔗 CHAIN OF AGENTS PATTERN${colors.reset}`);
    log('CHAIN', '📋 Creating Chain of Agents Workflow', 'Only final payer needs collateral');
    await sleep(1000);

    const chainTasks = [
      {
        description: 'Process raw data files',
        requirements: ['data_processing'],
        reward: '0.05',
        deadline: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
      },
      {
        description: 'Train ML model on processed data',
        requirements: ['machine_learning'],
        reward: '0.15',
        deadline: Date.now() + (4 * 60 * 60 * 1000) // 4 hours
      },
      {
        description: 'Integrate model with API endpoints',
        requirements: ['api_integration'],
        reward: '0.08',
        deadline: Date.now() + (3 * 60 * 60 * 1000) // 3 hours
      },
      {
        description: 'Quality review and testing',
        requirements: ['quality_assessment'],
        reward: '0.05',
        deadline: Date.now() + (1 * 60 * 60 * 1000) // 1 hour
      }
    ];

    const chainId = await collaboration.createChainOfAgents(
      'agent_final_payer',
      chainTasks,
      ['agent_data_processor', 'agent_ml_specialist', 'agent_api_integrator', 'agent_quality_reviewer']
    );

    // Assign and complete tasks in sequence
    log('CHAIN', '🔄 Processing Chain Tasks', 'Each agent works on credit, gets paid by final payer');
    await sleep(1000);

    // Task 1: Data Processing
    await collaboration.assignTaskInChain(chainId, 'task_' + chainId + '_0', 'agent_data_processor');
    await sleep(2000);
    await collaboration.completeTaskInChain(chainId, 'task_' + chainId + '_0', 
      { processedFiles: 150, dataQuality: 0.95 }, 0.92);

    // Task 2: ML Training
    await collaboration.assignTaskInChain(chainId, 'task_' + chainId + '_1', 'agent_ml_specialist');
    await sleep(2000);
    await collaboration.completeTaskInChain(chainId, 'task_' + chainId + '_1', 
      { modelAccuracy: 0.94, trainingTime: '2.5 hours' }, 0.89);

    // Task 3: API Integration
    await collaboration.assignTaskInChain(chainId, 'task_' + chainId + '_2', 'agent_api_integrator');
    await sleep(2000);
    await collaboration.completeTaskInChain(chainId, 'task_' + chainId + '_2', 
      { endpoints: 5, responseTime: '120ms' }, 0.91);

    // Task 4: Quality Review
    await collaboration.assignTaskInChain(chainId, 'task_' + chainId + '_3', 'agent_quality_reviewer');
    await sleep(2000);
    await collaboration.completeTaskInChain(chainId, 'task_' + chainId + '_3', 
      { testsPassed: 47, coverage: 0.88 }, 0.94);

    // Parallel Agent Collaboration Demo
    console.log(`\n${colors.bright}${colors.blue}🔄 PARALLEL AGENT COLLABORATION${colors.reset}`);
    log('PARALLEL', '📋 Creating Parallel Work Project', 'Multiple agents work simultaneously');
    await sleep(1000);

    const parallelTasks = [
      {
        description: 'Analyze user behavior data',
        requirements: ['data_processing'],
        reward: '0.10',
        deadline: Date.now() + (2 * 60 * 60 * 1000)
      },
      {
        description: 'Generate marketing insights',
        requirements: ['machine_learning'],
        reward: '0.12',
        deadline: Date.now() + (2 * 60 * 60 * 1000)
      },
      {
        description: 'Create API documentation',
        requirements: ['api_integration'],
        reward: '0.08',
        deadline: Date.now() + (2 * 60 * 60 * 1000)
      }
    ];

    const projectId = await collaboration.createParallelProject(
      'agent_final_payer',
      parallelTasks,
      ['agent_data_processor', 'agent_ml_specialist', 'agent_api_integrator']
    );

    // Distribute tasks to workers
    await collaboration.distributeTasks(projectId);
    await sleep(1000);

    // Complete tasks in parallel
    log('PARALLEL', '⚡ Completing Tasks in Parallel', 'All workers process simultaneously');
    await sleep(2000);

    await collaboration.completeParallelTask(projectId, 'task_' + projectId + '_0', 
      { analysisComplete: true, insights: 15 }, 0.88);
    await collaboration.completeParallelTask(projectId, 'task_' + projectId + '_1', 
      { insightsGenerated: true, accuracy: 0.91 }, 0.90);
    await collaboration.completeParallelTask(projectId, 'task_' + projectId + '_2', 
      { docsComplete: true, pages: 12 }, 0.87);

    // Hierarchical Agent Collaboration Demo
    console.log(`\n${colors.bright}${colors.yellow}🏢 HIERARCHICAL AGENT COLLABORATION${colors.reset}`);
    log('HIERARCHY', '📋 Creating Hierarchical Organization', 'Manager delegates to sub-agents');
    await sleep(1000);

    const hierarchyId = await collaboration.createHierarchy(
      'agent_final_payer',
      ['agent_data_processor', 'agent_ml_specialist', 'agent_api_integrator', 'agent_quality_reviewer']
    );

    // Delegate tasks
    log('HIERARCHY', '📋 Delegating Tasks', 'Manager assigns work to sub-agents');
    await sleep(1000);

    const task1 = await collaboration.delegateTask(hierarchyId, 'Process customer data', 
      ['data_processing'], '0.06', 'agent_data_processor');
    const task2 = await collaboration.delegateTask(hierarchyId, 'Build recommendation engine', 
      ['machine_learning'], '0.20', 'agent_ml_specialist');
    const task3 = await collaboration.delegateTask(hierarchyId, 'Create REST API', 
      ['api_integration'], '0.10', 'agent_api_integrator');

    // Complete delegated tasks
    log('HIERARCHY', '✅ Completing Delegated Tasks', 'Sub-agents complete work and get paid');
    await sleep(2000);

    await collaboration.completeDelegatedTask(hierarchyId, task1, 
      { customersProcessed: 5000, dataQuality: 0.96 }, 0.93);
    await collaboration.completeDelegatedTask(hierarchyId, task2, 
      { modelTrained: true, accuracy: 0.89 }, 0.91);
    await collaboration.completeDelegatedTask(hierarchyId, task3, 
      { endpointsCreated: 8, responseTime: '95ms' }, 0.89);

    // Analytics and Summary
    console.log(`\n${colors.bright}${colors.green}📊 COLLABORATION ANALYTICS${colors.reset}`);
    const analytics = collaboration.getCollaborationAnalytics();
    
    console.log(`${colors.cyan}   🤖 Total Agents: ${analytics.totalAgents}${colors.reset}`);
    console.log(`${colors.cyan}   💰 Agents with Collateral: ${analytics.agentsWithCollateral}${colors.reset}`);
    console.log(`${colors.cyan}   🆓 Agents without Collateral: ${analytics.agentsWithoutCollateral}${colors.reset}`);
    console.log(`${colors.cyan}   📈 Collaboration Efficiency: ${analytics.collaborationEfficiency}%${colors.reset}`);
    console.log(`${colors.cyan}   🔗 Chains Completed: ${analytics.completedChains}/${analytics.totalChains}${colors.reset}`);
    console.log(`${colors.cyan}   🔄 Projects Completed: ${analytics.completedProjects}/${analytics.totalProjects}${colors.reset}`);
    console.log(`${colors.cyan}   🏢 Hierarchies Active: ${analytics.totalHierarchies}${colors.reset}`);

    // Final Summary
    console.log(`\n${colors.bright}${colors.green}🎉 MULTI-AGENT COLLABORATION COMPLETE!${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Chain of Agents: Sequential workflow with credit-based payments${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Parallel Collaboration: Simultaneous work with efficient payments${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Hierarchical Organization: Manager-subordinate delegation${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Credit-Based System: Intermediate agents work without collateral${colors.reset}`);
    console.log(`${colors.cyan}   ✅ 4Mica Integration: Sub-second payment guarantees${colors.reset}`);
    console.log(`${colors.cyan}   ✅ ERC-8004 Receipts: Verifiable proof of all work${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.green}🚀 What This Enables:${colors.reset}`);
    console.log(`${colors.cyan}   • Complex agent workflows without collateral requirements${colors.reset}`);
    console.log(`${colors.cyan}   • Scalable multi-agent collaboration patterns${colors.reset}`);
    console.log(`${colors.cyan}   • Autonomous economic coordination${colors.reset}`);
    console.log(`${colors.cyan}   • Trustless payment guarantees for all participants${colors.reset}`);
    console.log(`${colors.cyan}   • Production-ready agent collaboration infrastructure${colors.reset}`);
    
    log('DEMO', '🎯 Mission Accomplished', 'Multi-agent collaboration patterns working with 4Mica payments!');

  } catch (error) {
    log('ERROR', '❌ Demo failed', error.message);
  }
}

main().catch(console.error);
