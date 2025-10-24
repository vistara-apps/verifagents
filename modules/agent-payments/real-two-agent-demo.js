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
    'ERROR': colors.red
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

async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🤖 4Mica Real Two-Agent Demo                            ║
║                        Complete Agent-to-Agent Payments                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  log('DEMO', '🎬 Starting Real Two-Agent Demo', 'Complete agent-to-agent payment flow');
  await sleep(2000);

  try {
    // Load configuration from environment or use provided values
    // IMPORTANT: Set these environment variables before running:
    // export PAYER_PRIVATE_KEY="your_payer_private_key"
    // export RECIPIENT_PRIVATE_KEY="your_recipient_private_key"

    const payerPrivateKey = process.env.PAYER_PRIVATE_KEY || '0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0';
    const recipientPrivateKey = process.env.RECIPIENT_PRIVATE_KEY || '0x8cb23df33397a488ea8d9be152e50cf6770aad7a0f37bf2efd3f2d21b2625b11';

    if (!process.env.PAYER_PRIVATE_KEY) {
      log('WARNING', '⚠️  Using default test private keys', 'Set PAYER_PRIVATE_KEY and RECIPIENT_PRIVATE_KEY env vars for your own keys');
    }

    // Agent 1: Payer (your funded wallet)
    const payerConfig = {
      rpc_url: process.env.RPC_URL || 'https://api.4mica.xyz',
      wallet_private_key: payerPrivateKey,
      ethereum_http_rpc_url: process.env.ETHEREUM_RPC_URL || 'https://ethereum-holesky.publicnode.com',
      contract_address: process.env.CONTRACT_ADDRESS || '0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9'
    };

    // Agent 2: Recipient (different agent)
    const recipientConfig = {
      rpc_url: process.env.RPC_URL || 'https://api.4mica.xyz',
      wallet_private_key: recipientPrivateKey,
      ethereum_http_rpc_url: process.env.ETHEREUM_RPC_URL || 'https://ethereum-holesky.publicnode.com',
      contract_address: process.env.CONTRACT_ADDRESS || '0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9'
    };

    const payerAddress = '0x292F0E22A0245387a89d5DB50F016d18D6aF0bac';
    const recipientAddress = '0x3DA623926153B9bB377948b6b5E2422622Eb43f0';

    console.log(`${colors.bright}${colors.green}🤖 Two-Agent Setup:${colors.reset}`);
    console.log(`${colors.cyan}   • Agent 1 (Payer): ${payerAddress}${colors.reset}`);
    console.log(`${colors.cyan}   • Agent 2 (Recipient): ${recipientAddress}${colors.reset}`);
    console.log(`${colors.cyan}   • Network: Holesky Testnet${colors.reset}`);
    console.log(`${colors.cyan}   • Contract: 0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9${colors.reset}\n`);

    // Step 1: Check Payer Status
    log('DEMO', '👤 Step 1: Checking Payer Agent', 'Verifying payer collateral');
    await sleep(1000);
    
    const payerResult = await runRustCommand('get_user', {}, payerConfig);
    if (payerResult.success) {
      log('SUCCESS', '✅ Payer status retrieved', `Collateral: ${payerResult.collateral} ETH`);
    } else {
      log('ERROR', '❌ Failed to get payer info', payerResult.error);
      return;
    }

    // Step 2: Deposit Collateral for Recipient Agent
    log('DEMO', '💰 Step 2: Depositing Collateral for Recipient Agent', 'Funding recipient for participation');
    await sleep(1000);
    
    const recipientDepositResult = await runRustCommand('deposit', {
      amount: '5000000000000000' // 0.005 ETH for recipient
    }, recipientConfig);
    
    if (recipientDepositResult.success) {
      log('SUCCESS', '✅ Recipient collateral deposited', `TX: ${recipientDepositResult.transaction_hash}`);
    } else {
      log('ERROR', '❌ Recipient deposit failed', recipientDepositResult.error);
      return;
    }

    // Step 3: Create Payment Tab (Recipient creates tab)
    log('DEMO', '📋 Step 3: Creating Payment Tab', 'Recipient establishes credit line with payer');
    await sleep(1000);
    
    const tabResult = await runRustCommand('create_tab', {
      user_address: payerAddress,
      recipient_address: recipientAddress,
      ttl: 3600 // 1 hour
    }, recipientConfig);
    
    if (tabResult.success) {
      log('SUCCESS', '✅ Payment tab created', `Tab ID: ${tabResult.tab_id}`);
    } else {
      log('ERROR', '❌ Failed to create tab', tabResult.error);
      return;
    }

    const tabId = tabResult.tab_id;

    // Step 4: Sign Payment (Payer signs payment promise)
    log('DEMO', '✍️  Step 4: Signing Payment', 'Payer creates EIP-712 signature for payment promise');
    await sleep(1000);
    
    const claims = {
      user_address: payerAddress,
      recipient_address: recipientAddress,
      tab_id: tabId,
      req_id: 1,
      amount: '1000000000000000', // 0.001 ETH in wei
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    const signResult = await runRustCommand('sign_payment', {
      claims: claims,
      scheme: 'Eip712'
    }, payerConfig);
    
    if (signResult.success) {
      log('SUCCESS', '✅ Payment signed', `Signature: ${signResult.signature.substring(0, 20)}...`);
    } else {
      log('ERROR', '❌ Payment signing failed', signResult.error);
      return;
    }

    // Step 5: Issue Payment Guarantee (Recipient issues guarantee)
    log('DEMO', '🎫 Step 5: Issuing Payment Guarantee', 'Recipient creates BLS certificate for trustless remuneration');
    await sleep(1000);
    
    const guaranteeResult = await runRustCommand('issue_payment_guarantee', {
      claims: {
        user_address: payerAddress,
        recipient_address: recipientAddress,
        tab_id: tabId,
        req_id: 1,
        amount: '1000000000000000',
        timestamp: claims.timestamp
      },
      signature: signResult.signature,
      scheme: 'Eip712'
    }, recipientConfig);
    
    if (guaranteeResult.success) {
      log('SUCCESS', '✅ Payment guarantee issued', `Certificate: ${guaranteeResult.certificate.substring(0, 20)}...`);
    } else {
      log('ERROR', '❌ Payment guarantee failed', guaranteeResult.error);
      return;
    }

    // Step 6: Remunerate (Recipient claims payment)
    log('DEMO', '💰 Step 6: Remunerating', 'Recipient claims payment from payer\'s collateral');
    await sleep(1000);
    
    const remunerateResult = await runRustCommand('remunerate', {
      certificate: guaranteeResult.certificate,
      public_key: guaranteeResult.public_key
    }, recipientConfig);
    
    if (remunerateResult.success) {
      log('SUCCESS', '✅ Payment claimed successfully', `TX: ${remunerateResult.transaction_hash}`);
    } else {
      log('ERROR', '❌ Remuneration failed', remunerateResult.error);
      return;
    }

    // Final Summary
    console.log(`\n${colors.bright}${colors.green}🎉 REAL TWO-AGENT DEMO COMPLETE!${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Payer Agent: ${payerAddress}${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Recipient Agent: ${recipientAddress}${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Payment Tab Created: ${tabId}${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Payment Signed: EIP-712 signature${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Payment Guarantee: BLS certificate${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Payment Claimed: Real blockchain transaction${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.green}🚀 What This Demonstrates:${colors.reset}`);
    console.log(`${colors.cyan}   • Real agent-to-agent payments${colors.reset}`);
    console.log(`${colors.cyan}   • Sub-second payment guarantees${colors.reset}`);
    console.log(`${colors.cyan}   • Cryptographically secure promises${colors.reset}`);
    console.log(`${colors.cyan}   • Trustless remuneration${colors.reset}`);
    console.log(`${colors.cyan}   • Autonomous economic loops${colors.reset}`);
    console.log(`${colors.cyan}   • Real blockchain transactions${colors.reset}`);
    
    log('DEMO', '🎯 Mission Accomplished', 'Complete two-agent payment system working with real transactions!');

  } catch (error) {
    log('ERROR', '❌ Demo failed', error.message);
  }
}

main().catch(console.error);
