import React, { useState, useEffect, useLayoutEffect, useMemo} from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck, Award, Wallet, Upload, ArrowRight, X, 
  ChevronRight, HelpCircle, ChevronLeft 
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useCertificates, getCertificateStatus } from '../context/CertificateContext';

// --- Types for the Tour ---
type TourStep = {
  id: string; 
  title: string;
  description: string;
  position: 'bottom' | 'top' | 'left' | 'right' | 'center';
};

const Dashboard: React.FC = () => {
  const { isConnected, isIssuer } = useWallet();
  const { issuedCertificates, receivedCertificates } = useCertificates();
  
  // --- Tour State ---
  const [runTour, setRunTour] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // State for the "Spotlight" and "Tooltip" positions
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [isScrolling, setIsScrolling] = useState(false);

  // --- IMPROVED CONTENT: Detailed Feature Breakdown ---
  const steps = useMemo(() => {
    const tourSteps: TourStep[] = [
      {
        id: 'hero-section',
        title: 'The OpenCred Command Center',
        description: 'Welcome to your decentralized identity hub. This dashboard gives you a complete overview of your blockchain interactions. From here, you can navigate to issue, manage, or verify credentials with zero third-party reliance.',
        position: 'center'
      },
      {
        id: 'action-verify',
        title: 'Universal Verification Engine',
        description: 'Trust, but verify. Use this tool to validate any credential instantly. Simply paste a Certificate ID to query the live blockchain ledger. You will see the issuer signature, issuance date, and current validity status (Valid, Expired, or Revoked).',
        position: 'bottom'
      },
      {
        id: 'action-wallet',
        title: 'Your Credential Vault',
        description: 'This is the home for your professional identity. Access your wallet to view all certificates earned by you. Inside, you can download high-res PDFs, generate public share links for LinkedIn, and manage your decentralized profile.',
        position: 'bottom'
      }
    ];

    // Feature Explanation for Issuers
    if (isIssuer) {
      tourSteps.splice(1, 0, {
        id: 'action-issue',
        title: 'Issuer Portal & Bulk Minting',
        description: 'Authorized organizations use this portal to deploy credentials. You can issue single certificates via a simple form or use the Bulk Upload feature (Excel/CSV) to mint hundreds of credentials in one transaction. All actions are cryptographically signed.',
        position: 'bottom'
      });
    }

    // Feature Explanation for Activity Feed
    if (isConnected) {
      tourSteps.push({
        id: 'activity-feed',
        title: 'Real-Time Ledger Activity',
        description: 'Track your history at a glance. This feed updates automatically whenever you issue or receive a credential. It provides a quick status check—green for valid, amber for expired—and links directly to the detailed certificate view.',
        position: 'top'
      });
    }

    return tourSteps;
  }, [isIssuer, isConnected]);

  // --- Auto-Start Check ---
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('opencred_tour_completed');
    if (!hasSeenGuide) {
      const timer = setTimeout(() => setRunTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // --- The Positioning Engine (Robust Version) ---
  const updatePositions = () => {
    if (!runTour) return;
    
    const step = steps[currentStepIndex];
    if (!step) return;

    // Center Modal logic
    if (step.position === 'center') {
      setSpotlightStyle({
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 23, 23, 0.85)', // Dark backdrop
        zIndex: 50,
        transition: 'all 0.4s ease',
      });
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 51,
        opacity: 1,
        transition: 'all 0.3s ease',
      });
      return;
    }

    // Element Highlight logic
    const element = document.getElementById(step.id);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 12; // Increased breathing room slightly

      // 1. Set Spotlight Box (The transparent hole with giant shadow)
      setSpotlightStyle({
        position: 'fixed', 
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2),
        // This shadow creates the dark overlay everywhere EXCEPT the box
        boxShadow: '0 0 0 9999px rgba(23, 23, 23, 0.85)', 
        borderRadius: '8px',
        zIndex: 50,
        pointerEvents: 'none', 
        transition: 'all 0.4s ease-out',
      });

      // 2. Set Tooltip Box
      let top = 0;
      let left = 0;
      const tooltipW = 380; // Widened for better reading
      const tooltipH = 220; 

      if (step.position === 'bottom') {
        top = rect.bottom + 24;
        left = rect.left + (rect.width / 2) - (tooltipW / 2);
      } else if (step.position === 'top') {
        top = rect.top - tooltipH - 24;
        left = rect.left + (rect.width / 2) - (tooltipW / 2);
      }

      // Edge detection 
      if (left < 20) left = 20;
      if (left + tooltipW > window.innerWidth) left = window.innerWidth - tooltipW - 20;
      if (top < 20) top = 20;
      if (top + tooltipH > window.innerHeight) top = window.innerHeight - tooltipH - 20;

      setTooltipStyle({
        position: 'fixed',
        top: top,
        left: left,
        zIndex: 51,
        opacity: 1,
        transition: 'all 0.4s ease-out', 
      });
    }
  };

  // --- Step Change Effect ---
  useLayoutEffect(() => {
    if (!runTour) return;

    const step = steps[currentStepIndex];
    
    if (step.position !== 'center') {
      const element = document.getElementById(step.id);
      if (element) {
        setIsScrolling(true);
        // Smooth scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait for scroll to finish before locking position
        const timer = setTimeout(() => {
          setIsScrolling(false);
          updatePositions();
        }, 600); 
        return () => clearTimeout(timer);
      }
    } else {
      updatePositions();
    }
  }, [currentStepIndex, runTour, steps]);

  // --- Listen to Resize/Scroll ---
  useEffect(() => {
    if (!runTour) return;
    
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, { passive: true });
    
    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [currentStepIndex, runTour]);


  // --- Tour Actions ---
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleCloseTour();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleCloseTour = () => {
    setRunTour(false);
    localStorage.setItem('opencred_tour_completed', 'true');
    setTimeout(() => setCurrentStepIndex(0), 300);
  };

  const handleManualStart = () => {
    setRunTour(true);
    setCurrentStepIndex(0);
  };

  const ActionCard = ({ id, to, icon: Icon, title, description }: { id?: string, to: string, icon: any, title: string, description: string }) => (
    <Link
      id={id}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        
        {/* Guide Button */}
        <div className="absolute top-10 right-6 lg:right-8 z-10">
          <button 
            onClick={handleManualStart}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-neutral-600 text-sm hover:border-primary hover:text-primary transition-all duration-300 rounded-sm"
          >
            <HelpCircle size={16} />
            <span className="font-medium">Guide</span>
          </button>
        </div>

        {/* Hero Section */}
        <div id="hero-section" className="mb-20 max-w-3xl">
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
              id="action-issue"
              to="/issue" 
              icon={Upload} 
              title="Issue Certificates" 
              description="Deploy blockchain-verified credentials directly to recipients."
            />
          )}
          
          <ActionCard 
            id="action-verify"
            to="/verify" 
            icon={FileCheck} 
            title="Verify Authenticity" 
            description="Instantly validate any certificate using our decentralized ledger."
          />
          
          <ActionCard 
            id="action-wallet"
            to="/wallet" 
            icon={Wallet} 
            title="Digital Wallet" 
            description="Securely manage your professional achievements in one place."
          />
        </div>
        
        {/* Activity Feed */}
        {isConnected && (
          <div id="activity-feed" className="border-t border-gray-100 pt-16">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-3xl font-light text-neutral-900">Recent Activity</h2>
              <Link to="/wallet" className="text-sm font-medium text-primary hover:text-neutral-900 transition-colors flex items-center gap-1">
                View full history <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Issued */}
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
              
              {/* Received */}
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

      {/* --- TOUR OVERLAY ELEMENTS --- */}
      {runTour && (
        <>
          {/* 1. SPOTLIGHT BOX */}
          <div 
            style={spotlightStyle}
            className={`pointer-events-none ${isScrolling ? 'opacity-0' : 'opacity-100'}`}
          />

          {/* 2. TOOLTIP / GUIDE CONTENT */}
          <div 
            style={tooltipStyle}
            className={`w-[380px] outline-none ${isScrolling ? 'opacity-0' : 'opacity-100'}`}
          >
            <div className="bg-neutral-900 border border-neutral-700 shadow-2xl rounded-sm overflow-hidden animate-in zoom-in-95 duration-300">
              
              <div className="h-1 w-full bg-gradient-to-r from-primary to-orange-600"></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-2 text-primary">
                     <Award size={18} />
                     <span className="text-[10px] font-bold uppercase tracking-widest">
                       Guide {currentStepIndex + 1}/{steps.length}
                     </span>
                   </div>
                   <button onClick={handleCloseTour} className="text-neutral-500 hover:text-white transition-colors">
                     <X size={16} />
                   </button>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {steps[currentStepIndex]?.title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                  {steps[currentStepIndex]?.description}
                </p>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-neutral-800">
                  <button 
                    onClick={handleCloseTour}
                    className="text-xs text-neutral-500 hover:text-white transition-colors"
                  >
                    Skip
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {currentStepIndex > 0 && (
                      <button 
                        onClick={handlePrev}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-sm transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    )}
                    
                    <button 
                      onClick={handleNext}
                      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-sm"
                    >
                      {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'} 
                      {currentStepIndex !== steps.length - 1 && <ChevronRight size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;