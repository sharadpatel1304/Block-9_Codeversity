import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Award, Wallet, Upload, ArrowRight, X, Shield, ChevronRight } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useCertificates, getCertificateStatus } from '../context/CertificateContext';

const Dashboard: React.FC = () => {
  const { isConnected, isIssuer } = useWallet();
  const { issuedCertificates, receivedCertificates } = useCertificates();
  
  // State for the Welcome Guide
  const [showGuide, setShowGuide] = useState(true);
  
  // Reverted to the Clean/Elegant Card Style (No heavy orange background)
  const ActionCard = ({ to, icon: Icon, title, description }: { to: string, icon: any, title: string, description: string }) => (
    <Link
      to={to}
      className="group relative block bg-white p-8 border border-gray-200 hover:border-neutral-400 transition-all duration-300"
    >
      <div className="mb-8">
        <Icon className="w-10 h-10 text-primary group-hover:scale-105 transition-transform duration-300" strokeWidth={1} />
      </div>
      <h2 className="text-xl font-light text-neutral-900 mb-3 group-hover:text-primary transition-colors">
        {title}
      </h2>
      <p className="text-neutral-500 text-sm font-light leading-relaxed mb-8">
        {description}
      </p>
      
      <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
        <ArrowRight className="text-primary w-5 h-5" />
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Hero Section */}
        <div className="mb-20 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-light text-neutral-900 mb-8 tracking-tight">
            Digital Trust, <br/>
            <span className="text-primary">Simplified.</span>
          </h1>
          <p className="text-xl font-light text-neutral-500 leading-relaxed">
            OpenCred brings clarity to certification. Secure, tamper-proof, and built for the future of digital identity.
          </p>
        </div>
        
        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {isIssuer && (
            <ActionCard 
              to="/issue" 
              icon={Upload} 
              title="Issue Certificates" 
              description="Deploy blockchain-verified credentials directly to recipients."
            />
          )}
          
          <ActionCard 
            to="/verify" 
            icon={FileCheck} 
            title="Verify Authenticity" 
            description="Instantly validate any certificate using our decentralized ledger."
          />
          
          <ActionCard 
            to="/wallet" 
            icon={Wallet} 
            title="Digital Wallet" 
            description="Securely manage your professional achievements in one place."
          />
        </div>
        
        {/* Activity Feed */}
        {isConnected && (
          <div className="border-t border-gray-100 pt-16">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-3xl font-light text-neutral-900">Recent Activity</h2>
              <Link to="/wallet" className="text-sm font-medium text-primary hover:text-neutral-900 transition-colors flex items-center gap-1">
                View full history <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Issued Column */}
              {isIssuer && issuedCertificates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-6">Issued by you</h3>
                  <div className="space-y-0 divide-y divide-gray-100 border-t border-b border-gray-100">
                    {issuedCertificates.slice(0, 3).map(cert => (
                      <Link
                        key={cert.id}
                        to={`/certificate/${cert.id}`}
                        className="group flex items-center justify-between py-6 hover:bg-neutral-50 transition-colors px-4 -mx-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-50 rounded-sm group-hover:bg-white transition-colors">
                            <Award className="w-5 h-5 text-neutral-400 group-hover:text-primary" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{cert.name}</p>
                            <p className="text-xs text-neutral-500 mt-1">{cert.certificateType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                            getCertificateStatus(cert) === 'valid' ? 'bg-emerald-50 text-emerald-700' :
                            getCertificateStatus(cert) === 'expired' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {getCertificateStatus(cert)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Received Column */}
              {receivedCertificates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-6">Received</h3>
                  <div className="space-y-0 divide-y divide-gray-100 border-t border-b border-gray-100">
                    {receivedCertificates.slice(0, 3).map(cert => (
                      <Link
                        key={cert.id}
                        to={`/certificate/${cert.id}`}
                        className="group flex items-center justify-between py-6 hover:bg-neutral-50 transition-colors px-4 -mx-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-50 rounded-sm group-hover:bg-white transition-colors">
                            <Award className="w-5 h-5 text-neutral-400 group-hover:text-primary" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{cert.certificateType}</p>
                            <p className="text-xs text-neutral-500 mt-1">From: {cert.issuerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                            getCertificateStatus(cert) === 'valid' ? 'bg-emerald-50 text-emerald-700' :
                            getCertificateStatus(cert) === 'expired' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {getCertificateStatus(cert)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- CENTRAL WELCOME GUIDE (Dark with Orange Accents) --- */}
      {showGuide && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          
          <div className="w-full max-w-5xl bg-neutral-900 relative overflow-hidden shadow-2xl border border-neutral-800">
            
            {/* The "Orange Tint" Gradient Effect */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            {/* Close Button */}
            <button 
              onClick={() => setShowGuide(false)}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors p-2 z-50 cursor-pointer"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
            
            <div className="p-12 md:p-16 relative z-10">
              
              {/* Header */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 mb-6">
                  <Award className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  <span className="text-2xl font-light tracking-tight text-white">
                    Open<span className="font-normal text-primary">Cred</span>
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-light text-white mb-6">Welcome to the Dashboard</h2>
                <p className="text-neutral-400 max-w-lg mx-auto font-light leading-relaxed">
                  Your command center for decentralized identity. Select a module below to get started.
                </p>
              </div>

              {/* Modules Grid - Dark Cards with Orange Accents */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Wallet */}
                <div className="group border border-white/5 bg-white/5 p-8 transition-all hover:bg-neutral-800 hover:border-primary/50 relative overflow-hidden">
                  <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-6 text-primary border border-white/5 group-hover:border-primary/30 transition-colors">
                    <Wallet size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2 group-hover:text-primary transition-colors">My Wallet</h3>
                  <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-4">How it works</p>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-8 min-h-[60px]">
                    Connect your wallet to view all credentials issued to you. Download PDFs, share links, and track history.
                  </p>
                  <Link 
                    to="/wallet" 
                    className="flex items-center justify-between w-full py-3 px-4 bg-transparent border border-neutral-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-primary hover:border-primary transition-all group-hover:border-primary/50"
                  >
                    Open Wallet <ChevronRight size={16} />
                  </Link>
                </div>

                {/* Card 2: Verify */}
                <div className="group border border-white/5 bg-white/5 p-8 transition-all hover:bg-neutral-800 hover:border-primary/50 relative overflow-hidden">
                  <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-6 text-primary border border-white/5 group-hover:border-primary/30 transition-colors">
                    <Shield size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2 group-hover:text-primary transition-colors">Verification</h3>
                  <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-4">How it works</p>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-8 min-h-[60px]">
                    Have a Certificate ID? Paste it into the engine to retrieve its blockchain hash and confirm validity.
                  </p>
                  <Link 
                    to="/verify" 
                    className="flex items-center justify-between w-full py-3 px-4 bg-transparent border border-neutral-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-white hover:border-primary transition-all group-hover:border-primary/50"
                  >
                    Start Verifying <ChevronRight size={16} />
                  </Link>
                </div>

                {/* Card 3: Issue (Conditional) */}
                <div className={`group border border-white/5 bg-white/5 p-8 transition-all hover:bg-neutral-800 hover:border-primary/50 relative overflow-hidden ${!isIssuer ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-6 text-primary border border-white/5 group-hover:border-primary/30 transition-colors">
                    <Upload size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2 group-hover:text-primary transition-colors">Issuer Portal</h3>
                  <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-4">How it works</p>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-8 min-h-[60px]">
                    Authorized issuers can deploy credentials. Use the form for single entries or Excel for bulk issuance.
                  </p>
                  {isIssuer ? (
                    <Link 
                      to="/issue" 
                      className="flex items-center justify-between w-full py-3 px-4 bg-transparent border border-neutral-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-primary hover:border-primary transition-all group-hover:border-primary/50"
                    >
                      Issue Now <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center w-full py-3 px-4 border border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-600 cursor-not-allowed">
                      Restricted Access
                    </div>
                  )}
                </div>

              </div>
              
              <div className="mt-16 text-center">
                 <button 
                  onClick={() => setShowGuide(false)}
                  className="text-neutral-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors hover:underline underline-offset-4 decoration-primary"
                 >
                   Enter Dashboard
                 </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export default Dashboard;