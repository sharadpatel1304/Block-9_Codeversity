import { ethers } from 'ethers';

// UPDATED ABI: Includes 'category' and 'expirationDate' to match your new features
const CERTIFICATE_ABI = [
  "function authorizeIssuer(address issuer) external",
  "function revokeIssuer(address issuer) external",
  // Updated issue function
  "function issueCertificate(bytes32 id, string calldata ipfsHash, string calldata category, uint256 expirationDate) external",
  "function revokeCertificate(bytes32 id, string calldata reason) external",
  // Updated verify function
  "function verifyCertificate(bytes32 id) external view returns (bool exists, address issuer, string memory ipfsHash, uint256 issuedAt, bool isRevoked, string memory revocationReason, string memory category, uint256 expirationDate)",
  "function isIssuerAuthorized(address issuer) external view returns (bool)",
  // Updated events
  "event CertificateIssued(bytes32 indexed id, address indexed issuer, string ipfsHash, string category)",
  "event CertificateRevoked(bytes32 indexed id, string reason)",
  "event IssuerAuthorized(address indexed issuer)",
  "event IssuerRevoked(address indexed issuer)"
];

// ⚠️ IMPORTANT: Replace with your NEW contract address after redeploying
const CONTRACT_ADDRESS = "YOUR_NEW_DEPLOYED_CONTRACT_ADDRESS";

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    return { account: accounts[0], signer };
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    throw error;
  }
};

export const getContract = async (signer: ethers.Signer) => {
  return new ethers.Contract(CONTRACT_ADDRESS, CERTIFICATE_ABI, signer);
};

// --- UPDATED: Accepts category and expiration ---
export const issueCertificateOnChain = async (
  hash: string, 
  ipfsHash: string, 
  category: string,
  expirationDate: Date | undefined,
  signer: ethers.Signer
) => {
  try {
    const contract = await getContract(signer);
    
    // Convert Date to Unix timestamp (seconds), or 0 if no expiration
    const expirationTimestamp = expirationDate ? Math.floor(expirationDate.getTime() / 1000) : 0;
    
    const tx = await contract.issueCertificate(hash, ipfsHash, category, expirationTimestamp);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error issuing certificate on chain:', error);
    throw error;
  }
};

// --- UPDATED: Returns new fields ---
export const verifyCertificateOnChain = async (hash: string, provider: ethers.Provider) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CERTIFICATE_ABI, provider);
    const result = await contract.verifyCertificate(hash);
    
    return {
      exists: result[0],
      issuer: result[1],
      ipfsHash: result[2],
      issuedAt: new Date(Number(result[3]) * 1000),
      isRevoked: result[4],
      revocationReason: result[5],
      // New fields mapped from result
      category: result[6],
      expirationDate: Number(result[7]) > 0 ? new Date(Number(result[7]) * 1000) : null
    };
  } catch (error) {
    console.error('Error verifying certificate on chain:', error);
    throw error;
  }
};

export const revokeCertificateOnChain = async (hash: string, reason: string, signer: ethers.Signer) => {
  try {
    const contract = await getContract(signer);
    const tx = await contract.revokeCertificate(hash, reason);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error revoking certificate on chain:', error);
    throw error;
  }
};

export const isIssuerAuthorized = async (address: string, provider: ethers.Provider) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CERTIFICATE_ABI, provider);
    return await contract.isIssuerAuthorized(address);
  } catch (error) {
    console.error('Error checking issuer authorization:', error);
    throw error;
  }
};

export const authorizeIssuer = async (issuerAddress: string, signer: ethers.Signer) => {
  try {
    const contract = await getContract(signer);
    const tx = await contract.authorizeIssuer(issuerAddress);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error authorizing issuer:', error);
    throw error;
  }
};

export const revokeIssuer = async (issuerAddress: string, signer: ethers.Signer) => {
  try {
    const contract = await getContract(signer);
    const tx = await contract.revokeIssuer(issuerAddress);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error revoking issuer:', error);
    throw error;
  }
};