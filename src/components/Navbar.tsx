import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Award, Globe, Check } from 'lucide-react'; 
import { useWallet } from '../context/WalletContext';
import { truncateAddress } from '../utils/helpers';
// Ensure this path matches your file structure
import { useLanguage, languages } from '../context/LanguageContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { walletAddress, isConnected, connectWallet, disconnectWallet, isIssuer } = useWallet();
  const { currentLanguage, setLanguage, t } = useLanguage();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close lang menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NavLink = ({ to, label }: { to: string, label: string }) => (
    <Link
      to={to}
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
              <Award className="w-7 h-7 text-primary" strokeWidth={1.5} />
              <span className="text-2xl font-light tracking-tight text-neutral-900 group-hover:text-primary transition-colors">
                Open<span className="font-normal">Cred</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/" label={t('dashboard')} />
            {isIssuer && <NavLink to="/issue" label={t('issue')} />}
            <NavLink to="/verify" label={t('verify')} />
            <NavLink to="/wallet" label={t('myCerts')} />
          </div>
          
          {/* Action Buttons & Language Selector */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* --- LANGUAGE SELECTOR START --- */}
            <div className="relative" ref={langMenuRef}>
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors px-3 py-2 rounded-sm hover:bg-neutral-50"
              >
                <Globe size={20} strokeWidth={1.5} />
                <span className="text-sm font-medium uppercase">{currentLanguage.code}</span>
              </button>

              {/* Language Table Dropdown */}
              {isLangMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-[480px] bg-white border border-gray-100 shadow-xl rounded-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
                    Select Language
                  </h3>
                  
                  {/* The Grid Table */}
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-md text-sm transition-all ${
                          currentLanguage.code === lang.code
                            ? 'bg-primary/5 text-primary font-medium ring-1 ring-primary/20'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="text-sm font-medium">{lang.native}</span>
                          <span className="text-xs text-neutral-400 font-light">{lang.name}</span>
                        </div>
                        {currentLanguage.code === lang.code && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* --- LANGUAGE SELECTOR END --- */}

            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            {isConnected ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-neutral-500 border border-gray-200 px-3 py-1 rounded-sm">
                  {truncateAddress(walletAddress)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="text-base text-neutral-500 hover:text-red-600 transition-colors"
                >
                  {t('disconnect')}
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-primary hover:bg-primary-hover text-white text-base font-medium px-6 py-2.5 transition-all duration-300 rounded-sm"
              >
                {t('connect')}
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
          <NavLink to="/" label={t('dashboard')} />
          {isIssuer && <NavLink to="/issue" label={t('issue')} />}
          <NavLink to="/verify" label={t('verify')} />
          <NavLink to="/wallet" label={t('myCerts')} />
          
          {/* Mobile Language Selector */}
          <div className="py-2 border-t border-b border-gray-100">
            <p className="text-xs text-neutral-400 uppercase mb-2">Language</p>
            <div className="grid grid-cols-4 gap-2">
               {languages.map((lang) => (
                  <button 
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`text-xs py-2 px-1 rounded border ${currentLanguage.code === lang.code ? 'bg-primary text-white border-primary' : 'bg-neutral-50 border-gray-100 text-neutral-600'}`}
                  >
                    {lang.code.toUpperCase()}
                  </button>
               ))}
            </div>
          </div>

          <div className="pt-2">
             {isConnected ? (
               <button onClick={disconnectWallet} className="w-full text-left text-base text-red-600 py-2">
                 {t('disconnect')} ({truncateAddress(walletAddress)})
               </button>
             ) : (
               <button onClick={connectWallet} className="w-full bg-primary text-white py-3 text-base font-medium">
                 {t('connect')}
               </button>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;