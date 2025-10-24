const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testCreateTab() {
  const inputFile = path.join(__dirname, 'temp', `input_${Date.now()}.json`);
  const outputFile = path.join(__dirname, 'temp', `output_${Date.now()}.json`);
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'temp'))) {
    fs.mkdirSync(path.join(__dirname, 'temp'));
  }
  
  const input = {
    command: 'create_tab',
    args: {
      user_address: '0x60a09e4357868c1e9b801052726d061c370429f7', // payer
      recipient_address: '0x60a09e4357868c1e9b801052726d061c370429f7', // same as user
      ttl: 3600
    },
    config: {
      rpc_url: 'https://api.4mica.xyz',
      wallet_private_key: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // same as agent 1
      ethereum_http_rpc_url: 'https://ethereum-holesky.publicnode.com',
      contract_address: '0x698B98d6574dE06dD39A49Cc4e37f3B06d454Eb9'
    }
  };

  fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
  
  const rustProcess = spawn('./rust-client/target/release/fourmica-client', [inputFile, outputFile]);
  
  return new Promise((resolve, reject) => {
    rustProcess.on('close', (code) => {
      if (code === 0) {
        const result = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        console.log('Result:', JSON.stringify(result, null, 2));
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

testCreateTab().catch(console.error);
