import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Award } from 'lucide-react'; 
import { useWallet } from '../context/WalletContext';
import { truncateAddress } from '../utils/helpers';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { walletAddress, isConnected, connectWallet, disconnectWallet, isIssuer } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  // Reusable Nav Link Component
  const NavLink = ({ to, label }: { to: string, label: string }) => (
    <Link
      to={to}
      // UPDATED: Changed 'text-sm' to 'text-base' for larger links
      className={`text-base tracking-wide transition-colors duration-200 ${
        isActive(to) 
          ? 'text-primary font-medium' 
          : 'text-neutral-500 hover:text-primary'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="flex items-center gap-3 group">
              {/* UPDATED: Icon size w-6/h-6 -> w-7/h-7 */}
              <Award className="w-7 h-7 text-primary" strokeWidth={1.5} />
              {/* UPDATED: Text size text-xl -> text-2xl */}
              <span className="text-2xl font-light tracking-tight text-neutral-900 group-hover:text-primary transition-colors">
                Open<span className="font-normal">Cred</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/" label="Dashboard" />
            {isIssuer && <NavLink to="/issue" label="Issue" />}
            <NavLink to="/verify" label="Verify" />
            <NavLink to="/wallet" label="My Certificates" />
          </div>
          
          {/* Action Button */}
          <div className="hidden md:flex items-center">
            {isConnected ? (
              <div className="flex items-center gap-4">
                {/* UPDATED: Address text text-xs -> text-sm */}
                <span className="text-sm font-mono text-neutral-500 border border-gray-200 px-3 py-1 rounded-sm">
                  {truncateAddress(walletAddress)}
                </span>
                {/* UPDATED: Disconnect text text-sm -> text-base */}
                <button
                  onClick={disconnectWallet}
                  className="text-base text-neutral-500 hover:text-red-600 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                // UPDATED: Button text text-sm -> text-base
                className="bg-primary hover:bg-primary-hover text-white text-base font-medium px-6 py-2.5 transition-all duration-300 rounded-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-900 hover:text-primary p-2"
            >
              {isMobileMenuOpen ? <X size={28} strokeWidth={1.5} /> : <Menu size={28} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 absolute w-full left-0 top-20 py-4 px-4 flex flex-col space-y-4 shadow-sm">
          <NavLink to="/" label="Dashboard" />
          {isIssuer && <NavLink to="/issue" label="Issue" />}
          <NavLink to="/verify" label="Verify" />
          <NavLink to="/wallet" label="Wallet" />
          <div className="pt-4 border-t border-gray-100">
             {isConnected ? (
               <button onClick={disconnectWallet} className="w-full text-left text-base text-red-600 py-2">
                 Disconnect ({truncateAddress(walletAddress)})
               </button>
             ) : (
               <button onClick={connectWallet} className="w-full bg-primary text-white py-3 text-base font-medium">
                 Connect Wallet
               </button>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;