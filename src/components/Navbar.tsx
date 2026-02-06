import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, FileCheck, Wallet, Home, LogOut, LogIn } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { truncateAddress } from '../utils/helpers';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { walletAddress, isConnected, connectWallet, disconnectWallet, isIssuer } = useWallet();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              OpenCred
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isActive('/') 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home size={18} />
              <span>Dashboard</span>
            </Link>
            
            {isIssuer && (
              <Link
                to="/issue"
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isActive('/issue') 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileCheck size={18} />
                <span>Issue</span>
              </Link>
            )}
            
            <Link
              to="/verify"
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isActive('/verify') 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileCheck size={18} />
              <span>Verify</span>
            </Link>
            
            <Link
              to="/wallet"
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isActive('/wallet') 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Wallet size={18} />
              <span>My Certificates</span>
            </Link>
          </div>
          
          <div>
            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 bg-gray-100 py-1 px-3 rounded-full">
                  {truncateAddress(walletAddress)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity duration-200 shadow-sm"
              >
                <LogIn size={18} />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-between mt-4 bg-gray-50 rounded-lg p-1">
          <Link
            to="/"
            className={`flex-1 flex flex-col items-center py-2 rounded-md ${
              isActive('/') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600'
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          {isIssuer && (
            <Link
              to="/issue"
              className={`flex-1 flex flex-col items-center py-2 rounded-md ${
                isActive('/issue') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600'
              }`}
            >
              <FileCheck size={20} />
              <span className="text-xs mt-1">Issue</span>
            </Link>
          )}
          
          <Link
            to="/verify"
            className={`flex-1 flex flex-col items-center py-2 rounded-md ${
              isActive('/verify') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600'
            }`}
          >
            <FileCheck size={20} />
            <span className="text-xs mt-1">Verify</span>
          </Link>
          
          <Link
            to="/wallet"
            className={`flex-1 flex flex-col items-center py-2 rounded-md ${
              isActive('/wallet') ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600'
            }`}
          >
            <Wallet size={20} />
            <span className="text-xs mt-1">Wallet</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;