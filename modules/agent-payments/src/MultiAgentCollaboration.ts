/**
 * Multi-Agent Collaboration Patterns with 4Mica Payments
 * 
 * This module implements various collaboration patterns where intermediate agents
 * don't need collateral, enabling complex agent workflows.
 */

import { RealFourMicaClient, RealAgentPaymentService } from './real-4mica-integration';
import { ERC8004Client } from '../../common/src/erc8004-client';

export interface Agent {
  id: string;
  address: string;
  capabilities: string[];
  reputation: number;
  collateral?: string;
}

export interface WorkTask {
  id: string;
  description: string;
  requirements: string[];
  reward: string;
  deadline: number;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
  completedBy?: string;
  qualityScore?: number;
}

export interface CollaborationChain {
  id: string;
  tasks: WorkTask[];
  totalReward: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  finalPayer: string; // Agent who pays for the entire chain
  intermediateAgents: string[]; // Agents who don't need collateral
}

/**
 * Chain of Agents Pattern - Intermediate parties don't need collateral
 * 
 * Flow: Agent A → Agent B → Agent C → Agent D
 * Only Agent A (final payer) needs collateral
 * Intermediate agents (B, C) work on credit and get paid by the final payer
 */
export class ChainOfAgentsCollaboration {
  private paymentService: RealAgentPaymentService;
  private erc8004Client: ERC8004Client;
  private agents: Map<string, Agent> = new Map();
  private activeChains: Map<string, CollaborationChain> = new Map();

  constructor(paymentService: RealAgentPaymentService, erc8004Client: ERC8004Client) {
    this.paymentService = paymentService;
    this.erc8004Client = erc8004Client;
  }

  /**
   * Register an agent in the collaboration system
   */
  async registerAgent(agent: Agent): Promise<void> {
    this.agents.set(agent.id, agent);
    await this.paymentService.registerAgent(agent.id, agent.address);
    console.log(`🤖 Registered agent ${agent.id} with capabilities: ${agent.capabilities.join(', ')}`);
  }

  /**
   * Create a chain of agents where only the final payer needs collateral
   */
  async createChainOfAgents(
    finalPayerId: string,
    tasks: Omit<WorkTask, 'id' | 'status'>[],
    intermediateAgentIds: string[]
  ): Promise<CollaborationChain> {
    console.log(`🔗 Creating chain of agents with final payer: ${finalPayerId}`);
    
    // Validate that final payer has collateral
    const finalPayer = this.agents.get(finalPayerId);
    if (!finalPayer || !finalPayer.collateral) {
      throw new Error(`Final payer ${finalPayerId} must have collateral`);
    }

    // Create work tasks
    const workTasks: WorkTask[] = tasks.map((task, index) => ({
      ...task,
      id: `task_${Date.now()}_${index}`,
      status: 'pending' as const
    }));

    // Calculate total reward
    const totalReward = workTasks.reduce((sum, task) => sum + parseFloat(task.reward), 0).toString();

    const chain: CollaborationChain = {
      id: `chain_${Date.now()}`,
      tasks: workTasks,
      totalReward,
      status: 'pending',
      createdAt: Date.now(),
      finalPayer: finalPayerId,
      intermediateAgents: intermediateAgentIds
    };

    this.activeChains.set(chain.id, chain);

    // Create payment tabs for intermediate agents (they don't need collateral)
    for (const agentId of intermediateAgentIds) {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not registered`);
      }

      // Create tab where final payer is the payer, intermediate agent is recipient
      await this.paymentService.createPaymentTab(
        agentId,
        '1000.0', // High credit limit
        24 * 7 // 7 days TTL
      );
    }

    console.log(`✅ Chain created: ${chain.id} with ${workTasks.length} tasks`);
    return chain;
  }

  /**
   * Assign a task to an intermediate agent (no collateral needed)
   */
  async assignTaskToAgent(chainId: string, taskId: string, agentId: string): Promise<void> {
    const chain = this.activeChains.get(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not found`);
    }

    const task = chain.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not registered`);
    }

    // Check if agent has required capabilities
    const hasCapabilities = task.requirements.every(req => 
      agent.capabilities.includes(req)
    );

    if (!hasCapabilities) {
      throw new Error(`Agent ${agentId} lacks required capabilities: ${task.requirements.join(', ')}`);
    }

    // Assign task
    task.assignedAgent = agentId;
    task.status = 'in_progress';
    chain.status = 'active';

    console.log(`📋 Task ${taskId} assigned to agent ${agentId}`);
  }

  /**
   * Complete a task and trigger payment to intermediate agent
   */
  async completeTask(
    chainId: string, 
    taskId: string, 
    workOutput: any, 
    qualityScore: number
  ): Promise<void> {
    const chain = this.activeChains.get(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not found`);
    }

    const task = chain.tasks.find(t => t.id === taskId);
    if (!task || !task.assignedAgent) {
      throw new Error(`Task ${taskId} not assigned`);
    }

    // Update task status
    task.status = 'completed';
    task.completedBy = task.assignedAgent;
    task.qualityScore = qualityScore;

    // Make payment to intermediate agent (no collateral needed from them)
    const paymentResult = await this.paymentService.makePayment({
      recipientAgentId: task.assignedAgent,
      amount: task.reward,
      description: `Task completion: ${task.description}`,
      workReceiptId: taskId,
      urgency: 'normal'
    });

    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }

    // Create ERC-8004 receipt for work completion
    await this.erc8004Client.createReceipt({
      agentId: task.assignedAgent,
      taskId: taskId,
      result: {
        workOutput,
        qualityScore,
        taskDescription: task.description,
        chainId: chainId
      },
      metadata: {
        type: 'chain_task_completion',
        chainId: chainId,
        taskId: taskId,
        qualityScore: qualityScore
      }
    });

    console.log(`✅ Task ${taskId} completed by ${task.assignedAgent}, payment: ${task.reward} ETH`);

    // Check if all tasks are completed
    const allCompleted = chain.tasks.every(t => t.status === 'completed');
    if (allCompleted) {
      chain.status = 'completed';
      chain.completedAt = Date.now();
      console.log(`🎉 Chain ${chainId} completed! Total reward: ${chain.totalReward} ETH`);
    }
  }

  /**
   * Get chain status and progress
   */
  getChainStatus(chainId: string): any {
    const chain = this.activeChains.get(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not found`);
    }

    const completedTasks = chain.tasks.filter(t => t.status === 'completed').length;
    const totalTasks = chain.tasks.length;
    const progress = (completedTasks / totalTasks) * 100;

    return {
      chainId: chain.id,
      status: chain.status,
      progress: Math.round(progress * 100) / 100,
      completedTasks,
      totalTasks,
      totalReward: chain.totalReward,
      finalPayer: chain.finalPayer,
      intermediateAgents: chain.intermediateAgents,
      tasks: chain.tasks.map(t => ({
        id: t.id,
        description: t.description,
        status: t.status,
        assignedAgent: t.assignedAgent,
        qualityScore: t.qualityScore
      }))
    };
  }
}

/**
 * Parallel Agent Collaboration Pattern
 * 
 * Multiple agents work on different parts simultaneously
 * Only one coordinator agent needs collateral
 */
export class ParallelAgentCollaboration {
  private paymentService: RealAgentPaymentService;
  private erc8004Client: ERC8004Client;
  private agents: Map<string, Agent> = new Map();
  private activeProjects: Map<string, any> = new Map();

  constructor(paymentService: RealAgentPaymentService, erc8004Client: ERC8004Client) {
    this.paymentService = paymentService;
    this.erc8004Client = erc8004Client;
  }

  /**
   * Create a parallel collaboration project
   */
  async createParallelProject(
    coordinatorId: string,
    tasks: Omit<WorkTask, 'id' | 'status'>[],
    workerAgentIds: string[]
  ): Promise<string> {
    console.log(`🔄 Creating parallel collaboration project with coordinator: ${coordinatorId}`);

    const projectId = `project_${Date.now()}`;
    const workTasks: WorkTask[] = tasks.map((task, index) => ({
      ...task,
      id: `task_${projectId}_${index}`,
      status: 'pending' as const
    }));

    // Create payment tabs for all worker agents
    for (const agentId of workerAgentIds) {
      await this.paymentService.createPaymentTab(
        agentId,
        '500.0', // Credit limit
        24 * 3 // 3 days TTL
      );
    }

    const project = {
      id: projectId,
      coordinatorId,
      tasks: workTasks,
      workerAgents: workerAgentIds,
      status: 'active',
      createdAt: Date.now(),
      completedTasks: 0,
      totalTasks: workTasks.length
    };

    this.activeProjects.set(projectId, project);
    console.log(`✅ Parallel project created: ${projectId}`);
    return projectId;
  }

  /**
   * Distribute tasks to worker agents
   */
  async distributeTasks(projectId: string): Promise<void> {
    const project = this.activeProjects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const pendingTasks = project.tasks.filter(t => t.status === 'pending');
    const availableWorkers = project.workerAgents.filter(agentId => {
      const agent = this.agents.get(agentId);
      return agent && agent.capabilities.length > 0;
    });

    // Distribute tasks to available workers
    for (let i = 0; i < pendingTasks.length && i < availableWorkers.length; i++) {
      const task = pendingTasks[i];
      const workerId = availableWorkers[i];
      
      await this.assignTaskToWorker(projectId, task.id, workerId);
    }

    console.log(`📋 Distributed ${Math.min(pendingTasks.length, availableWorkers.length)} tasks to workers`);
  }

  /**
   * Assign task to worker agent
   */
  private async assignTaskToWorker(projectId: string, taskId: string, workerId: string): Promise<void> {
    const project = this.activeProjects.get(projectId);
    if (!project) return;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.assignedAgent = workerId;
    task.status = 'in_progress';

    console.log(`👷 Task ${taskId} assigned to worker ${workerId}`);
  }

  /**
   * Complete task and process payment
   */
  async completeTask(
    projectId: string,
    taskId: string,
    workOutput: any,
    qualityScore: number
  ): Promise<void> {
    const project = this.activeProjects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const task = project.tasks.find(t => t.id === taskId);
    if (!task || !task.assignedAgent) {
      throw new Error(`Task ${taskId} not assigned`);
    }

    // Update task
    task.status = 'completed';
    task.completedBy = task.assignedAgent;
    task.qualityScore = qualityScore;
    project.completedTasks++;

    // Process payment
    const paymentResult = await this.paymentService.makePayment({
      recipientAgentId: task.assignedAgent,
      amount: task.reward,
      description: `Parallel task: ${task.description}`,
      workReceiptId: taskId,
      urgency: 'normal'
    });

    if (paymentResult.success) {
      // Create ERC-8004 receipt
      await this.erc8004Client.createReceipt({
        agentId: task.assignedAgent,
        taskId: taskId,
        result: {
          workOutput,
          qualityScore,
          projectId: projectId
        },
        metadata: {
          type: 'parallel_task_completion',
          projectId: projectId,
          taskId: taskId
        }
      });

      console.log(`✅ Task ${taskId} completed by ${task.assignedAgent}`);
    }

    // Check if project is complete
    if (project.completedTasks >= project.totalTasks) {
      project.status = 'completed';
      console.log(`🎉 Project ${projectId} completed!`);
    }
  }
}

/**
 * Hierarchical Agent Collaboration Pattern
 * 
 * Manager agents coordinate sub-agents
 * Only manager agents need collateral
 */
export class HierarchicalAgentCollaboration {
  private paymentService: RealAgentPaymentService;
  private erc8004Client: ERC8004Client;
  private agents: Map<string, Agent> = new Map();
  private hierarchies: Map<string, any> = new Map();

  constructor(paymentService: RealAgentPaymentService, erc8004Client: ERC8004Client) {
    this.paymentService = paymentService;
    this.erc8004Client = erc8004Client;
  }

  /**
   * Create a hierarchical organization
   */
  async createHierarchy(
    managerId: string,
    subAgentIds: string[],
    maxDepth: number = 3
  ): Promise<string> {
    console.log(`🏢 Creating hierarchical organization with manager: ${managerId}`);

    const hierarchyId = `hierarchy_${Date.now()}`;
    
    // Create payment tabs for all sub-agents
    for (const agentId of subAgentIds) {
      await this.paymentService.createPaymentTab(
        agentId,
        '200.0', // Credit limit
        24 * 5 // 5 days TTL
      );
    }

    const hierarchy = {
      id: hierarchyId,
      managerId,
      subAgents: subAgentIds,
      maxDepth,
      status: 'active',
      createdAt: Date.now(),
      tasks: new Map()
    };

    this.hierarchies.set(hierarchyId, hierarchy);
    console.log(`✅ Hierarchy created: ${hierarchyId}`);
    return hierarchyId;
  }

  /**
   * Delegate task to sub-agent
   */
  async delegateTask(
    hierarchyId: string,
    taskDescription: string,
    requirements: string[],
    reward: string,
    subAgentId: string
  ): Promise<string> {
    const hierarchy = this.hierarchies.get(hierarchyId);
    if (!hierarchy) {
      throw new Error(`Hierarchy ${hierarchyId} not found`);
    }

    const taskId = `task_${hierarchyId}_${Date.now()}`;
    const task: WorkTask = {
      id: taskId,
      description: taskDescription,
      requirements,
      reward,
      deadline: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      dependencies: [],
      status: 'in_progress',
      assignedAgent: subAgentId
    };

    hierarchy.tasks.set(taskId, task);

    console.log(`📋 Task delegated: ${taskId} to ${subAgentId}`);
    return taskId;
  }

  /**
   * Complete delegated task
   */
  async completeDelegatedTask(
    hierarchyId: string,
    taskId: string,
    workOutput: any,
    qualityScore: number
  ): Promise<void> {
    const hierarchy = this.hierarchies.get(hierarchyId);
    if (!hierarchy) {
      throw new Error(`Hierarchy ${hierarchyId} not found`);
    }

    const task = hierarchy.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Update task
    task.status = 'completed';
    task.completedBy = task.assignedAgent;
    task.qualityScore = qualityScore;

    // Process payment
    const paymentResult = await this.paymentService.makePayment({
      recipientAgentId: task.assignedAgent!,
      amount: task.reward,
      description: `Delegated task: ${task.description}`,
      workReceiptId: taskId,
      urgency: 'normal'
    });

    if (paymentResult.success) {
      // Create ERC-8004 receipt
      await this.erc8004Client.createReceipt({
        agentId: task.assignedAgent!,
        taskId: taskId,
        result: {
          workOutput,
          qualityScore,
          hierarchyId: hierarchyId,
          delegatedBy: hierarchy.managerId
        },
        metadata: {
          type: 'hierarchical_task_completion',
          hierarchyId: hierarchyId,
          taskId: taskId,
          managerId: hierarchy.managerId
        }
      });

      console.log(`✅ Delegated task ${taskId} completed by ${task.assignedAgent}`);
    }
  }
}

export default {
  ChainOfAgentsCollaboration,
  ParallelAgentCollaboration,
  HierarchicalAgentCollaboration
};
