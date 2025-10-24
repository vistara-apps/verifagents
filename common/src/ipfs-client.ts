import axios from 'axios';

export interface IPFSFile {
  path: string;
  content: string | Buffer;
}

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export class IPFSClient {
  private pinataJWT: string;
  private pinataApiKey: string;
  private pinataSecretKey: string;
  private gateway: string;

  constructor(config?: {
    pinataJWT?: string;
    pinataApiKey?: string;
    pinataSecretKey?: string;
    gateway?: string;
  }) {
    this.pinataJWT = config?.pinataJWT || process.env.PINATA_JWT || '';
    this.pinataApiKey = config?.pinataApiKey || process.env.PINATA_API_KEY || '';
    this.pinataSecretKey = config?.pinataSecretKey || process.env.PINATA_SECRET_KEY || '';
    this.gateway = config?.gateway || process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
  }

  async uploadJSON(data: any, filename?: string): Promise<string> {
    if (!this.pinataJWT) {
      throw new Error('PINATA_JWT required for uploads');
    }

    const metadata = {
      name: filename || `data-${Date.now()}.json`,
      keyvalues: {
        timestamp: Date.now().toString(),
        type: 'json'
      }
    };

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: data,
          pinataMetadata: metadata
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.pinataJWT}`
          }
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error(`Failed to upload to IPFS: ${error}`);
    }
  }

  async uploadFile(file: Buffer, filename: string, mimeType?: string): Promise<string> {
    if (!this.pinataJWT) {
      throw new Error('PINATA_JWT required for uploads');
    }

    const formData = new FormData();
    const blob = new Blob([file], { type: mimeType || 'application/octet-stream' });
    formData.append('file', blob, filename);
    
    const metadata = {
      name: filename,
      keyvalues: {
        timestamp: Date.now().toString(),
        type: 'file'
      }
    };
    formData.append('pinataMetadata', JSON.stringify(metadata));

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`
          }
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('IPFS file upload error:', error);
      throw new Error(`Failed to upload file to IPFS: ${error}`);
    }
  }

  async fetchJSON<T = any>(ipfsHash: string): Promise<T> {
    try {
      const url = `${this.gateway}${ipfsHash}`;
      const response = await axios.get(url, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('IPFS fetch error:', error);
      throw new Error(`Failed to fetch from IPFS: ${ipfsHash}`);
    }
  }

  async fetchText(ipfsHash: string): Promise<string> {
    try {
      const url = `${this.gateway}${ipfsHash}`;
      const response = await axios.get(url, {
        responseType: 'text',
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('IPFS fetch error:', error);
      throw new Error(`Failed to fetch text from IPFS: ${ipfsHash}`);
    }
  }

  async fetchBuffer(ipfsHash: string): Promise<Buffer> {
    try {
      const url = `${this.gateway}${ipfsHash}`;
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('IPFS fetch error:', error);
      throw new Error(`Failed to fetch buffer from IPFS: ${ipfsHash}`);
    }
  }

  async pin(ipfsHash: string): Promise<void> {
    if (!this.pinataJWT) {
      throw new Error('PINATA_JWT required for pinning');
    }

    try {
      await axios.post(
        'https://api.pinata.cloud/pinning/pinByHash',
        {
          hashToPin: ipfsHash
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.pinataJWT}`
          }
        }
      );
    } catch (error) {
      console.error('IPFS pin error:', error);
      throw new Error(`Failed to pin IPFS hash: ${ipfsHash}`);
    }
  }

  async unpin(ipfsHash: string): Promise<void> {
    if (!this.pinataJWT) {
      throw new Error('PINATA_JWT required for unpinning');
    }

    try {
      await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`
          }
        }
      );
    } catch (error) {
      console.error('IPFS unpin error:', error);
      throw new Error(`Failed to unpin IPFS hash: ${ipfsHash}`);
    }
  }

  async listPins(): Promise<any[]> {
    if (!this.pinataJWT) {
      throw new Error('PINATA_JWT required for listing pins');
    }

    try {
      const response = await axios.get(
        'https://api.pinata.cloud/data/pinList',
        {
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`
          }
        }
      );
      return response.data.rows;
    } catch (error) {
      console.error('IPFS list pins error:', error);
      throw new Error('Failed to list pins');
    }
  }

  // Utility methods
  getIPFSUrl(hash: string): string {
    return `${this.gateway}${hash}`;
  }

  isValidIPFSHash(hash: string): boolean {
    // Basic validation for IPFS hashes
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) || 
           /^bafy[a-z0-9]{55}$/.test(hash) ||
           /^baf[a-z0-9]{56}$/.test(hash);
  }

  extractHashFromURI(uri: string): string | null {
    const match = uri.match(/ipfs:\/\/(.+)/) || uri.match(/\/ipfs\/(.+)/);
    return match ? match[1] : null;
  }
}