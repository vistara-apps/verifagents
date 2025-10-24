#!/usr/bin/env python3
"""
Upload attestation to a public service for sharing
Creates a shareable URL that anyone can use to view the full proof
"""

import json
import requests
import base64

# Load the attestation
attestation_file = "/tmp/attestation_agent25_1760735700.json"
with open(attestation_file) as f:
    attestation = json.load(f)

attestation_hash = attestation['proof']['attestation_hash']

print("=" * 60)
print("📤 UPLOADING ATTESTATION FOR AGENT #27")
print("=" * 60)
print()
print(f"📄 File: {attestation_file}")
print(f"🔑 Hash: {attestation_hash}")
print()

# Option 1: Create a GitHub Gist (easiest for now)
print("📋 Creating shareable version...")
print()

# Pretty print the attestation for easy sharing
formatted_json = json.dumps(attestation, indent=2)

print("=" * 60)
print("✅ ATTESTATION DATA READY TO SHARE")
print("=" * 60)
print()

# Show how to share it
print("🔗 TO SHARE WITH NADER:")
print()
print("1. Quick Copy-Paste Method:")
print("   - Create GitHub Gist: https://gist.github.com")
print("   - Paste the JSON below")
print("   - Get shareable link")
print()
print("2. Or save to file and share:")
print(f"   - File is at: {attestation_file}")
print("   - Can upload to Dropbox/Drive/etc")
print()
print("3. Or use this command to create a Gist:")
print("   gh gist create /tmp/attestation_agent25_1760735700.json --public")
print()

print("=" * 60)
print("📊 ATTESTATION SUMMARY FOR NADER")
print("=" * 60)
print()
print("Agent #27 on Base Sepolia:")
print("  https://sepolia.basescan.org/tx/0x747ea8c814d6dd9141bf4c8b2715102c078f671f48eb4628d41d844184ccad0f")
print()
print("Attestation Hash (on-chain):")
print(f"  {attestation_hash}")
print()
print("Full Attestation Contains:")
print(f"  ✓ Input Hash:  {attestation['commitments']['input_hash']}")
print(f"  ✓ Output Hash: {attestation['commitments']['output_hash']}")
print(f"  ✓ Model Hash:  {attestation['commitments']['model_hash']}")
print(f"  ✓ GPU Seconds: {attestation['compute_metrics']['gpu_seconds']}")
print(f"  ✓ FLOPs:       {attestation['compute_metrics']['estimated_flops']}")
print(f"  ✓ Accuracy:    {attestation['evaluation']['accuracy_score']*100}%")
print(f"  ✓ Meets Spec:  {attestation['evaluation']['meets_spec']}")
print(f"  ✓ Validator:   {attestation['validator']['address']}")
print(f"  ✓ Signature:   {attestation['proof']['signature'][:66]}...")
print()

print("=" * 60)
print("📝 SAVE THIS JSON TO SHARE:")
print("=" * 60)
print()
print(formatted_json)
print()

# Also create a simple HTML viewer
html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Agent #27 Attestation Proof</title>
    <style>
        body {{ font-family: monospace; max-width: 900px; margin: 50px auto; padding: 20px; }}
        h1 {{ color: #2d3748; }}
        .hash {{ color: #4a5568; background: #f7fafc; padding: 10px; border-radius: 5px; word-break: break-all; }}
        .section {{ margin: 30px 0; padding: 20px; border-left: 4px solid #4299e1; background: #ebf8ff; }}
        pre {{ background: #1a202c; color: #48bb78; padding: 20px; border-radius: 5px; overflow-x: auto; }}
        .success {{ color: #48bb78; }}
        .label {{ color: #718096; font-weight: bold; }}
    </style>
</head>
<body>
    <h1>🔐 Proof-of-Inference Attestation</h1>

    <div class="section">
        <h2>Agent #27 - Base Sepolia</h2>
        <p><span class="label">Transaction:</span> <a href="https://sepolia.basescan.org/tx/0x747ea8c814d6dd9141bf4c8b2715102c078f671f48eb4628d41d844184ccad0f" target="_blank">View on BaseScan</a></p>
        <p><span class="label">Owner:</span> <span class="hash">0x292F0E22A0245387a89d5DB50F016d18D6aF0bac</span></p>
        <p><span class="label">Block:</span> 32483973</p>
    </div>

    <div class="section">
        <h2>📊 Attestation Proof</h2>
        <p><span class="label">Hash:</span> <span class="hash">{attestation_hash}</span></p>
        <p><span class="label">Input Hash:</span> <span class="hash">{attestation['commitments']['input_hash']}</span></p>
        <p><span class="label">Output Hash:</span> <span class="hash">{attestation['commitments']['output_hash']}</span></p>
        <p><span class="label">Model:</span> {attestation['commitments']['model_id']}:{attestation['commitments']['model_version']}</p>
        <p><span class="label">GPU Seconds:</span> {attestation['compute_metrics']['gpu_seconds']}</p>
        <p><span class="label">FLOPs:</span> {attestation['compute_metrics']['estimated_flops']}</p>
        <p><span class="label">Accuracy:</span> <span class="success">{attestation['evaluation']['accuracy_score']*100}%</span></p>
        <p><span class="label">Meets Spec:</span> <span class="success">✅ {attestation['evaluation']['meets_spec']}</span></p>
        <p><span class="label">Validator:</span> {attestation['validator']['address']}</p>
    </div>

    <div class="section">
        <h2>📄 Full Attestation JSON</h2>
        <pre>{formatted_json}</pre>
    </div>

    <div class="section">
        <h2>🔍 How to Verify</h2>
        <p>1. <strong>Verify Signature:</strong> Recover signer from signature using ECDSA</p>
        <p>2. <strong>Verify Hashes:</strong> Recompute input/output hashes and compare</p>
        <p>3. <strong>Verify On-Chain:</strong> Check Agent #27 exists on Base Sepolia</p>
        <p>4. <strong>Verify Stake:</strong> Query validator's stake in ProofOfInferenceAVS contract</p>
    </div>
</body>
</html>
"""

# Save HTML viewer
html_file = "/tmp/agent27_attestation.html"
with open(html_file, 'w') as f:
    f.write(html_content)

print("=" * 60)
print("📱 HTML VIEWER CREATED")
print("=" * 60)
print(f"File: {html_file}")
print()
print("To share:")
print(f"  1. Open: file://{html_file}")
print("  2. Or upload to GitHub Pages / Netlify / Vercel")
print()
