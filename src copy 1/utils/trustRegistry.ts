import { ethers } from 'ethers';
import { IssuerType, CredentialCategory, IssuerProfile } from '../types/did';

// Trust Registry ABI (simplified for key functions)
const TRUST_REGISTRY_ABI = [
  "function registerIssuer(string did, string name, uint8 issuerType, string description, string website, string[] accreditations) external",
  "function authorizeIssuerForCategory(string did, uint8 category) external",
  "function anchorCredential(bytes32 hash, string issuerDID, string subjectDID, uint8 category, uint256 expirationDate) external",
  "function revokeCredential(bytes32 hash, string reason) external",
  "function verifyCredential(bytes32 hash) external view returns (bool exists, string issuerDID, string subjectDID, uint8 category, uint256 issuanceDate, uint256 expirationDate, bool isRevoked, string revocationReason, uint256 version, bool issuerTrusted)",
  "function getIssuerInfo(string did) external view returns (string name, uint8 issuerType, string description, uint256 trustScore, bool isActive, string[] accreditations)",
  "function isIssuerAuthorizedForCategory(string did, uint8 category) external view returns (bool)",
  "function getAllIssuers() external view returns (string[] memory)"
];

// ⚠️ IMPORTANT: Replace this with your actual deployed contract address
const TRUST_REGISTRY_ADDRESS = "0x2ed1c8B78F6e3502243B081db5a4BcD4B6a6863F";

export class TrustRegistryManager {
  private contract: ethers.Contract;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.contract = new ethers.Contract(
      TRUST_REGISTRY_ADDRESS,
      TRUST_REGISTRY_ABI,
      signer || provider
    );
  }

  // Issuer Management
  async registerIssuer(
    did: string,
    name: string,
    issuerType: IssuerType,
    description: string,
    website: string,
    accreditations: string[],
    signer: ethers.Signer
  ): Promise<boolean> {
    try {
      const contractWithSigner = this.contract.connect(signer) as any;
      
      const tx = await contractWithSigner.registerIssuer(
        did,
        name,
        this.issuerTypeToNumber(issuerType),
        description,
        website,
        accreditations
      );
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error registering issuer:', error);
      throw error;
    }
  }

  async authorizeIssuerForCategory(
    did: string,
    category: CredentialCategory,
    signer: ethers.Signer
  ): Promise<boolean> {
    try {
      const contractWithSigner = this.contract.connect(signer) as any;
      
      const tx = await contractWithSigner.authorizeIssuerForCategory(
        did,
        this.categoryToNumber(category)
      );
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error authorizing issuer:', error);
      throw error;
    }
  }

  // Credential Management
  async anchorCredential(
    hash: string,
    issuerDID: string,
    subjectDID: string,
    category: CredentialCategory,
    expirationDate: Date | null,
    signer: ethers.Signer
  ): Promise<boolean> {
    try {
      const contractWithSigner = this.contract.connect(signer) as any;
      
      const expirationTimestamp = expirationDate ? Math.floor(expirationDate.getTime() / 1000) : 0;
      
      const tx = await contractWithSigner.anchorCredential(
        hash,
        issuerDID,
        subjectDID,
        this.categoryToNumber(category),
        expirationTimestamp
      );
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error anchoring credential:', error);
      throw error;
    }
  }

  async revokeCredential(
    hash: string,
    reason: string,
    signer: ethers.Signer
  ): Promise<boolean> {
    try {
      const contractWithSigner = this.contract.connect(signer) as any;
      
      const tx = await contractWithSigner.revokeCredential(hash, reason);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error revoking credential:', error);
      throw error;
    }
  }

  // Verification
  async verifyCredential(hash: string) {
    try {
      const result = await this.contract.verifyCredential(hash);
      return {
        exists: result[0],
        issuerDID: result[1],
        subjectDID: result[2],
        category: this.numberToCategory(result[3]),
        issuanceDate: new Date(Number(result[4]) * 1000),
        expirationDate: result[5] > 0 ? new Date(Number(result[5]) * 1000) : null,
        isRevoked: result[6],
        revocationReason: result[7],
        version: Number(result[8]),
        issuerTrusted: result[9]
      };
    } catch (error) {
      console.error('Error verifying credential:', error);
      throw error;
    }
  }

  async getIssuerInfo(did: string): Promise<IssuerProfile | null> {
    try {
      const result = await this.contract.getIssuerInfo(did);
      return {
        did,
        name: result[0],
        type: this.numberToIssuerType(result[1]),
        description: result[2],
        trustScore: Number(result[3]),
        isActive: result[4],
        accreditations: result[5],
        registrationDate: '', // Not returned by contract view, would need event query
        website: '', // Not returned by minimal view, would need struct query
        logo: '' // Not stored on-chain
      };
    } catch (error) {
      console.error('Error getting issuer info:', error);
      return null;
    }
  }

  async isIssuerAuthorizedForCategory(
    did: string,
    category: CredentialCategory
  ): Promise<boolean> {
    try {
      return await this.contract.isIssuerAuthorizedForCategory(
        did,
        this.categoryToNumber(category)
      );
    } catch (error) {
      console.error('Error checking issuer authorization:', error);
      return false;
    }
  }

  async getAllIssuers(): Promise<string[]> {
    try {
      return await this.contract.getAllIssuers();
    } catch (error) {
      console.error('Error getting all issuers:', error);
      return [];
    }
  }

  // Helper methods
  private issuerTypeToNumber(type: IssuerType): number {
    const typeMap = {
      [IssuerType.UNIVERSITY]: 0,
      [IssuerType.SKILL_INSTITUTE]: 1,
      [IssuerType.EMPLOYER]: 2,
      [IssuerType.GIG_PLATFORM]: 3,
      [IssuerType.GOVERNMENT]: 4,
      [IssuerType.CERTIFICATION_BODY]: 5
    };
    return typeMap[type];
  }

  private numberToIssuerType(num: number): IssuerType {
    const typeMap = [
      IssuerType.UNIVERSITY,
      IssuerType.SKILL_INSTITUTE,
      IssuerType.EMPLOYER,
      IssuerType.GIG_PLATFORM,
      IssuerType.GOVERNMENT,
      IssuerType.CERTIFICATION_BODY
    ];
    return typeMap[num];
  }

  // --- UPDATED CATEGORY MAPPING ---
  private categoryToNumber(category: CredentialCategory): number {
    const categoryMap: Record<string, number> = {
      [CredentialCategory.ACADEMIC]: 0,
      [CredentialCategory.SKILL]: 1,
      [CredentialCategory.EMPLOYMENT]: 2,
      [CredentialCategory.PROFESSIONAL]: 3,
      [CredentialCategory.GIG_WORK]: 4, // Legacy
      [CredentialCategory.GOVERNMENT]: 5, // New
      [CredentialCategory.GIG]: 6         // New
    };
    return categoryMap[category] ?? 0;
  }

  private numberToCategory(num: number): CredentialCategory {
    const categoryMap = [
      CredentialCategory.ACADEMIC,
      CredentialCategory.SKILL,
      CredentialCategory.EMPLOYMENT,
      CredentialCategory.PROFESSIONAL,
      CredentialCategory.GIG_WORK,
      CredentialCategory.GOVERNMENT, // New
      CredentialCategory.GIG         // New
    ];
    // Default to academic if out of bounds
    return categoryMap[num] || CredentialCategory.ACADEMIC;
  }
}