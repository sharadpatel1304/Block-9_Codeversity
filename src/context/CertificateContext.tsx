import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { storeOnIPFS, retrieveFromIPFS } from '../utils/ipfs';
import { useWallet } from './WalletContext';

export interface Certificate {
  id: string;
  name: string;
  recipientAddress?: string;
  issuerAddress: string;
  issuerName: string;
  certificateType: string;
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
});

export const useCertificates = () => useContext(CertificateContext);

// Export getCertificateStatus as a standalone function
export const getCertificateStatus = (certificate: Certificate): 'valid' | 'expired' | 'revoked' => {
  // Check if certificate is revoked
  if (certificate.status === 'revoked') {
    return 'revoked';
  }
  
  // Check if certificate has expired
  if (certificate.expiryDate && new Date() > certificate.expiryDate) {
    return 'expired';
  }
  
  // Certificate is valid
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
  
  useEffect(() => {
    // Load certificates from local storage
    const loadCertificates = () => {
      try {
        const storedCertificates = localStorage.getItem('blockchain-certificates');
        if (storedCertificates) {
          const parsedCertificates = JSON.parse(storedCertificates).map((cert: any) => ({
            ...cert,
            issueDate: new Date(cert.issueDate),
            expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
            revocationDate: cert.revocationDate ? new Date(cert.revocationDate) : undefined,
          }));
          setCertificates(parsedCertificates);
        }
      } catch (err) {
        console.error('Error loading certificates:', err);
        setError('Failed to load certificates');
      }
    };
    
    loadCertificates();
  }, []);
  
  // Save certificates to local storage whenever they change
  useEffect(() => {
    if (certificates.length > 0) {
      localStorage.setItem('blockchain-certificates', JSON.stringify(certificates));
    }
  }, [certificates]);
  
  // Filter certificates based on wallet address
  const issuedCertificates = certificates.filter(cert => 
    cert.issuerAddress.toLowerCase() === walletAddress.toLowerCase()
  );
  
  const receivedCertificates = certificates.filter(cert => 
    cert.recipientAddress?.toLowerCase() === walletAddress.toLowerCase()
  );
  
  // Function to calculate certificate status
  const getCertificateStatus = (certificate: Certificate): 'valid' | 'expired' | 'revoked' => {
    // Check if certificate is revoked
    if (certificate.status === 'revoked') {
      return 'revoked';
    }
    
    // Check if certificate has expired
    if (certificate.expiryDate && new Date() > certificate.expiryDate) {
      return 'expired';
    }
    
    // Certificate is valid
    return 'valid';
  };
  
  // Update certificate statuses when certificates change
  useEffect(() => {
    if (certificates.length === 0) return;
    
    const updatedCertificates = certificates.map(cert => ({
      ...cert,
      status: getCertificateStatus(cert)
    }));
    
    // Only update if there are actual changes
    const hasChanges = updatedCertificates.some((cert, index) => 
      cert.status !== certificates[index]?.status
    );
    
    if (hasChanges) {
      setCertificates(updatedCertificates);
    }
  }
  )
  
  const getCertificateById = (id: string): Certificate | undefined => {
    return certificates.find(cert => cert.id === id);
  };
  
  const generateBlockchainHash = async (certificate: Omit<Certificate, 'blockchainHash' | 'signature'>) => {
    const certData = JSON.stringify({
      id: certificate.id,
      name: certificate.name,
      recipientAddress: certificate.recipientAddress,
      issuerAddress: certificate.issuerAddress,
      issueDate: certificate.issueDate.toISOString(),
      ipfsHash: certificate.ipfsHash,
      metadata: certificate.metadata,
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
      
      const certificate: Omit<Certificate, 'blockchainHash' | 'signature'> = {
        ...certificateData,
        id,
        issuerAddress: walletAddress,
        ipfsHash: '',
        status: 'valid',
      };
      
      const ipfsHash = await storeOnIPFS(certificate);
      certificate.ipfsHash = ipfsHash;
      
      const blockchainHash = await generateBlockchainHash(certificate);
      const signature = await signMessage(blockchainHash);
      
      const completeCertificate: Certificate = {
        ...certificate,
        blockchainHash,
        signature,
        status: 'valid', // Always start as valid
      };
      
      setCertificates(prev => [...prev, completeCertificate]);
      
      toast.success('Certificate issued successfully!');
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
      const batchSize = 5; // Process in smaller batches to avoid UI freezing
      
      for (let i = 0; i < certificatesData.length; i += batchSize) {
        const batch = certificatesData.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (certData) => {
          try {
            const certificate = await issueCertificate({
              ...certData,
              issuerAddress: walletAddress,
              issuerName: 'Authorized Issuer',
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
        
        // Update progress
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
      const certificate = getCertificateById(id);
      
      if (!certificate) {
        return { isValid: false, certificate: null, message: 'Certificate not found' };
      }
      
      if (certificate.status === 'revoked') {
        return { 
          isValid: false, 
          certificate, 
          message: `Certificate has been revoked. Reason: ${certificate.revocationReason}` 
        };
      }
      
      // Check expiry date properly
      const currentStatus = getCertificateStatus(certificate);
      if (currentStatus === 'expired') {
        return { isValid: false, certificate, message: 'Certificate has expired' };
      }
      
      try {
        const ipfsData = await retrieveFromIPFS(certificate.ipfsHash);
        if (!ipfsData) {
          return { isValid: false, certificate, message: 'Failed to retrieve certificate data from IPFS' };
        }
      } catch (err) {
        console.error('Error retrieving from IPFS:', err);
      }
      
      try {
        const recoveredAddress = ethers.verifyMessage(certificate.blockchainHash, certificate.signature);
        if (recoveredAddress.toLowerCase() !== certificate.issuerAddress.toLowerCase()) {
          return { isValid: false, certificate, message: 'Invalid signature' };
        }
      } catch (err) {
        return { isValid: false, certificate, message: 'Failed to verify signature' };
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