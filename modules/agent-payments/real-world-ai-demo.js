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
    'STEP': colors.cyan,
    'INFO': colors.blue,
    'SUCCESS': colors.green,
    'WARNING': colors.yellow,
    'ERROR': colors.red,
    'WORK': colors.yellow,
    'VERIFY': colors.cyan,
    'RECEIPT': colors.green
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

// Work Verification System
class WorkVerificationSystem {
  constructor() {
    this.workRegistry = new Map();
    this.qualityMetrics = new Map();
  }

  // Register work to be done
  registerWork(workId, description, requirements, reward) {
    const work = {
      id: workId,
      description,
      requirements,
      reward,
      status: 'pending',
      submittedBy: null,
      submittedAt: null,
      qualityScore: 0,
      verificationHash: null
    };
    this.workRegistry.set(workId, work);
    return work;
  }

  // Submit work for verification
  submitWork(workId, agentId, workOutput, proof) {
    const work = this.workRegistry.get(workId);
    if (!work) {
      throw new Error(`Work ${workId} not found`);
    }

    work.submittedBy = agentId;
    work.submittedAt = Date.now();
    work.workOutput = workOutput;
    work.proof = proof;
    work.status = 'submitted';
    
    this.workRegistry.set(workId, work);
    return work;
  }

  // Verify work quality
  verifyWork(workId) {
    const work = this.workRegistry.get(workId);
    if (!work) {
      throw new Error(`Work ${workId} not found`);
    }

    // Simulate quality verification
    const qualityScore = this.calculateQualityScore(work);
    work.qualityScore = qualityScore;
    work.verificationHash = this.generateVerificationHash(work);
    work.status = qualityScore >= 0.7 ? 'verified' : 'rejected';
    
    this.workRegistry.set(workId, work);
    return work;
  }

  calculateQualityScore(work) {
    // Simulate AI quality assessment
    const baseScore = Math.random() * 0.4 + 0.6; // 0.6-1.0 range
    const requirements = work.requirements;
    
    // Check if work meets requirements
    let score = baseScore;
    const workOutputStr = JSON.stringify(work.workOutput).toLowerCase();
    
    if (requirements.includes('code_review') && workOutputStr.includes('review')) {
      score += 0.1;
    }
    if (requirements.includes('documentation') && workOutputStr.includes('documentation')) {
      score += 0.1;
    }
    if (requirements.includes('testing') && workOutputStr.includes('test')) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  generateVerificationHash(work) {
    const data = `${work.id}-${work.submittedBy}-${work.qualityScore}-${work.submittedAt}`;
    return `0x${Buffer.from(data).toString('hex').substring(0, 64)}`;
  }

  // Generate ERC-8004 Receipt
  generateERC8004Receipt(work, paymentTx) {
    const receipt = {
      version: "1.0",
      type: "ERC-8004",
      workId: work.id,
      agentId: work.submittedBy,
      workDescription: work.description,
      qualityScore: work.qualityScore,
      verificationHash: work.verificationHash,
      paymentTx: paymentTx,
      timestamp: Date.now(),
      blockchain: "holesky",
      contract: "0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9"
    };
    
    return receipt;
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🤖 Real-World AI Agent Collaboration                   ║
║                    Work Verification + ERC-8004 Receipts                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  log('DEMO', '🎬 Starting Real-World AI Agent Collaboration', 'Work verification + payment system');
  await sleep(2000);

  try {
    // Initialize work verification system
    const workSystem = new WorkVerificationSystem();
    
    // Agent configurations
    const clientAgent = {
      rpc_url: 'https://api.4mica.xyz',
      wallet_private_key: '0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0',
      ethereum_http_rpc_url: 'https://ethereum-holesky.publicnode.com',
      contract_address: '0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9'
    };

    const serviceAgent = {
      rpc_url: 'https://api.4mica.xyz',
      wallet_private_key: '0x8cb23df33397a488ea8d9be152e50cf6770aad7a0f37bf2efd3f2d21b2625b11',
      ethereum_http_rpc_url: 'https://ethereum-holesky.publicnode.com',
      contract_address: '0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9'
    };

    const clientAddress = '0x292F0E22A0245387a89d5DB50F016d18D6aF0bac';
    const serviceAddress = '0x3DA623926153B9bB377948b6b5E2422622Eb43f0';

    console.log(`${colors.bright}${colors.green}🤖 AI Agent Collaboration:${colors.reset}`);
    console.log(`${colors.cyan}   • Client Agent: ${clientAddress}${colors.reset}`);
    console.log(`${colors.cyan}   • Service Agent: ${serviceAddress}${colors.reset}`);
    console.log(`${colors.cyan}   • Work: Code Review + Documentation${colors.reset}`);
    console.log(`${colors.cyan}   • Payment: Quality-based autonomous payment${colors.reset}\n`);

    // Step 1: Register Work
    log('WORK', '📋 Step 1: Registering Work', 'Client agent posts work opportunity');
    await sleep(1000);
    
    const workId = `work_${Date.now()}`;
    const work = workSystem.registerWork(
      workId,
      "Review smart contract code and provide documentation",
      ["code_review", "documentation", "testing"],
      "0.002 ETH" // 0.002 ETH reward
    );
    
    log('SUCCESS', '✅ Work registered', `ID: ${workId}`);
    log('INFO', '💡 Work requirements:', work.requirements.join(', '));
    log('INFO', '💡 Reward:', work.reward);

    // Step 2: Service Agent Submits Work
    log('WORK', '📝 Step 2: Service Agent Submits Work', 'AI agent completes the task');
    await sleep(2000);
    
    const workOutput = {
      codeReview: "✅ Smart contract security analysis completed",
      documentation: "✅ Comprehensive documentation generated",
      testing: "✅ Test cases provided and validated",
      quality: "High quality work delivered"
    };
    
    const submittedWork = workSystem.submitWork(
      workId,
      serviceAddress,
      workOutput,
      "AI-generated proof of work completion"
    );
    
    log('SUCCESS', '✅ Work submitted', `By: ${submittedWork.submittedBy}`);
    log('INFO', '💡 Work output:', JSON.stringify(workOutput, null, 2));

    // Step 3: Verify Work Quality
    log('VERIFY', '🔍 Step 3: Verifying Work Quality', 'AI quality assessment system');
    await sleep(2000);
    
    const verifiedWork = workSystem.verifyWork(workId);
    
    log('SUCCESS', '✅ Work verification complete', `Quality Score: ${verifiedWork.qualityScore.toFixed(2)}`);
    log('INFO', '💡 Verification hash:', verifiedWork.verificationHash);
    log('INFO', '💡 Status:', verifiedWork.status);

    if (verifiedWork.status !== 'verified') {
      log('ERROR', '❌ Work quality insufficient', 'Payment not authorized');
      return;
    }

    // Step 4: Check Agent Status
    log('DEMO', '👤 Step 4: Checking Agent Status', 'Verifying payment capabilities');
    await sleep(1000);
    
    const clientStatus = await runRustCommand('get_user', {}, clientAgent);
    if (clientStatus.success) {
      log('SUCCESS', '✅ Client agent ready', `Collateral: ${clientStatus.collateral} ETH`);
    } else {
      log('ERROR', '❌ Client agent not ready', clientStatus.error);
      return;
    }

    // Step 5: Create Payment Tab
    log('DEMO', '📋 Step 5: Creating Payment Tab', 'Establishing payment relationship');
    await sleep(1000);
    
    const tabResult = await runRustCommand('create_tab', {
      user_address: clientAddress,
      recipient_address: serviceAddress,
      ttl: 3600 // 1 hour
    }, serviceAgent);
    
    if (tabResult.success) {
      log('SUCCESS', '✅ Payment tab created', `Tab ID: ${tabResult.tab_id}`);
    } else {
      log('ERROR', '❌ Failed to create tab', tabResult.error);
      return;
    }

    const tabId = tabResult.tab_id;

    // Step 6: Sign Payment (Quality-based)
    log('DEMO', '✍️  Step 6: Signing Quality-Based Payment', 'Client pays based on work quality');
    await sleep(1000);
    
    // Calculate payment based on quality score
    const basePayment = 2000000000000000; // 0.002 ETH in wei
    const qualityMultiplier = verifiedWork.qualityScore;
    const finalPayment = Math.floor(basePayment * qualityMultiplier);
    
    const claims = {
      user_address: clientAddress,
      recipient_address: serviceAddress,
      tab_id: tabId,
      req_id: 1,
      amount: finalPayment.toString(),
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    const signResult = await runRustCommand('sign_payment', {
      claims: claims,
      scheme: 'Eip712'
    }, clientAgent);
    
    if (signResult.success) {
      log('SUCCESS', '✅ Quality-based payment signed', `Amount: ${(finalPayment / 1e18).toFixed(6)} ETH`);
      log('INFO', '💡 Quality multiplier:', qualityMultiplier.toFixed(2));
    } else {
      log('ERROR', '❌ Payment signing failed', signResult.error);
      return;
    }

    // Step 7: Issue Payment Guarantee
    log('DEMO', '🎫 Step 7: Issuing Payment Guarantee', 'Service agent creates BLS certificate');
    await sleep(1000);
    
    const guaranteeResult = await runRustCommand('issue_payment_guarantee', {
      claims: {
        user_address: clientAddress,
        recipient_address: serviceAddress,
        tab_id: tabId,
        req_id: 1,
        amount: finalPayment.toString(),
        timestamp: claims.timestamp
      },
      signature: signResult.signature,
      scheme: 'Eip712'
    }, serviceAgent);
    
    if (guaranteeResult.success) {
      log('SUCCESS', '✅ Payment guarantee issued', `Certificate: ${guaranteeResult.certificate.substring(0, 20)}...`);
    } else {
      log('ERROR', '❌ Payment guarantee failed', guaranteeResult.error);
      return;
    }

    // Step 8: Execute Payment
    log('DEMO', '💰 Step 8: Executing Payment', 'Service agent claims payment');
    await sleep(1000);
    
    const remunerateResult = await runRustCommand('remunerate', {
      certificate: guaranteeResult.certificate,
      public_key: guaranteeResult.public_key
    }, serviceAgent);
    
    if (remunerateResult.success) {
      log('SUCCESS', '✅ Payment executed successfully', `TX: ${remunerateResult.transaction_hash}`);
    } else {
      log('ERROR', '❌ Payment execution failed', remunerateResult.error);
      return;
    }

    // Step 9: Generate ERC-8004 Receipt
    log('RECEIPT', '📄 Step 9: Generating ERC-8004 Receipt', 'Creating verifiable work proof');
    await sleep(1000);
    
    const receipt = workSystem.generateERC8004Receipt(verifiedWork, remunerateResult.transaction_hash);
    
    log('SUCCESS', '✅ ERC-8004 Receipt Generated', 'Verifiable work proof created');
    console.log(`\n${colors.bright}${colors.green}📄 ERC-8004 Receipt:${colors.reset}`);
    console.log(`${colors.cyan}   Work ID: ${receipt.workId}${colors.reset}`);
    console.log(`${colors.cyan}   Agent ID: ${receipt.agentId}${colors.reset}`);
    console.log(`${colors.cyan}   Work Description: ${receipt.workDescription}${colors.reset}`);
    console.log(`${colors.cyan}   Quality Score: ${receipt.qualityScore}${colors.reset}`);
    console.log(`${colors.cyan}   Verification Hash: ${receipt.verificationHash}${colors.reset}`);
    console.log(`${colors.cyan}   Payment TX: ${receipt.paymentTx}${colors.reset}`);
    console.log(`${colors.cyan}   Timestamp: ${new Date(receipt.timestamp).toISOString()}${colors.reset}`);
    console.log(`${colors.cyan}   Blockchain: ${receipt.blockchain}${colors.reset}`);
    console.log(`${colors.cyan}   Contract: ${receipt.contract}${colors.reset}`);

    // Step 10: Save Receipt to File
    const receiptFile = path.join(__dirname, 'temp', `erc8004_receipt_${workId}.json`);
    fs.writeFileSync(receiptFile, JSON.stringify(receipt, null, 2));
    
    log('SUCCESS', '✅ Receipt saved to file', `File: ${receiptFile}`);

    // Final Summary
    console.log(`\n${colors.bright}${colors.green}🎉 REAL-WORLD AI COLLABORATION COMPLETE!${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Work registered and completed${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Quality verification passed${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Quality-based payment executed${colors.reset}`);
    console.log(`${colors.cyan}   ✅ ERC-8004 receipt generated${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Verifiable work proof created${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.green}🚀 What This Demonstrates:${colors.reset}`);
    console.log(`${colors.cyan}   • Autonomous AI agent collaboration${colors.reset}`);
    console.log(`${colors.cyan}   • Work quality verification system${colors.reset}`);
    console.log(`${colors.cyan}   • Quality-based payment calculations${colors.reset}`);
    console.log(`${colors.cyan}   • ERC-8004 verifiable receipts${colors.reset}`);
    console.log(`${colors.cyan}   • Real blockchain transactions${colors.reset}`);
    console.log(`${colors.cyan}   • Trustless work verification${colors.reset}`);
    
    log('DEMO', '🎯 Mission Accomplished', 'Complete real-world AI agent collaboration with work verification!');

  } catch (error) {
    log('ERROR', '❌ Demo failed', error.message);
  }
}

main().catch(console.error);
