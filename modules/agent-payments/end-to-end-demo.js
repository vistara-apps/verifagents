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
║                    🚀 4Mica End-to-End Payment Demo                        ║
║                        Complete Agent-to-Agent Flow                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  log('DEMO', '🎬 Starting Complete End-to-End Demo', 'Full 4Mica payment flow with real transactions');
  await sleep(2000);

  try {
    // Configuration - Using your funded wallet
    const payerConfig = {
      rpc_url: 'https://api.4mica.xyz',
      wallet_private_key: '0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0',
      ethereum_http_rpc_url: 'https://ethereum-holesky.publicnode.com',
      contract_address: '0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9'
    };

    // Two different agents for real agent-to-agent payments
    const recipientConfig = {
      rpc_url: 'https://api.4mica.xyz',
      wallet_private_key: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Different private key
      ethereum_http_rpc_url: 'https://ethereum-holesky.publicnode.com',
      contract_address: '0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9'
    };

    const userAddress = '0x292F0E22A0245387a89d5DB50F016d18D6aF0bac'; // Payer (your funded wallet)
    const recipientAddress = '0x3DA623926153B9bB377948b6b5E2422622Eb43f0'; // Recipient (different agent)

    // Step 1: Check User Status
    log('DEMO', '👤 Step 1: Checking User Status', 'Verifying collateral and user info');
    await sleep(1000);
    
    const userResult = await runRustCommand('get_user', {}, payerConfig);
    if (userResult.success) {
      log('SUCCESS', '✅ User status retrieved', `Collateral: ${userResult.collateral} ETH`);
    } else {
      log('ERROR', '❌ Failed to get user info', userResult.error);
      return;
    }

    // Step 1.5: Deposit More Collateral for Guarantees
    log('DEMO', '💰 Step 1.5: Depositing Additional Collateral', 'Adding more ETH for payment guarantees');
    await sleep(1000);
    
    const depositResult = await runRustCommand('deposit', {
      amount: '10000000000000000' // 0.01 ETH in wei (more collateral for guarantees)
    }, payerConfig);
    
    if (depositResult.success) {
      log('SUCCESS', '✅ Additional collateral deposited', `TX: ${depositResult.transaction_hash}`);
    } else {
      log('ERROR', '❌ Deposit failed', depositResult.error);
      return;
    }

    // Step 1.6: Deposit Collateral for Recipient Agent
    log('DEMO', '💰 Step 1.6: Depositing Collateral for Recipient Agent', 'Funding the recipient agent for tab creation');
    await sleep(1000);
    
    const recipientDepositResult = await runRustCommand('deposit', {
      amount: '10000000000000000' // 0.01 ETH in wei for recipient
    }, recipientConfig);
    
    if (recipientDepositResult.success) {
      log('SUCCESS', '✅ Recipient collateral deposited', `TX: ${recipientDepositResult.transaction_hash}`);
    } else {
      log('ERROR', '❌ Recipient deposit failed', recipientDepositResult.error);
      return;
    }

    // Step 2: Create Payment Tab
    log('DEMO', '📋 Step 2: Creating Payment Tab', 'Establishing credit line between agents');
    await sleep(1000);
    
    const tabResult = await runRustCommand('create_tab', {
      user_address: userAddress,
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

    // Step 3: Sign Payment
    log('DEMO', '✍️  Step 3: Signing Payment', 'Creating EIP-712 signature for payment promise');
    await sleep(1000);
    
    const claims = {
      user_address: userAddress,
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

    // Step 4: Issue Payment Guarantee
    log('DEMO', '🎫 Step 4: Issuing Payment Guarantee', 'Creating BLS certificate for trustless remuneration');
    await sleep(1000);
    
    const guaranteeResult = await runRustCommand('issue_payment_guarantee', {
      claims: {
        user_address: userAddress,
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

    // Step 5: Remunerate (Claim Payment)
    log('DEMO', '💰 Step 5: Remunerating', 'Claiming payment from collateral', guaranteeResult);
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
    console.log(`\n${colors.bright}${colors.green}🎉 END-TO-END DEMO COMPLETE!${colors.reset}`);
    console.log(`${colors.cyan}   ✅ Collateral deposited`);
    console.log(`${colors.cyan}   ✅ Payment tab created`);
    console.log(`${colors.cyan}   ✅ Payment signed with EIP-712`);
    console.log(`${colors.cyan}   ✅ Payment guarantee issued`);
    console.log(`${colors.cyan}   ✅ Payment claimed from collateral`);
    
    console.log(`\n${colors.bright}${colors.green}🚀 What This Demonstrates:${colors.reset}`);
    console.log(`${colors.cyan}   • Sub-second payment guarantees`);
    console.log(`${colors.cyan}   • Cryptographically secure promises`);
    console.log(`${colors.cyan}   • Trustless remuneration`);
    console.log(`${colors.cyan}   • Autonomous agent payments`);
    console.log(`${colors.cyan}   • Real blockchain transactions`);
    
    log('DEMO', '🎯 Mission Accomplished', 'Full 4Mica payment flow completed with real transactions!');

  } catch (error) {
    log('ERROR', '❌ Demo failed', error.message);
  }
}

main().catch(console.error);
