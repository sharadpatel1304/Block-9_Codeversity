import { ethers } from 'ethers';

// ABI for the Certificate smart contract
const CERTIFICATE_ABI = [
  "function authorizeIssuer(address issuer) external",
  "function revokeIssuer(address issuer) external",
  "function issueCertificate(bytes32 id, string calldata ipfsHash) external",
  "function revokeCertificate(bytes32 id, string calldata reason) external",
  "function verifyCertificate(bytes32 id) external view returns (bool exists, address issuer, string memory ipfsHash, uint256 issuedAt, bool isRevoked, string memory revocationReason)",
  "function isIssuerAuthorized(address issuer) external view returns (bool)",
  "event CertificateIssued(bytes32 indexed id, address indexed issuer, string ipfsHash)",
  "event CertificateRevoked(bytes32 indexed id, string reason)",
  "event IssuerAuthorized(address indexed issuer)",
  "event IssuerRevoked(address indexed issuer)"
];

// Contract address - This will be set after deployment
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

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

export const issueCertificateOnChain = async (hash: string, ipfsHash: string, signer: ethers.Signer) => {
  try {
    const contract = await getContract(signer);
    const tx = await contract.issueCertificate(hash, ipfsHash);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error issuing certificate on chain:', error);
    throw error;
  }
};

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
      revocationReason: result[5]
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