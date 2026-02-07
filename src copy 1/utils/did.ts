import { ethers } from 'ethers';
import { 
  DIDDocument, 
  VerifiableCredential, 
  VerifiablePresentation,
  CredentialCategory,
  IssuerType,
  SelectiveDisclosureRequest,
  DisclosedCredential
} from '../types/did';

// DID Method Implementation
export class DIDManager {
  private static readonly DID_METHOD = 'did:ethr';
  private static readonly CONTEXT_V1 = 'https://www.w3.org/ns/did/v1';
  private static readonly CONTEXT_ETHR = 'https://w3id.org/did/v1';

  static generateDID(address: string, chainId: number = 1): string {
    return `${this.DID_METHOD}:${chainId}:${address.toLowerCase()}`;
  }

  static async createDIDDocument(
    address: string, 
    publicKey: string,
    chainId: number = 1
  ): Promise<DIDDocument> {
    const did = this.generateDID(address, chainId);
    const verificationMethodId = `${did}#controller`;

    return {
      '@context': [this.CONTEXT_V1, this.CONTEXT_ETHR],
      id: did,
      controller: did,
      verificationMethod: [{
        id: verificationMethodId,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did,
        blockchainAccountId: `eip155:${chainId}:${address}`
      }],
      authentication: [verificationMethodId],
      assertionMethod: [verificationMethodId],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
  }

  static resolveDID(did: string): Promise<DIDDocument> {
    // In a real implementation, this would resolve from a DID registry
    // For now, we'll create a mock resolution
    const address = did.split(':')[3];
    return this.createDIDDocument(address, '');
  }

  static validateDID(did: string): boolean {
    const didRegex = /^did:ethr:(0x[a-fA-F0-9]{40}|[1-9]\d*:0x[a-fA-F0-9]{40})$/;
    return didRegex.test(did);
  }
}

// Verifiable Credential Manager
export class VCManager {
  private static readonly VC_CONTEXT = 'https://www.w3.org/2018/credentials/v1';
  private static readonly SCHEMA_BASE = 'https://schema.org/';

  static async createCredential(
    issuerDID: string,
    subjectDID: string,
    credentialData: any,
    category: CredentialCategory,
    signer: ethers.Signer
  ): Promise<VerifiableCredential> {
    const credentialId = `urn:uuid:${crypto.randomUUID()}`;
    const issuanceDate = new Date().toISOString();

    const credential: Omit<VerifiableCredential, 'proof'> = {
      '@context': [
        this.VC_CONTEXT,
        `${this.SCHEMA_BASE}${category}`
      ],
      id: credentialId,
      type: ['VerifiableCredential', this.getCredentialType(category)],
      issuer: issuerDID,
      issuanceDate,
      credentialSubject: {
        id: subjectDID,
        ...credentialData
      },
      credentialSchema: [{
        id: `${this.SCHEMA_BASE}${category}`,
        type: 'JsonSchemaValidator2018'
      }]
    };

    // Create proof
    const proof = await this.createProof(credential, signer);
    
    return {
      ...credential,
      proof
    };
  }

  private static getCredentialType(category: CredentialCategory): string {
    const typeMap: Record<string, string> = {
      [CredentialCategory.ACADEMIC]: 'AcademicCredential',
      [CredentialCategory.SKILL]: 'SkillCredential',
      [CredentialCategory.EMPLOYMENT]: 'EmploymentCredential',
      [CredentialCategory.GOVERNMENT]: 'GovernmentCredential', // Updated
      [CredentialCategory.GIG]: 'GigCredential'               // Updated
    };
    // Default to generic if not found, though types should prevent this
    return typeMap[category] || 'VerifiableCredential';
  }

  private static async createProof(
    credential: Omit<VerifiableCredential, 'proof'>,
    signer: ethers.Signer
  ) {
    const credentialHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(credential))
    );
    
    const signature = await signer.signMessage(ethers.getBytes(credentialHash));
    const signerAddress = await signer.getAddress();
    const issuerDID = DIDManager.generateDID(signerAddress);

    return {
      type: 'EcdsaSecp256k1Signature2019',
      created: new Date().toISOString(),
      verificationMethod: `${issuerDID}#controller`,
      proofPurpose: 'assertionMethod',
      jws: signature
    };
  }

  static async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    try {
      // Extract credential without proof for verification
      const { proof, ...credentialWithoutProof } = credential;
      
      // Recreate the hash
      const credentialHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(credentialWithoutProof))
      );

      // Recover signer address from signature
      const recoveredAddress = ethers.verifyMessage(
        ethers.getBytes(credentialHash), 
        proof.jws!
      );

      // Verify issuer DID matches recovered address
      const issuerDID = typeof credential.issuer === 'string' 
        ? credential.issuer 
        : credential.issuer.id;
      
      const expectedDID = DIDManager.generateDID(recoveredAddress);
      
      return issuerDID === expectedDID;
    } catch (error) {
      console.error('Credential verification failed:', error);
      return false;
    }
  }

  static generateCredentialHash(credential: VerifiableCredential): string {
    const { proof, ...credentialWithoutProof } = credential;
    return ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(credentialWithoutProof))
    );
  }
}

// Selective Disclosure Manager
export class SelectiveDisclosureManager {
  static createDisclosureRequest(
    requiredAttributes: string[],
    optionalAttributes: string[] = [],
    purpose: string,
    verifierDID: string
  ): SelectiveDisclosureRequest {
    return {
      requiredAttributes,
      optionalAttributes,
      purpose,
      verifier: verifierDID
    };
  }

  static async createDisclosedCredential(
    credential: VerifiableCredential,
    disclosureRequest: SelectiveDisclosureRequest,
    holderSigner: ethers.Signer
  ): Promise<DisclosedCredential> {
    const { credentialSubject } = credential;
    const disclosedAttributes: { [key: string]: any } = {};

    // Include required attributes
    for (const attr of disclosureRequest.requiredAttributes) {
      if (credentialSubject[attr] !== undefined) {
        disclosedAttributes[attr] = credentialSubject[attr];
      }
    }

    // Include optional attributes (holder's choice)
    for (const attr of disclosureRequest.optionalAttributes) {
      if (credentialSubject[attr] !== undefined) {
        disclosedAttributes[attr] = credentialSubject[attr];
      }
    }

    // Create proof of selective disclosure
    const disclosureHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify({
        credentialId: credential.id,
        disclosedAttributes,
        verifier: disclosureRequest.verifier,
        purpose: disclosureRequest.purpose
      }))
    );

    const signature = await holderSigner.signMessage(ethers.getBytes(disclosureHash));
    const holderAddress = await holderSigner.getAddress();
    const holderDID = DIDManager.generateDID(holderAddress);

    return {
      credentialId: credential.id,
      disclosedAttributes,
      proof: {
        type: 'EcdsaSecp256k1Signature2019',
        created: new Date().toISOString(),
        verificationMethod: `${holderDID}#controller`,
        proofPurpose: 'authentication',
        jws: signature
      }
    };
  }

  static async verifyDisclosedCredential(
    disclosedCredential: DisclosedCredential,
    originalCredential: VerifiableCredential,
    verifierDID: string,
    purpose: string
  ): Promise<boolean> {
    try {
      // Verify the disclosed attributes are subset of original credential
      const { credentialSubject } = originalCredential;
      
      for (const [key, value] of Object.entries(disclosedCredential.disclosedAttributes)) {
        if (credentialSubject[key] !== value) {
          return false;
        }
      }

      // Verify the disclosure proof
      const disclosureHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify({
          credentialId: disclosedCredential.credentialId,
          disclosedAttributes: disclosedCredential.disclosedAttributes,
          verifier: verifierDID,
          purpose
        }))
      );

      const recoveredAddress = ethers.verifyMessage(
        ethers.getBytes(disclosureHash),
        disclosedCredential.proof.jws!
      );

      const expectedHolderDID = DIDManager.generateDID(recoveredAddress);
      const actualHolderDID = typeof originalCredential.credentialSubject.id === 'string'
        ? originalCredential.credentialSubject.id
        : '';

      return expectedHolderDID === actualHolderDID;
    } catch (error) {
      console.error('Disclosed credential verification failed:', error);
      return false;
    }
  }
}

// QR Code and Lightweight Sharing
export class CredentialSharingManager {
  static generateQRData(credential: VerifiableCredential): string {
    const compactData = {
      id: credential.id,
      type: credential.type,
      issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
      subject: credential.credentialSubject.id,
      hash: VCManager.generateCredentialHash(credential),
      verifyUrl: `${window.location.origin}/verify-vc?id=${credential.id}`
    };

    return JSON.stringify(compactData);
  }

  static parseQRData(qrData: string) {
    try {
      return JSON.parse(qrData);
    } catch (error) {
      throw new Error('Invalid QR code data');
    }
  }

  static generateLightweightProof(credential: VerifiableCredential): {
    hash: string;
    issuer: string;
    subject: string;
    issuanceDate: string;
    type: string[];
  } {
    return {
      hash: VCManager.generateCredentialHash(credential),
      issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
      subject: credential.credentialSubject.id,
      issuanceDate: credential.issuanceDate,
      type: credential.type
    };
  }
}