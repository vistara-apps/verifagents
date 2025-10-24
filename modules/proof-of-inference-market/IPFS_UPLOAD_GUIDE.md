# Upload Agent #27 Attestation to IPFS

## Current Status

**Agent #27 on Base Sepolia:** ✅
- https://sepolia.basescan.org/tx/0x747ea8c814d6dd9141bf4c8b2715102c078f671f48eb4628d41d844184ccad0f

**Full Attestation:** ✅
- File: `/tmp/attestation_agent25_1760735700.json`
- GitHub Gist: https://gist.github.com/mmchougule/6b2e6a965ab9708046c7411f32cf9563

**What's Missing:** Upload to IPFS for decentralized storage

---

## Quick IPFS Upload (Choose One)

### Option 1: Web3.Storage (EASIEST - No Installation)

1. Go to https://web3.storage
2. Sign up (free, email only)
3. Click "Upload Files"
4. Upload `/tmp/attestation_agent25_1760735700.json`
5. Get IPFS hash: `QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

**Result:** `ipfs://QmXXX...` (permanent, free)

---

### Option 2: NFT.Storage (FREE for NFT metadata)

1. Go to https://nft.storage
2. Sign up (free)
3. Upload `/tmp/attestation_agent25_1760735700.json`
4. Get IPFS hash

**Result:** `ipfs://QmXXX...` (permanent, backed by Filecoin)

---

### Option 3: Pinata (Most Popular)

1. Go to https://pinata.cloud
2. Sign up (free tier: 1GB)
3. Upload file or use API:

```bash
# Get JWT from Pinata dashboard
export PINATA_JWT="your_jwt_token"

# Upload via API
curl -X POST "https://api.pinata.cloud/pinning/pinFileToIPFS" \
  -H "Authorization: Bearer $PINATA_JWT" \
  -F "file=@/tmp/attestation_agent25_1760735700.json"
```

---

### Option 4: IPFS CLI (If you want local node)

```bash
# Install IPFS
brew install ipfs

# Initialize
ipfs init

# Start daemon (in background)
ipfs daemon &

# Upload file
ipfs add /tmp/attestation_agent25_1760735700.json

# Returns: added QmXXXXXXXXXXXXXXXXXXXXXX attestation_agent25_1760735700.json
```

---

## After Uploading to IPFS

Once you have the IPFS hash (e.g., `QmXXX...`):

### Access URLs:
- `ipfs://QmXXX...` (native IPFS)
- `https://ipfs.io/ipfs/QmXXX...` (public gateway)
- `https://cloudflare-ipfs.com/ipfs/QmXXX...` (Cloudflare gateway)
- `https://gateway.pinata.cloud/ipfs/QmXXX...` (Pinata gateway)

### Update Agent #27 TokenURI (Optional):

```python
from web3 import Web3
from eth_account import Account

w3 = Web3(Web3.HTTPProvider('https://sepolia.base.org'))

# Your wallet
pk = '0x8f2f6601c919fa725e4ccd4dae2af1aba1203545d2d9d157d1df57821fe9c7c0'
account = Account.from_key(pk)

# Contract ABI (if it has setTokenURI function)
abi = [{
    'inputs': [
        {'internalType': 'uint256', 'name': 'tokenId', 'type': 'uint256'},
        {'internalType': 'string', 'name': 'tokenURI', 'type': 'string'}
    ],
    'name': 'setTokenURI',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
}]

contract = w3.eth.contract(address='0x7177a6867296406881E20d6647232314736Dd09A', abi=abi)

# Update to IPFS URI
ipfs_hash = 'QmXXXXXXXXXXXXXXXXXXXX'  # Replace with actual hash
new_uri = f'ipfs://{ipfs_hash}'

tx = contract.functions.setTokenURI(27, new_uri).build_transaction({
    'from': account.address,
    'nonce': w3.eth.get_transaction_count(account.address),
    'gas': 100000,
    'gasPrice': w3.eth.gas_price,
    'chainId': 84532
})

signed = w3.eth.account.sign_transaction(tx, account.key)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)

print(f'Updated tokenURI to: {new_uri}')
print(f'TX: {tx_hash.hex()}')
```

---

## For NOW - What to Show Nader

**The GitHub Gist works perfectly fine for demonstration:**

✅ **On-Chain Receipt:**
- https://sepolia.basescan.org/tx/0x747ea8c814d6dd9141bf4c8b2715102c078f671f48eb4628d41d844184ccad0f

✅ **Full Attestation Proof:**
- https://gist.github.com/mmchougule/6b2e6a965ab9708046c7411f32cf9563
- Contains all components: input/output/model hashes, compute metrics, evaluation, signature

✅ **How it Works:**
1. Agent #27 stores attestation hash on-chain (immutable)
2. Full attestation lives at GitHub Gist (anyone can verify)
3. Hash connects them (integrity check)
4. Signature proves validator signed it

**You can migrate to IPFS later** - the important part is showing:
- Complete attestation structure
- Cryptographic verification
- On-chain receipts
- All components you discussed

---

## Recommended Next Step

**Quick win:** Use web3.storage (2 minute setup)

1. Go to https://web3.storage
2. Upload `/tmp/attestation_agent25_1760735700.json`
3. Get `ipfs://QmXXX...`
4. Share that with Nader

**Why web3.storage:**
- ✅ Free
- ✅ Backed by Filecoin (permanent)
- ✅ No installation needed
- ✅ Proper decentralized storage
- ✅ Industry standard for NFT metadata

Then you can say:
> "Agent #27 attestation is stored on IPFS at ipfs://QmXXX... - fully decentralized, permanent, and anyone can verify the proof."

Much better than GitHub Gist for production!
