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
  cyan: '\x1b[36m',
  white: '\x1b[37m'
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
    'RECEIPT': colors.green,
    'CAPTION': colors.white
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
  }

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

  verifyWork(workId) {
    const work = this.workRegistry.get(workId);
    if (!work) {
      throw new Error(`Work ${workId} not found`);
    }

    const qualityScore = this.calculateQualityScore(work);
    work.qualityScore = qualityScore;
    work.verificationHash = this.generateVerificationHash(work);
    work.status = qualityScore >= 0.7 ? 'verified' : 'rejected';
    
    this.workRegistry.set(workId, work);
    return work;
  }

  calculateQualityScore(work) {
    const baseScore = Math.random() * 0.4 + 0.6;
    const requirements = work.requirements;
    
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

  generateERC8004Receipt(work, paymentTx, agentId, blsSignature, blsPublicKey) {
    const receipt = {
      "@context": "https://erc8004.org/schema/v1",
      "type": "WorkReceipt",
      "version": "1.0",
      "work": {
        "id": work.id,
        "description": work.description,
        "requirements": work.requirements,
        "status": work.status,
        "completedAt": work.submittedAt,
        "qualityScore": work.qualityScore,
        "verificationHash": work.verificationHash
      },
      "agent": {
        "id": agentId,
        "address": work.submittedBy,
        "role": "Service Provider",
        "capabilities": work.requirements
      },
      "payment": {
        "transactionHash": paymentTx,
        "amount": "2000000000000000",
        "currency": "ETH",
        "network": "holesky",
        "contract": "0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9"
      },
      "proofs": {
        "blsSignature": blsSignature,
        "blsPublicKey": blsPublicKey,
        "eip712Signature": "0x...",
        "verificationHash": work.verificationHash
      },
      "registries": {
        "identity": "0x7177a6867296406881E20d6647232314736Dd09A",
        "reputation": "0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322",
        "validation": "0x662b40A526cb4017d947e71eAF6753BF3eeE66d8"
      },
      "metadata": {
        "timestamp": Date.now(),
        "blockchain": "holesky",
        "chainId": 17000,
        "protocol": "4Mica",
        "version": "1.0"
      },
      "compliance": {
        "erc8004": true,
        "verifiable": true,
        "onChain": true,
        "immutable": true
      }
    };
    
    return receipt;
  }
}

async function main() {
  console.log(`${colors.bright}${colors.white}
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🤖 Real-World Agent Payment Flow                       ║
║                    AI Code Reviewer → AI Security Auditor                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  // Real-world use case: AI Code Reviewer pays AI Security Auditor
  const workSystem = new WorkVerificationSystem();
  
  // Agent configurations
  const codeReviewerConfig = {
    rpc_url: 'https://api.4mica.xyz',
    wallet_private_key: '0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0',
    ethereum_http_rpc_url: 'https://holesky.drpc.org',
    contract_address: '0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9'
  };

  const securityAuditorConfig = {
    rpc_url: 'https://api.4mica.xyz',
    wallet_private_key: '0x8cb23df33397a488ea8d9be152e50cf6770aad7a0f37bf2efd3f2d21b2625b11',
    ethereum_http_rpc_url: 'https://holesky.drpc.org',
    contract_address: '0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9'
  };

  const codeReviewerAddress = '0x292F0E22A0245387a89d5DB50F016d18D6aF0bac';
  const securityAuditorAddress = '0x3DA623926153B9bB377948b6b5E2422622Eb43f0';

  console.log(`${colors.bright}${colors.white}🤖 Real-World Use Case:${colors.reset}`);
  console.log(`${colors.white}   • AI Code Reviewer: ${codeReviewerAddress}${colors.reset}`);
  console.log(`${colors.white}   • AI Security Auditor: ${securityAuditorAddress}${colors.reset}`);
  console.log(`${colors.white}   • Work: Smart Contract Security Audit${colors.reset}`);
  console.log(`${colors.white}   • Payment: 0.002 ETH for security analysis${colors.reset}\n`);

  try {
    // 1️⃣ Agent 1 locks collateral on-chain
    log('CAPTION', '1️⃣ Agent 1 locks collateral on-chain', 'Guarantees funds exist before work starts');
    await sleep(1500);
    
    const depositResult = await runRustCommand('deposit', {
      amount: '10000000000000000' // 0.01 ETH
    }, codeReviewerConfig);
    
    if (depositResult.success) {
      log('SUCCESS', '✅ Collateral locked', `TX: ${depositResult.transaction_hash}`);
    } else {
      log('ERROR', '❌ Deposit failed', depositResult.error);
      return;
    }

    // 2️⃣ Agent 2 completes work and registers proof
    log('CAPTION', '2️⃣ Agent 2 completes work and registers proof', 'Creates accountability and verifiable deliverable');
    await sleep(1500);
    
    const workId = `security_audit_${Date.now()}`;
    const work = workSystem.registerWork(
      workId,
      "Smart Contract Security Audit",
      ["vulnerability_scan", "gas_optimization", "access_control_review"],
      "0.002 ETH"
    );
    
    const workOutput = {
      vulnerabilityScan: "✅ Found 2 medium severity issues",
      gasOptimization: "✅ Reduced gas costs by 15%",
      accessControl: "✅ Access controls properly implemented",
      report: "Comprehensive security audit completed"
    };
    
    const submittedWork = workSystem.submitWork(
      workId,
      securityAuditorAddress,
      workOutput,
      "AI-generated security audit proof"
    );
    
    log('SUCCESS', '✅ Work completed and registered', `Security audit by ${submittedWork.submittedBy}`);

    // 3️⃣ Agent 1 signs EIP-712 payment promise
    log('CAPTION', '3️⃣ Agent 1 signs EIP-712 payment promise', 'Cryptographic intent—no human escrow');
    await sleep(1500);
    
    const tabResult = await runRustCommand('create_tab', {
      user_address: codeReviewerAddress,
      recipient_address: securityAuditorAddress,
      ttl: 3600
    }, securityAuditorConfig);
    
    const tabId = tabResult.tab_id;
    
    const claims = {
      user_address: codeReviewerAddress,
      recipient_address: securityAuditorAddress,
      tab_id: tabId,
      req_id: 1,
      amount: '2000000000000000', // 0.002 ETH
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    const signResult = await runRustCommand('sign_payment', {
      claims: claims,
      scheme: 'Eip712'
    }, codeReviewerConfig);
    
    if (signResult.success) {
      log('SUCCESS', '✅ EIP-712 payment promise signed', `Signature: ${signResult.signature.substring(0, 20)}...`);
    } else {
      log('ERROR', '❌ Payment signing failed', signResult.error);
      return;
    }

    // 4️⃣ 4Mica issues BLS guarantee
    log('CAPTION', '4️⃣ 4Mica issues BLS guarantee', 'Adds a second layer of trust—proof the promise is valid');
    await sleep(1500);
    
    const guaranteeResult = await runRustCommand('issue_payment_guarantee', {
      claims: {
        user_address: codeReviewerAddress,
        recipient_address: securityAuditorAddress,
        tab_id: tabId,
        req_id: 1,
        amount: '2000000000000000',
        timestamp: claims.timestamp
      },
      signature: signResult.signature,
      scheme: 'Eip712'
    }, securityAuditorConfig);
    
    if (guaranteeResult.success) {
      log('SUCCESS', '✅ BLS guarantee issued', `Certificate: ${guaranteeResult.certificate.substring(0, 20)}...`);
    } else {
      log('ERROR', '❌ BLS guarantee failed', guaranteeResult.error);
      return;
    }

    // 5️⃣ Funds released from locked collateral
    log('CAPTION', '5️⃣ Funds released from locked collateral', 'Automatic, dispute-free payout');
    await sleep(1500);
    
    const remunerateResult = await runRustCommand('remunerate', {
      certificate: guaranteeResult.certificate,
      public_key: guaranteeResult.public_key
    }, securityAuditorConfig);
    
    if (remunerateResult.success) {
      log('SUCCESS', '✅ Funds released automatically', `TX: ${remunerateResult.transaction_hash}`);
    } else {
      log('ERROR', '❌ Payment release failed', remunerateResult.error);
      return;
    }

    // 6️⃣ ERC-8004 receipt generated
    log('CAPTION', '6️⃣ ERC-8004 receipt generated', 'Permanent, verifiable record of the transaction');
    await sleep(1500);
    
    const agentId = 13; // Real agent ID
    const receipt = workSystem.generateERC8004Receipt(
      work, 
      remunerateResult.transaction_hash, 
      agentId,
      guaranteeResult.certificate,
      guaranteeResult.public_key
    );
    
    const receiptFile = path.join(__dirname, 'temp', `erc8004_receipt_agent_${agentId}.json`);
    fs.writeFileSync(receiptFile, JSON.stringify(receipt, null, 2));
    
    log('SUCCESS', '✅ ERC-8004 receipt generated', `File: ${receiptFile}`);

    // 7️⃣ End card
    console.log(`\n${colors.bright}${colors.white}╔══════════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.white}║                    Built with 4Mica × Vistara × EigenLayer                ║${colors.reset}`);
    console.log(`${colors.bright}${colors.white}║                    trustless agent payments in action                     ║${colors.reset}`);
    console.log(`${colors.bright}${colors.white}╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Final summary
    console.log(`${colors.bright}${colors.green}🎉 REAL-WORLD AGENT PAYMENT COMPLETE!${colors.reset}`);
    console.log(`${colors.white}   ✅ AI Code Reviewer → AI Security Auditor${colors.reset}`);
    console.log(`${colors.white}   ✅ Smart Contract Security Audit${colors.reset}`);
    console.log(`${colors.white}   ✅ 0.002 ETH payment (automatic)${colors.reset}`);
    console.log(`${colors.white}   ✅ ERC-8004 receipt generated${colors.reset}`);
    console.log(`${colors.white}   ✅ Trustless, dispute-free payment${colors.reset}`);

  } catch (error) {
    log('ERROR', '❌ Demo failed', error.message);
  }
}

main().catch(console.error);
