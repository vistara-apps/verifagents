import { ethers } from 'ethers';

// ERC-8004 Contract ABIs (simplified for common operations)
const IDENTITY_REGISTRY_ABI = [
  'function register(string memory tokenURI) external returns (uint256)',
  'function register(string memory tokenURI, tuple(string key, bytes value)[] memory metadata) external returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function setMetadata(uint256 agentId, string memory key, bytes memory value) external',
  'function getMetadata(uint256 agentId, string memory key) external view returns (bytes)',
  'event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)'
];

const REPUTATION_REGISTRY_ABI = [
  'function giveFeedback(uint256 agentId, uint8 score, bytes32 tag1, bytes32 tag2, string memory fileuri, bytes32 filehash, bytes memory feedbackAuth) external',
  'function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external',
  'function getSummary(uint256 agentId, address[] memory clientAddresses, bytes32 tag1, bytes32 tag2) external view returns (uint64 count, uint8 averageScore)',
  'function readAllFeedback(uint256 agentId, address[] memory clientAddresses, bytes32 tag1, bytes32 tag2, bool includeRevoked) external view returns (address[], uint8[], bytes32[], bytes32[], bool[])',
  'event NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint8 score, bytes32 indexed tag1, bytes32 tag2, string fileuri, bytes32 filehash)'
];

const VALIDATION_REGISTRY_ABI = [
  'function validationRequest(address validatorAddress, uint256 agentId, string memory requestUri, bytes32 requestHash) external',
  'function validationResponse(bytes32 requestHash, uint8 response, string memory responseUri, bytes32 responseHash, bytes32 tag) external',
  'function getValidationStatus(bytes32 requestHash) external view returns (address validatorAddress, uint256 agentId, uint8 response, bytes32 tag, uint256 lastUpdate)',
  'function getSummary(uint256 agentId, address[] memory validatorAddresses, bytes32 tag) external view returns (uint64 count, uint8 avgResponse)',
  'event ValidationRequest(address indexed validatorAddress, uint256 indexed agentId, string requestUri, bytes32 indexed requestHash)',
  'event ValidationResponse(address indexed validatorAddress, uint256 indexed agentId, bytes32 indexed requestHash, uint8 response, string responseUri, bytes32 tag)'
];

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  identityRegistry: string;
  reputationRegistry: string;
  validationRegistry: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  sepolia: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC || 'https://ethereum-sepolia.publicnode.com',
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    validationRegistry: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8'
  },
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    validationRegistry: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8'
  },
  optimismSepolia: {
    chainId: 11155420,
    name: 'Optimism Sepolia',
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC || 'https://sepolia.optimism.io',
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    validationRegistry: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8'
  },
  modeTestnet: {
    chainId: 919,
    name: 'Mode Testnet',
    rpcUrl: process.env.MODE_TESTNET_RPC || 'https://sepolia.mode.network',
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    validationRegistry: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8'
  }
};

export interface AgentMetadata {
  name: string;
  description: string;
  image?: string;
  endpoints: Array<{
    name: string;
    endpoint: string;
  }>;
  supportedTrust: string[];
}

export interface FeedbackAuth {
  agentId: number;
  clientAddress: string;
  indexLimit: number;
  expiry: number;
  chainId: number;
  identityRegistry: string;
  signerAddress: string;
}

export class ERC8004Client {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;
  private network: NetworkConfig;

  public identityRegistry: ethers.Contract;
  public reputationRegistry: ethers.Contract;
  public validationRegistry: ethers.Contract;

  constructor(networkName: string, privateKey?: string) {
    this.network = NETWORKS[networkName];
    if (!this.network) {
      throw new Error(`Unsupported network: ${networkName}`);
    }

    this.provider = new ethers.JsonRpcProvider(this.network.rpcUrl);
    
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }

    const signerOrProvider = this.signer || this.provider;

    this.identityRegistry = new ethers.Contract(
      this.network.identityRegistry,
      IDENTITY_REGISTRY_ABI,
      signerOrProvider
    );

    this.reputationRegistry = new ethers.Contract(
      this.network.reputationRegistry,
      REPUTATION_REGISTRY_ABI,
      signerOrProvider
    );

    this.validationRegistry = new ethers.Contract(
      this.network.validationRegistry,
      VALIDATION_REGISTRY_ABI,
      signerOrProvider
    );
  }

  // Agent Registration
  async registerAgent(tokenURI: string, metadata?: Array<{key: string, value: string}>): Promise<{agentId: number, txHash: string}> {
    if (!this.signer) {
      throw new Error('Signer required for registration');
    }

    let tx;
    if (metadata && metadata.length > 0) {
      const metadataEntries = metadata.map(m => ({
        key: m.key,
        value: ethers.toUtf8Bytes(m.value)
      }));
      tx = await this.identityRegistry.register(tokenURI, metadataEntries);
    } else {
      tx = await this.identityRegistry.register(tokenURI);
    }

    const receipt = await tx.wait();
    
    // Extract agent ID from Registered event
    const registeredEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = this.identityRegistry.interface.parseLog(log);
        return parsed?.name === 'Registered';
      } catch {
        return false;
      }
    });

    if (!registeredEvent) {
      throw new Error('Registration event not found');
    }

    const parsedEvent = this.identityRegistry.interface.parseLog(registeredEvent);
    const agentId = Number(parsedEvent?.args[0]);

    return {
      agentId,
      txHash: tx.hash
    };
  }

  // Reputation Management
  async giveFeedback(
    agentId: number,
    score: number,
    tag1: string = '',
    tag2: string = '',
    fileUri: string = '',
    feedbackAuth: string
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for feedback');
    }

    const tag1Bytes = tag1 ? ethers.id(tag1) : ethers.ZeroHash;
    const tag2Bytes = tag2 ? ethers.id(tag2) : ethers.ZeroHash;

    const tx = await this.reputationRegistry.giveFeedback(
      agentId,
      score,
      tag1Bytes,
      tag2Bytes,
      fileUri,
      ethers.ZeroHash, // filehash (optional for IPFS)
      feedbackAuth
    );

    await tx.wait();
    return tx.hash;
  }

  async getAgentReputation(agentId: number, clientAddresses: string[] = [], tag1: string = '', tag2: string = ''): Promise<{count: number, averageScore: number}> {
    const tag1Bytes = tag1 ? ethers.id(tag1) : ethers.ZeroHash;
    const tag2Bytes = tag2 ? ethers.id(tag2) : ethers.ZeroHash;

    const [count, averageScore] = await this.reputationRegistry.getSummary(
      agentId,
      clientAddresses,
      tag1Bytes,
      tag2Bytes
    );

    return {
      count: Number(count),
      averageScore: Number(averageScore)
    };
  }

  // Validation Management
  async requestValidation(
    validatorAddress: string,
    agentId: number,
    requestUri: string
  ): Promise<{requestHash: string, txHash: string}> {
    if (!this.signer) {
      throw new Error('Signer required for validation request');
    }

    const requestHash = ethers.keccak256(ethers.toUtf8Bytes(requestUri + Date.now()));

    const tx = await this.validationRegistry.validationRequest(
      validatorAddress,
      agentId,
      requestUri,
      requestHash
    );

    await tx.wait();

    return {
      requestHash,
      txHash: tx.hash
    };
  }

  async submitValidationResponse(
    requestHash: string,
    response: number,
    responseUri: string = '',
    tag: string = ''
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for validation response');
    }

    const tagBytes = tag ? ethers.id(tag) : ethers.ZeroHash;

    const tx = await this.validationRegistry.validationResponse(
      requestHash,
      response,
      responseUri,
      ethers.ZeroHash, // responseHash (optional for IPFS)
      tagBytes
    );

    await tx.wait();
    return tx.hash;
  }

  async getValidationStatus(requestHash: string): Promise<{
    validatorAddress: string;
    agentId: number;
    response: number;
    tag: string;
    lastUpdate: number;
  }> {
    const [validatorAddress, agentId, response, tag, lastUpdate] = 
      await this.validationRegistry.getValidationStatus(requestHash);

    return {
      validatorAddress,
      agentId: Number(agentId),
      response: Number(response),
      tag,
      lastUpdate: Number(lastUpdate)
    };
  }

  // Utility Methods
  async getAgentOwner(agentId: number): Promise<string> {
    return await this.identityRegistry.ownerOf(agentId);
  }

  async getAgentTokenURI(agentId: number): Promise<string> {
    return await this.identityRegistry.tokenURI(agentId);
  }

  async getAgentMetadata(agentId: number, key: string): Promise<string> {
    const bytesValue = await this.identityRegistry.getMetadata(agentId, key);
    return ethers.toUtf8String(bytesValue);
  }

  // Helper method to generate feedback authorization
  static async generateFeedbackAuth(
    agentPrivateKey: string,
    agentId: number,
    clientAddress: string,
    chainId: number,
    identityRegistry: string,
    indexLimit: number = 1,
    expiry?: number
  ): Promise<string> {
    const wallet = new ethers.Wallet(agentPrivateKey);
    const expiryTime = expiry || Math.floor(Date.now() / 1000) + 86400; // 24 hours

    const auth: FeedbackAuth = {
      agentId,
      clientAddress,
      indexLimit,
      expiry: expiryTime,
      chainId,
      identityRegistry,
      signerAddress: wallet.address
    };

    // Create the message hash according to EIP-191
    const structHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'address', 'uint64', 'uint256', 'uint256', 'address', 'address'],
      [auth.agentId, auth.clientAddress, auth.indexLimit, auth.expiry, auth.chainId, auth.identityRegistry, auth.signerAddress]
    ));

    const messageHash = ethers.keccak256(ethers.concat([
      ethers.toUtf8Bytes('\x19Ethereum Signed Message:\n32'),
      structHash
    ]));

    const signature = await wallet.signMessage(ethers.getBytes(structHash));

    // Pack auth + signature
    return ethers.concat([
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'address', 'uint64', 'uint256', 'uint256', 'address', 'address'],
        [auth.agentId, auth.clientAddress, auth.indexLimit, auth.expiry, auth.chainId, auth.identityRegistry, auth.signerAddress]
      ),
      signature
    ]);
  }
}

export * from './ipfs-client';
export * from './verification-utils';