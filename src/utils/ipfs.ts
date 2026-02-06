import { Web3Storage } from 'web3.storage';

// In a real application, you would store this in an environment variable
// For demo purposes, we're using a placeholder
const WEB3_STORAGE_TOKEN = 'your-web3-storage-token';

// Initialize Web3.Storage client
const getClient = () => {
  if (!WEB3_STORAGE_TOKEN || WEB3_STORAGE_TOKEN === 'your-web3-storage-token') {
    console.warn('Web3Storage token not configured. Using mock IPFS functionality.');
    return null;
  }
  return new Web3Storage({ token: WEB3_STORAGE_TOKEN });
};

// Store data on IPFS
export const storeOnIPFS = async (data: any): Promise<string> => {
  const client = getClient();
  
  if (!client) {
    // Mock IPFS functionality for demo purposes
    return `ipfs-mock-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  try {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    
    // Create a blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a file from the blob
    const file = new File([blob], `certificate-${data.id}.json`, { type: 'application/json' });
    
    // Upload to Web3.Storage
    const cid = await client.put([file], { wrapWithDirectory: false });
    
    return cid;
  } catch (error) {
    console.error('Error storing data on IPFS:', error);
    throw new Error('Failed to store data on IPFS');
  }
};

// Retrieve data from IPFS
export const retrieveFromIPFS = async (cid: string): Promise<any> => {
  const client = getClient();
  
  if (!client) {
    // Mock IPFS functionality for demo purposes
    if (cid.startsWith('ipfs-mock-')) {
      return { mockData: true, retrievedAt: new Date().toISOString() };
    }
    throw new Error('Invalid IPFS CID');
  }
  
  try {
    // Retrieve the file from Web3.Storage
    const res = await client.get(cid);
    
    if (!res || !res.ok) {
      throw new Error('Failed to retrieve data from IPFS');
    }
    
    // Get all files in the directory
    const files = await res.files();
    
    if (files.length === 0) {
      throw new Error('No files found in IPFS response');
    }
    
    // Get the first file (should be our JSON file)
    const file = files[0];
    
    // Read the file content
    const content = await file.text();
    
    // Parse the JSON content
    return JSON.parse(content);
  } catch (error) {
    console.error('Error retrieving data from IPFS:', error);
    throw new Error('Failed to retrieve data from IPFS');
  }
};