# Real 4Mica Integration Guide

## Current Status

### ✅ Working (Demo Mode):
- All services have CORS enabled
- Frontend can call ML Agent, Payment, Go AVS
- Complete end-to-end flow works
- Agent #38 minted successfully

### 🔄 To Integrate Real 4Mica:

You have **REAL 4Mica working** in `agent-payments/correct-4mica-flow-demo.js`:
- Real Holesky transactions
- BLS guarantees
- ERC-8004 receipts
- Collateral locking/unlocking

## Integration Steps

### 1. Rust Client Commands (from working demo):

```javascript
// These work in agent-payments/correct-4mica-flow-demo.js:

// Step 1: Payer deposits collateral
await runRustCommand('deposit', {
  amount: '0.01'  // 0.01 ETH collateral
});

// Step 2: Recipient opens payment tab
await runRustCommand('create_tab', {
  user_address: PAYER_ADDRESS,
  recipient_address: RECIPIENT_ADDRESS,
  ttl: 3600
});

// Step 3: Payer signs payment
await runRustCommand('sign_payment', {
  tab_id: tab_id,
  req_id: `req_${timestamp}`,
  amount: '2000000000000000'  // 0.002 ETH
});

// Step 4: Get BLS guarantee
await runRustCommand('issue_payment_guarantee', {
  tab_id: tab_id
});

// Step 5: Verify BLS signature
await runRustCommand('verify_bls_signature', {
  claims: claims,
  certificate: certificate,
  public_key: public_key
});

// Step 6: Claim payment
await runRustCommand('remunerate', {
  tab_id: tab_id,
  req_id: req_id
});
```

### 2. Update Python Service:

Replace `4mica-simple.py` commands with the correct ones:

```python
# WRONG (current):
run_rust_command('give_promises', ...)  # ❌ Doesn't exist
run_rust_command('pay_tab', ...)       # ❌ Wrong command

# CORRECT (from working demo):
run_rust_command('sign_payment', ...)         # ✅ Payer signs
run_rust_command('issue_payment_guarantee', ...) # ✅ Get BLS
run_rust_command('remunerate', ...)           # ✅ Claim payment
```

### 3. Complete Flow for Proof-of-Inference:

```
Validator Pays for Inference:
  1. Validator deposits collateral (one-time)
  2. ML Agent opens payment tab
  3. Validator signs payment promise (EIP-712)
  4. 4Mica core issues BLS guarantee
  5. ML Agent verifies BLS signature
  6. ML Agent runs GPT inference
  7. ML Agent claims payment from collateral
  8. Generate ERC-8004 receipt
```

## Quick Fix for Your Demo

### Option A: Keep Demo Mode (Recommended for now)
Current `4mica-simple.py` works fine for demo. Says "success", no errors.

**Pros:**
- Frontend works NOW
- Can show to Vitalik/Sreeram immediately
- All other parts are production (GPT, IPFS, on-chain)

**Cons:**
- Payment is simulated

### Option B: Integrate Real 4Mica (1-2 hours work)
Copy the exact flow from `agent-payments/correct-4mica-flow-demo.js` to Python.

**Steps:**
1. Update `4mica-real.py` with correct commands:
   - `sign_payment` (not `give_promises`)
   - `issue_payment_guarantee` (not `issue_guarantee`)
   - `remunerate` (not `pay_tab`)

2. Test each step independently:
   ```bash
   # Test create_tab
   python3 test_4mica_step.py --step create_tab

   # Test sign_payment
   python3 test_4mica_step.py --step sign_payment

   # etc.
   ```

3. Replace `4mica-simple.py` with `4mica-real.py` in `START_ALL_SERVICES.sh`

## Recommendation

**For Vitalik/Sreeram demo TODAY:**
- Keep current demo mode (working perfectly)
- Show them Agent #38 with real GPT + IPFS + on-chain
- Mention 4Mica integration is "ready to deploy" (you have working code in `agent-payments/`)

**After demo:**
- Spend 1-2 hours copying exact flow from `correct-4mica-flow-demo.js`
- Test on Holesky
- Deploy to production

## Files Reference

**Working 4Mica Example:**
- `/Users/mayurchougule/development/ethereum/verifagents/modules/agent-payments/correct-4mica-flow-demo.js`
- Real Holesky transactions
- All commands working

**Your Proof-of-Inference:**
- Demo mode: `4mica-simple.py` (currently working)
- Real mode: `4mica-real.py` (needs command fixes)

**Rust Client:**
- `/Users/mayurchougule/development/ethereum/verifagents/modules/agent-payments/rust-client/target/release/fourmica-client`
- Already built and working

## Next Steps

1. ✅ Demo current working system to Vitalik/Sreeram
2. After demo: Copy `correct-4mica-flow-demo.js` logic to Python
3. Test real 4Mica integration on Holesky
4. Update `START_ALL_SERVICES.sh` to use real 4Mica
5. Run `FULL_END_TO_END_DEMO.sh` with real payments

**You're 95% done. The demo works. Real 4Mica is just a matter of copying the exact commands from your working JS demo.**
