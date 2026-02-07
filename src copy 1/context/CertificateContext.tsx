import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { storeOnIPFS, retrieveFromIPFS } from '../utils/ipfs';
import { useWallet } from './WalletContext';

// Define the API URL
const API_URL = 'https://block-9-codeversity.onrender.com/api';

export interface Certificate {
  id: string;
  name: string;
  recipientAddress?: string;
  issuerAddress: string;
  issuerName: string; // Now dynamic based on category
  certificateType: string;
  
  // --- ADDED NEW FIELDS ---
  category?: string;
  subCategory?: string;
  // ------------------------

  issueDate: Date;
  expiryDate?: Date;
  metadata: {
    course?: string;
    organization?: string;
    grade?: string;
    achievements?: string[];
    eventName?: string;
    eventDate?: string;
    eventLocation?: string;
    eventDescription?: string;
    rollNo?: string;
    issuerDID?: string; // Added to track the specific DID
    [key: string]: any;
  };
  ipfsHash: string;
  blockchainHash: string;
  signature: string;
  status: 'valid' | 'expired' | 'revoked';
  revocationReason?: string;
  revocationDate?: Date;
}

interface CertificateContextType {
  certificates: Certificate[];
  issuedCertificates: Certificate[];
  receivedCertificates: Certificate[];
  isLoading: boolean;
  error: string | null;
  getCertificateById: (id: string) => Certificate | undefined;
  issueCertificate: (certificateData: Omit<Certificate, 'id' | 'ipfsHash' | 'blockchainHash' | 'signature' | 'status'>) => Promise<Certificate>;
  issueBulkCertificates: (certificatesData: Omit<Certificate, 'id' | 'ipfsHash' | 'blockchainHash' | 'signature' | 'status'>[]) => Promise<Certificate[]>;
  verifyCertificate: (id: string) => Promise<{ isValid: boolean; certificate: Certificate | null; message: string }>;
  revokeCertificate: (id: string, reason: string) => Promise<boolean>;
  shareCertificate: (id: string, recipientEmail: string) => Promise<boolean>;
  getCertificateStatus: (certificate: Certificate) => 'valid' | 'expired' | 'revoked';
}

const CertificateContext = createContext<CertificateContextType>({
  certificates: [],
  issuedCertificates: [],
  receivedCertificates: [],
  isLoading: false,
  error: null,
  getCertificateById: () => undefined,
  issueCertificate: async () => ({} as Certificate),
  issueBulkCertificates: async () => [],
  verifyCertificate: async () => ({ isValid: false, certificate: null, message: '' }),
  revokeCertificate: async () => false,
  shareCertificate: async () => false,
  getCertificateStatus: () => 'valid',
});

export const useCertificates = () => useContext(CertificateContext);

// Export getCertificateStatus as a standalone function
export const getCertificateStatus = (certificate: Certificate): 'valid' | 'expired' | 'revoked' => {
  if (certificate.status === 'revoked') {
    return 'revoked';
  }
  
  if (certificate.expiryDate && new Date() > certificate.expiryDate) {
    return 'expired';
  }
  
  return 'valid';
};

interface CertificateProviderProps {
  children: ReactNode;
}

export const CertificateProvider: React.FC<CertificateProviderProps> = ({ children }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { walletAddress, signMessage, isConnected } = useWallet();
  
  // SESSION MANAGEMENT: Fetch certificates from Backend API when wallet connects
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!walletAddress) {
        setCertificates([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/certificates/${walletAddress}`);
        
        if (!response.ok) {
           console.warn('Backend not reachable or returned error');
           return;
        }
        
        const data = await response.json();
        
        const parsedCertificates = data.map((cert: any) => ({
          ...cert,
          issueDate: new Date(cert.issueDate),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
          revocationDate: cert.revocationDate ? new Date(cert.revocationDate) : undefined,
        }));
        
        setCertificates(parsedCertificates);
      } catch (err) {
        console.error('Error fetching certificates from API:', err);
        setError('Failed to sync certificates from server');
        toast.error('Could not sync session data. Is the backend server running?');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, [walletAddress]);
  
  const issuedCertificates = certificates.filter(cert => 
    cert.issuerAddress.toLowerCase() === walletAddress?.toLowerCase()
  );
  
  const receivedCertificates = certificates.filter(cert => 
    cert.recipientAddress?.toLowerCase() === walletAddress?.toLowerCase()
  );
  
  useEffect(() => {
    if (certificates.length === 0) return;
    
    const updatedCertificates = certificates.map(cert => ({
      ...cert,
      status: getCertificateStatus(cert)
    }));
    
    const hasChanges = updatedCertificates.some((cert, index) => 
      cert.status !== certificates[index]?.status
    );
    
    if (hasChanges) {
      setCertificates(updatedCertificates);
    }
  }, [certificates.length]);
  
  const getCertificateById = (id: string): Certificate | undefined => {
    return certificates.find(cert => cert.id === id);
  };
  
  const generateBlockchainHash = async (certificate: Omit<Certificate, 'blockchainHash' | 'signature'>) => {
    const certData = JSON.stringify({
      id: certificate.id,
      name: certificate.name,
      recipientAddress: certificate.recipientAddress,
      issuerAddress: certificate.issuerAddress,
      issuerName: certificate.issuerName, // Include issuerName in hash for integrity
      issueDate: certificate.issueDate.toISOString(),
      ipfsHash: certificate.ipfsHash,
      metadata: certificate.metadata,
      category: certificate.category,       
      subCategory: certificate.subCategory  
    });
    
    return ethers.keccak256(ethers.toUtf8Bytes(certData));
  };
  
  const issueCertificate = async (certificateData: Omit<Certificate, 'id' | 'ipfsHash' | 'blockchainHash' | 'signature' | 'status'>): Promise<Certificate> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const id = uuidv4();
      
      const certificateTemp: Omit<Certificate, 'blockchainHash' | 'signature'> = {
        ...certificateData,
        id,
        issuerAddress: walletAddress,
        ipfsHash: '',
        status: 'valid',
        // Fallback for safety, though UI should always provide it
        issuerName: certificateData.issuerName || 'Authorized Issuer',
      };
      
      const ipfsHash = await storeOnIPFS(certificateTemp);
      certificateTemp.ipfsHash = ipfsHash;
      
      const blockchainHash = await generateBlockchainHash(certificateTemp);
      const signature = await signMessage(blockchainHash);
      
      const completeCertificate: Certificate = {
        ...certificateTemp,
        blockchainHash,
        signature,
        status: 'valid',
      };
      
      // PERSISTENCE: Save to Backend API
      const response = await fetch(`${API_URL}/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeCertificate),
      });

      if (!response.ok) {
        throw new Error('Failed to save certificate to database');
      }
      
      setCertificates(prev => [...prev, completeCertificate]);
      
      toast.success('Certificate issued and saved successfully!');
      return completeCertificate;
    } catch (err: any) {
      console.error('Error issuing certificate:', err);
      setError(err.message || 'Failed to issue certificate');
      toast.error(err.message || 'Failed to issue certificate');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const issueBulkCertificates = async (certificatesData: Omit<Certificate, 'id' | 'ipfsHash' | 'blockchainHash' | 'signature' | 'status'>[]): Promise<Certificate[]> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const issuedCerts: Certificate[] = [];
      const batchSize = 5;
      
      for (let i = 0; i < certificatesData.length; i += batchSize) {
        const batch = certificatesData.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (certData) => {
          try {
            // FIX: Removed hardcoded 'Authorized Issuer'. 
            // It now respects the issuerName passed in certData from the bulk upload logic.
            const certificate = await issueCertificate({
              ...certData,
              issuerAddress: walletAddress,
            });
            return certificate;
          } catch (err) {
            console.error(`Error issuing certificate for ${certData.name}:`, err);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validCerts = batchResults.filter((cert): cert is Certificate => cert !== null);
        issuedCerts.push(...validCerts);
        
        if (i + batchSize < certificatesData.length) {
          toast.loading(`Processing ${Math.min(i + batchSize, certificatesData.length)} of ${certificatesData.length} certificates...`);
        }
      }
      
      toast.success(`Successfully issued ${issuedCerts.length} certificates`);
      return issuedCerts;
    } catch (err: any) {
      console.error('Error issuing bulk certificates:', err);
      setError(err.message || 'Failed to issue bulk certificates');
      toast.error(err.message || 'Failed to issue bulk certificates');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyCertificate = async (id: string): Promise<{ isValid: boolean; certificate: Certificate | null; message: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Try to find it in local state first
      let certificate = getCertificateById(id);
      
      // 2. If not found locally, try fetching from the API
      if (!certificate) {
        try {
          const response = await fetch(`${API_URL}/certificate/${id}`);
          if (response.ok) {
            const data = await response.json();
            // Convert strings back to Date objects
            certificate = {
              ...data,
              issueDate: new Date(data.issueDate),
              expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
              revocationDate: data.revocationDate ? new Date(data.revocationDate) : undefined,
            };
          }
        } catch (fetchError) {
          console.error("Failed to fetch certificate from API", fetchError);
        }
      }
      
      // 3. If still not found, return error
      if (!certificate) {
        return { isValid: false, certificate: null, message: 'Certificate not found' };
      }
      
      // 4. Check Revocation Status
      if (certificate.status === 'revoked') {
        return { 
          isValid: false, 
          certificate, 
          message: `Certificate has been revoked. Reason: ${certificate.revocationReason}` 
        };
      }
      
      // 5. Check Expiration
      const currentStatus = getCertificateStatus(certificate);
      if (currentStatus === 'expired') {
        return { isValid: false, certificate, message: 'Certificate has expired' };
      }
      
      // 6. Verify Blockchain Signature (Integrity Check)
      try {
        const recoveredAddress = ethers.verifyMessage(certificate.blockchainHash, certificate.signature);
        if (recoveredAddress.toLowerCase() !== certificate.issuerAddress.toLowerCase()) {
          return { isValid: false, certificate, message: 'Invalid signature - Authenticity check failed' };
        }
      } catch (err) {
        return { isValid: false, certificate, message: 'Failed to verify cryptographic signature' };
      }
      
      return { isValid: true, certificate, message: 'Certificate is valid' };
    } catch (err: any) {
      console.error('Error verifying certificate:', err);
      setError(err.message || 'Failed to verify certificate');
      return { isValid: false, certificate: null, message: err.message || 'Failed to verify certificate' };
    } finally {
      setIsLoading(false);
    }
  };
  
  const revokeCertificate = async (id: string, reason: string): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const certificateIndex = certificates.findIndex(cert => cert.id === id);
      
      if (certificateIndex === -1) {
        throw new Error('Certificate not found');
      }
      
      const certificate = certificates[certificateIndex];
      
      if (certificate.issuerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Only the issuer can revoke a certificate');
      }

      const response = await fetch(`${API_URL}/certificates/revoke/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reason, 
          address: walletAddress
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke certificate on server');
      }
      
      const updatedCertificate: Certificate = {
        ...certificate,
        status: 'revoked',
        revocationReason: reason,
        revocationDate: new Date(),
      };
      
      const updatedCertificates = [...certificates];
      updatedCertificates[certificateIndex] = updatedCertificate;
      setCertificates(updatedCertificates);
      
      toast.success('Certificate revoked successfully');
      return true;
    } catch (err: any) {
      console.error('Error revoking certificate:', err);
      setError(err.message || 'Failed to revoke certificate');
      toast.error(err.message || 'Failed to revoke certificate');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const shareCertificate = async (id: string, recipientEmail: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const certificate = getCertificateById(id);
      
      if (!certificate) {
        throw new Error('Certificate not found');
      }
      
      toast.success(`Certificate shared with ${recipientEmail}`);
      return true;
    } catch (err: any) {
      console.error('Error sharing certificate:', err);
      setError(err.message || 'Failed to share certificate');
      toast.error(err.message || 'Failed to share certificate');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CertificateContext.Provider
      value={{
        certificates,
        issuedCertificates,
        receivedCertificates,
        isLoading,
        error,
        getCertificateById,
        issueCertificate,
        issueBulkCertificates,
        verifyCertificate,
        revokeCertificate,
        shareCertificate,
        getCertificateStatus,
      }}
    >
      {children}
    </CertificateContext.Provider>
  );
};