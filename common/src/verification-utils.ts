import { ethers } from 'ethers';
import crypto from 'crypto';

export interface VerificationProof {
  type: 'signature' | 'merkle' | 'zk' | 'tls';
  data: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export interface ReceiptData {
  agentId: number;
  workDescription: string;
  outputs: any;
  proofs: VerificationProof[];
  timestamp: number;
  networkChainId: number;
}

export class VerificationUtils {
  
  // Generate a cryptographic hash of work output
  static hashOutput(output: any): string {
    const serialized = JSON.stringify(output, Object.keys(output).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  // Create a Merkle tree for multiple outputs
  static createMerkleTree(outputs: any[]): { root: string; proofs: string[][] } {
    if (outputs.length === 0) {
      throw new Error('Cannot create Merkle tree with no outputs');
    }

    const leaves = outputs.map(output => this.hashOutput(output));
    
    if (leaves.length === 1) {
      return { root: leaves[0], proofs: [[]] };
    }

    const tree: string[][] = [leaves];
    let currentLevel = leaves;

    // Build tree levels
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      tree.push(nextLevel);
      currentLevel = nextLevel;
    }

    // Generate proofs for each leaf
    const proofs: string[][] = [];
    for (let i = 0; i < leaves.length; i++) {
      const proof: string[] = [];
      let index = i;
      
      for (let level = 0; level < tree.length - 1; level++) {
        const isRightNode = index % 2 === 1;
        const siblingIndex = isRightNode ? index - 1 : index + 1;
        
        if (siblingIndex < tree[level].length) {
          proof.push(tree[level][siblingIndex]);
        }
        
        index = Math.floor(index / 2);
      }
      
      proofs.push(proof);
    }

    return { root: tree[tree.length - 1][0], proofs };
  }

  // Verify Merkle proof
  static verifyMerkleProof(leaf: string, proof: string[], root: string): boolean {
    let computedHash = leaf;
    
    for (const proofElement of proof) {
      if (computedHash <= proofElement) {
        computedHash = crypto.createHash('sha256').update(computedHash + proofElement).digest('hex');
      } else {
        computedHash = crypto.createHash('sha256').update(proofElement + computedHash).digest('hex');
      }
    }
    
    return computedHash === root;
  }

  // Create a signature proof for agent work
  static async createSignatureProof(
    privateKey: string,
    workData: any,
    metadata: Record<string, any> = {}
  ): Promise<VerificationProof> {
    const wallet = new ethers.Wallet(privateKey);
    const dataHash = this.hashOutput(workData);
    const message = ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes(dataHash)));
    const signature = await wallet.signMessage(message);

    return {
      type: 'signature',
      data: signature,
      metadata: {
        signer: wallet.address,
        dataHash,
        ...metadata
      },
      timestamp: Date.now()
    };
  }

  // Verify signature proof
  static verifySignatureProof(proof: VerificationProof, workData: any, expectedSigner: string): boolean {
    if (proof.type !== 'signature') {
      return false;
    }

    try {
      const dataHash = this.hashOutput(workData);
      const message = ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes(dataHash)));
      const recoveredAddress = ethers.verifyMessage(message, proof.data);
      
      return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase() && 
             proof.metadata.dataHash === dataHash;
    } catch {
      return false;
    }
  }

  // Create a TLS oracle proof placeholder
  static createTLSProof(
    endpoint: string,
    response: any,
    certificate: string,
    metadata: Record<string, any> = {}
  ): VerificationProof {
    return {
      type: 'tls',
      data: JSON.stringify({
        endpoint,
        response,
        certificate
      }),
      metadata: {
        endpoint,
        certificateFingerprint: crypto.createHash('sha256').update(certificate).digest('hex'),
        ...metadata
      },
      timestamp: Date.now()
    };
  }

  // Create a ZK proof placeholder
  static createZKProof(
    circuit: string,
    publicInputs: any[],
    proof: string,
    metadata: Record<string, any> = {}
  ): VerificationProof {
    return {
      type: 'zk',
      data: proof,
      metadata: {
        circuit,
        publicInputs,
        ...metadata
      },
      timestamp: Date.now()
    };
  }

  // Generate a comprehensive receipt for verified work
  static generateReceipt(
    agentId: number,
    workDescription: string,
    outputs: any,
    proofs: VerificationProof[],
    chainId: number
  ): ReceiptData {
    return {
      agentId,
      workDescription,
      outputs,
      proofs,
      timestamp: Date.now(),
      networkChainId: chainId
    };
  }

  // Verify a complete receipt
  static verifyReceipt(receipt: ReceiptData, expectedSigner?: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic structure validation
    if (!receipt.agentId || !receipt.workDescription || !receipt.outputs) {
      errors.push('Invalid receipt structure');
    }

    if (!receipt.proofs || receipt.proofs.length === 0) {
      errors.push('No verification proofs provided');
    }

    // Verify each proof
    for (const proof of receipt.proofs) {
      switch (proof.type) {
        case 'signature':
          if (expectedSigner && !this.verifySignatureProof(proof, receipt.outputs, expectedSigner)) {
            errors.push('Invalid signature proof');
          }
          break;
        case 'merkle':
          // Add Merkle verification logic here
          break;
        case 'tls':
          // Add TLS verification logic here
          break;
        case 'zk':
          // Add ZK verification logic here
          break;
        default:
          errors.push(`Unknown proof type: ${proof.type}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate deterministic work ID
  static generateWorkId(agentId: number, workDescription: string, timestamp: number): string {
    const input = `${agentId}-${workDescription}-${timestamp}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  // Create content hash for IPFS verification
  static createContentHash(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Verify content matches hash
  static verifyContentHash(content: string | Buffer, expectedHash: string): boolean {
    const actualHash = this.createContentHash(content);
    return actualHash === expectedHash;
  }

  // Generate timestamp proof
  static generateTimestampProof(data: any, timestamp?: number): {
    timestamp: number;
    hash: string;
    proof: string;
  } {
    const ts = timestamp || Date.now();
    const dataHash = this.hashOutput(data);
    const combined = `${dataHash}-${ts}`;
    const proof = crypto.createHash('sha256').update(combined).digest('hex');

    return {
      timestamp: ts,
      hash: dataHash,
      proof
    };
  }

  // Verify timestamp proof
  static verifyTimestampProof(
    data: any,
    timestamp: number,
    proof: string,
    maxAge: number = 86400000 // 24 hours in ms
  ): boolean {
    const now = Date.now();
    if (now - timestamp > maxAge) {
      return false;
    }

    const dataHash = this.hashOutput(data);
    const combined = `${dataHash}-${timestamp}`;
    const expectedProof = crypto.createHash('sha256').update(combined).digest('hex');

    return expectedProof === proof;
  }
}