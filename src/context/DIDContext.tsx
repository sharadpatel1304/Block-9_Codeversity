import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { 
  DIDDocument, 
  VerifiableCredential, 
  CredentialCategory,
  IssuerType,
  IssuerProfile,
  SelectiveDisclosureRequest,
  DisclosedCredential
} from '../types/did';
import { DIDManager, VCManager, SelectiveDisclosureManager } from '../utils/did';
import { TrustRegistryManager } from '../utils/trustRegistry';
import { useWallet } from './WalletContext';
import toast from 'react-hot-toast';

interface DIDContextType {
  userDID: string | null;
  didDocument: DIDDocument | null;
  verifiableCredentials: VerifiableCredential[];
  issuedCredentials: VerifiableCredential[];
  receivedCredentials: VerifiableCredential[];
  registeredIssuers: IssuerProfile[];
  isLoading: boolean;
  error: string | null;
  
  // DID Management
  createDID: () => Promise<string>;
  resolveDID: (did: string) => Promise<DIDDocument | null>;
  
  // Credential Management
  issueCredential: (
    subjectDID: string,
    credentialData: any,
    category: CredentialCategory,
    expirationDate?: Date
  ) => Promise<VerifiableCredential>;
  
  verifyCredential: (credential: VerifiableCredential) => Promise<{
    isValid: boolean;
    onChainVerified: boolean;
    issuerTrusted: boolean;
    message: string;
  }>;
  
  revokeCredential: (credentialHash: string, reason: string) => Promise<boolean>;
  
  // Selective Disclosure
  createDisclosureRequest: (
    requiredAttributes: string[],
    optionalAttributes: string[],
    purpose: string
  ) => SelectiveDisclosureRequest;
  
  createDisclosedCredential: (
    credential: VerifiableCredential,
    request: SelectiveDisclosureRequest
  ) => Promise<DisclosedCredential>;
  
  // Trust Registry
  registerAsIssuer: (
    name: string,
    issuerType: IssuerType,
    description: string,
    website: string,
    accreditations: string[]
  ) => Promise<boolean>;
  
  getIssuerProfile: (did: string) => Promise<IssuerProfile | null>;
  getAllIssuers: () => Promise<IssuerProfile[]>;
}

const DIDContext = createContext<DIDContextType>({
  userDID: null,
  didDocument: null,
  verifiableCredentials: [],
  issuedCredentials: [],
  receivedCredentials: [],
  registeredIssuers: [],
  isLoading: false,
  error: null,
  createDID: async () => '',
  resolveDID: async () => null,
  issueCredential: async () => ({} as VerifiableCredential),
  verifyCredential: async () => ({ isValid: false, onChainVerified: false, issuerTrusted: false, message: '' }),
  revokeCredential: async () => false,
  createDisclosureRequest: () => ({} as SelectiveDisclosureRequest),
  createDisclosedCredential: async () => ({} as DisclosedCredential),
  registerAsIssuer: async () => false,
  getIssuerProfile: async () => null,
  getAllIssuers: async () => []
});

export const useDID = () => useContext(DIDContext);

interface DIDProviderProps {
  children: ReactNode;
}

export const DIDProvider: React.FC<DIDProviderProps> = ({ children }) => {
  const [userDID, setUserDID] = useState<string | null>(null);
  const [didDocument, setDidDocument] = useState<DIDDocument | null>(null);
  const [verifiableCredentials, setVerifiableCredentials] = useState<VerifiableCredential[]>([]);
  const [registeredIssuers, setRegisteredIssuers] = useState<IssuerProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { walletAddress, isConnected, signMessage } = useWallet();
  const [trustRegistry, setTrustRegistry] = useState<TrustRegistryManager | null>(null);

  // Initialize Trust Registry
  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setTrustRegistry(new TrustRegistryManager(provider));
    }
  }, []);

  // Create user DID when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress) {
      const did = DIDManager.generateDID(walletAddress);
      setUserDID(did);
      loadUserData(did);
    } else {
      setUserDID(null);
      setDidDocument(null);
      setVerifiableCredentials([]);
    }
  }, [isConnected, walletAddress]);

  // Load user data from local storage
  const loadUserData = async (did: string) => {
    try {
      // Load DID document
      const storedDidDoc = localStorage.getItem(`did-document-${did}`);
      if (storedDidDoc) {
        setDidDocument(JSON.parse(storedDidDoc));
      } else {
        // Create new DID document
        const newDidDoc = await DIDManager.createDIDDocument(walletAddress, '');
        setDidDocument(newDidDoc);
        localStorage.setItem(`did-document-${did}`, JSON.stringify(newDidDoc));
      }

      // Load credentials
      const storedCredentials = localStorage.getItem(`vc-credentials-${did}`);
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials).map((cred: any) => ({
          ...cred,
          issuanceDate: cred.issuanceDate,
          expirationDate: cred.expirationDate || undefined
        }));
        setVerifiableCredentials(credentials);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    }
  };

  // Save credentials to local storage
  useEffect(() => {
    if (userDID && verifiableCredentials.length > 0) {
      localStorage.setItem(`vc-credentials-${userDID}`, JSON.stringify(verifiableCredentials));
    }
  }, [userDID, verifiableCredentials]);

  // Filter credentials
  const issuedCredentials = verifiableCredentials.filter(cred => {
    const issuerDID = typeof cred.issuer === 'string' ? cred.issuer : cred.issuer.id;
    return issuerDID === userDID;
  });

  const receivedCredentials = verifiableCredentials.filter(cred => {
    return cred.credentialSubject.id === userDID;
  });

  // DID Management
  const createDID = async (): Promise<string> => {
    if (!isConnected || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    const did = DIDManager.generateDID(walletAddress);
    const didDoc = await DIDManager.createDIDDocument(walletAddress, '');
    
    setUserDID(did);
    setDidDocument(didDoc);
    localStorage.setItem(`did-document-${did}`, JSON.stringify(didDoc));
    
    return did;
  };

  const resolveDID = async (did: string): Promise<DIDDocument | null> => {
    try {
      return await DIDManager.resolveDID(did);
    } catch (error) {
      console.error('Error resolving DID:', error);
      return null;
    }
  };

  // Credential Management
  const issueCredential = async (
    subjectDID: string,
    credentialData: any,
    category: CredentialCategory,
    expirationDate?: Date
  ): Promise<VerifiableCredential> => {
    if (!isConnected || !userDID) {
      throw new Error('Wallet not connected or DID not created');
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create the verifiable credential
      const credential = await VCManager.createCredential(
        userDID,
        subjectDID,
        credentialData,
        category,
        signer
      );

      // Add expiration date if provided
      if (expirationDate) {
        credential.expirationDate = expirationDate.toISOString();
      }

      // Anchor credential hash on-chain
      if (trustRegistry) {
        const credentialHash = VCManager.generateCredentialHash(credential);
        await trustRegistry.anchorCredential(
          credentialHash,
          userDID,
          subjectDID,
          category,
          expirationDate,
          signer
        );
      }

      // Add to local storage
      setVerifiableCredentials(prev => [...prev, credential]);
      
      toast.success('Verifiable credential issued successfully!');
      return credential;
    } catch (err: any) {
      console.error('Error issuing credential:', err);
      setError(err.message || 'Failed to issue credential');
      toast.error(err.message || 'Failed to issue credential');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCredential = async (credential: VerifiableCredential) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verify credential signature
      const isValid = await VCManager.verifyCredential(credential);
      
      if (!isValid) {
        return {
          isValid: false,
          onChainVerified: false,
          issuerTrusted: false,
          message: 'Invalid credential signature'
        };
      }

      // Verify on-chain if trust registry is available
      let onChainVerified = false;
      let issuerTrusted = false;

      if (trustRegistry) {
        try {
          const credentialHash = VCManager.generateCredentialHash(credential);
          const onChainData = await trustRegistry.verifyCredential(credentialHash);
          
          onChainVerified = onChainData.exists && !onChainData.isRevoked;
          issuerTrusted = onChainData.issuerTrusted;

          if (onChainData.isRevoked) {
            return {
              isValid: false,
              onChainVerified: false,
              issuerTrusted,
              message: `Credential has been revoked: ${onChainData.revocationReason}`
            };
          }

          if (onChainData.expirationDate && onChainData.expirationDate < new Date()) {
            return {
              isValid: false,
              onChainVerified: true,
              issuerTrusted,
              message: 'Credential has expired'
            };
          }
        } catch (err) {
          console.error('Error verifying on-chain:', err);
        }
      }

      return {
        isValid: true,
        onChainVerified,
        issuerTrusted,
        message: onChainVerified 
          ? 'Credential is valid and verified on-chain' 
          : 'Credential signature is valid (off-chain verification only)'
      };
    } catch (err: any) {
      console.error('Error verifying credential:', err);
      setError(err.message || 'Failed to verify credential');
      return {
        isValid: false,
        onChainVerified: false,
        issuerTrusted: false,
        message: err.message || 'Verification failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const revokeCredential = async (credentialHash: string, reason: string): Promise<boolean> => {
    if (!isConnected || !trustRegistry) {
      throw new Error('Wallet not connected or trust registry not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      await trustRegistry.revokeCredential(credentialHash, reason, signer);
      
      toast.success('Credential revoked successfully');
      return true;
    } catch (err: any) {
      console.error('Error revoking credential:', err);
      setError(err.message || 'Failed to revoke credential');
      toast.error(err.message || 'Failed to revoke credential');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Selective Disclosure
  const createDisclosureRequest = (
    requiredAttributes: string[],
    optionalAttributes: string[] = [],
    purpose: string
  ): SelectiveDisclosureRequest => {
    if (!userDID) {
      throw new Error('User DID not available');
    }

    return SelectiveDisclosureManager.createDisclosureRequest(
      requiredAttributes,
      optionalAttributes,
      purpose,
      userDID
    );
  };

  const createDisclosedCredential = async (
    credential: VerifiableCredential,
    request: SelectiveDisclosureRequest
  ): Promise<DisclosedCredential> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return await SelectiveDisclosureManager.createDisclosedCredential(
      credential,
      request,
      signer
    );
  };

  // Trust Registry
  const registerAsIssuer = async (
    name: string,
    issuerType: IssuerType,
    description: string,
    website: string,
    accreditations: string[]
  ): Promise<boolean> => {
    if (!isConnected || !userDID || !trustRegistry) {
      throw new Error('Wallet not connected or trust registry not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      await trustRegistry.registerIssuer(
        userDID,
        name,
        issuerType,
        description,
        website,
        accreditations,
        signer
      );

      toast.success('Successfully registered as issuer');
      return true;
    } catch (err: any) {
      console.error('Error registering issuer:', err);
      setError(err.message || 'Failed to register as issuer');
      toast.error(err.message || 'Failed to register as issuer');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getIssuerProfile = async (did: string): Promise<IssuerProfile | null> => {
    if (!trustRegistry) return null;

    try {
      return await trustRegistry.getIssuerInfo(did);
    } catch (error) {
      console.error('Error getting issuer profile:', error);
      return null;
    }
  };

  const getAllIssuers = async (): Promise<IssuerProfile[]> => {
    if (!trustRegistry) return [];

    try {
      const issuerDIDs = await trustRegistry.getAllIssuers();
      const issuers: IssuerProfile[] = [];

      for (const did of issuerDIDs) {
        const profile = await trustRegistry.getIssuerInfo(did);
        if (profile) {
          issuers.push(profile);
        }
      }

      setRegisteredIssuers(issuers);
      return issuers;
    } catch (error) {
      console.error('Error getting all issuers:', error);
      return [];
    }
  };

  return (
    <DIDContext.Provider
      value={{
        userDID,
        didDocument,
        verifiableCredentials,
        issuedCredentials,
        receivedCredentials,
        registeredIssuers,
        isLoading,
        error,
        createDID,
        resolveDID,
        issueCredential,
        verifyCredential,
        revokeCredential,
        createDisclosureRequest,
        createDisclosedCredential,
        registerAsIssuer,
        getIssuerProfile,
        getAllIssuers
      }}
    >
      {children}
    </DIDContext.Provider>
  );
};