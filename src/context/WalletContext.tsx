import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface WalletContextType {
  walletAddress: string;
  isConnected: boolean;
  isIssuer: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType>({
  walletAddress: '',
  isConnected: false,
  isIssuer: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  signMessage: async () => '',
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isIssuer, setIsIssuer] = useState<boolean>(false);
  
  // The authorized issuer addresses
  const AUTHORIZED_ISSUERS = [
    '0xB322B099a09b34f3551cB9A75B708E660bBA0CB2',
    '0xa01b0f3d9b10669dda4a2a597f42428d3f23ed90',
    '0x2ed1c8B78F6e3502243B081db5a4BcD4B6a6863F'
  ];

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            const address = accounts[0].address;
            setWalletAddress(address);
            setIsConnected(true);
            checkIssuerStatus(address);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(address);
          setIsConnected(true);
          checkIssuerStatus(address);
        } else {
          disconnectWallet();
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);
  
  const checkIssuerStatus = (address: string) => {
    // Check if the address matches any authorized issuer
    setIsIssuer(AUTHORIZED_ISSUERS.some(issuer => 
      issuer.toLowerCase() === address.toLowerCase()
    ));
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask to connect.');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setIsConnected(true);
        checkIssuerStatus(address);
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    setIsIssuer(false);
    toast.success('Wallet disconnected');
  };
  
  const signMessage = async (message: string): Promise<string> => {
    if (!window.ethereum || !isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw new Error('Failed to sign message');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnected,
        isIssuer,
        connectWallet,
        disconnectWallet,
        signMessage
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};