import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, FileCheck, X, Shield, AlertTriangle, ExternalLink, ArrowRight, QrCode, CheckCircle } from 'lucide-react';
import { useCertificates } from '../context/CertificateContext';
import Certificate from '../components/Certificate';
import toast from 'react-hot-toast';

const VerifyCertificate: React.FC = () => {
  const [certificateId, setCertificateId] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    certificate: any;
    message: string;
    verified: boolean;
  }>({
    isValid: false,
    certificate: null,
    message: '',
    verified: false
  });
  
  const { verifyCertificate, isLoading } = useCertificates();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setCertificateId(id);
      handleVerify(id);
    }
  }, [location.search]);
  
  const handleVerify = async (id: string = certificateId) => {
    if (!id) {
      toast.error('Please enter a certificate ID');
      return;
    }
    try {
      const result = await verifyCertificate(id);
      setVerificationResult({ ...result, verified: true });
      navigate(`/verify?id=${id}`, { replace: true });
      
      if (result.isValid) toast.success('Verified successfully');
      else toast.error(result.message || 'Verification failed');
      
    } catch (error: any) {
      setVerificationResult({
        isValid: false,
        certificate: null,
        message: error.message || 'Verification failed',
        verified: true
      });
      toast.error(error.message);
    }
  };
  
  const resetVerification = () => {
    setVerificationResult({ isValid: false, certificate: null, message: '', verified: false });
    setCertificateId('');
    navigate('/verify', { replace: true });
  };
  
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col relative bg-white overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8f8f8_1px,transparent_1px),linear-gradient(to_bottom,#f8f8f8_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>

      {!verificationResult.verified ? (
        // --- HERO SEARCH STATE ---
        <div className="flex-1 flex flex-col items-center justify-start pt-24 px-4 relative z-10">
          
          <div className="max-w-3xl w-full mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full mb-8 border border-gray-100 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-neutral-400" strokeWidth={2} />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Immutable</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-semibold text-neutral-900 mb-6 tracking-tighter">
              Verify Authenticity.
            </h1>
            <p className="text-xl text-neutral-500 max-w-xl mx-auto font-light leading-relaxed">
              Instant, trustless verification. Enter a unique ID to validate the integrity of any OpenCred certificate.
            </p>
          </div>
          
          {/* SEARCH BOX */}
          <div className="max-w-2xl w-full mx-auto bg-white p-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
            <div className="relative flex items-center">
              <Search className="absolute left-5 text-neutral-300 w-6 h-6" strokeWidth={1.5} />
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Paste Certificate ID (e.g. d2cfe4d4...)"
                className="w-full pl-14 pr-36 py-4 bg-transparent border-none text-xl text-neutral-900 placeholder-neutral-300 focus:ring-0 font-light"
              />
              <button
                onClick={() => handleVerify()}
                disabled={isLoading || !certificateId}
                className="absolute right-1.5 bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg translate-y-0 active:translate-y-0.5"
              >
                {isLoading ? 'Scanning...' : 'Verify'}
              </button>
            </div>
          </div>
          
          {/* HOW IT WORKS - Redesigned to match screenshot */}
          <div className="max-w-6xl w-full mx-auto mt-32">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
               
               {/* Step 1 */}
               <div className="flex flex-col items-center group">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors duration-300">
                    <QrCode className="w-8 h-8 text-primary" strokeWidth={1.2} />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-3">Locate ID</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed max-w-[260px]">
                    Find the UUID at the bottom of your certificate or within the digital link.
                  </p>
               </div>

               {/* Step 2 */}
               <div className="flex flex-col items-center group">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors duration-300">
                    <Search className="w-8 h-8 text-primary" strokeWidth={1.2} />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-3">Input & Search</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed max-w-[260px]">
                    System queries the blockchain ledger instantly for a matching record.
                  </p>
               </div>

               {/* Step 3 */}
               <div className="flex flex-col items-center group">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors duration-300">
                    <FileCheck className="w-8 h-8 text-primary" strokeWidth={1.2} />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-3">Validate</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed max-w-[260px]">
                    View cryptographic proofs and issuer signatures to confirm integrity.
                  </p>
               </div>

             </div>
          </div>
        </div>
      ) : (
        // --- RESULT STATE (Unchanged) ---
        <div className="max-w-4xl mx-auto w-full px-4 py-16 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex justify-between items-end mb-8 border-b border-neutral-200 pb-6">
            <div>
              <button 
                onClick={resetVerification}
                className="text-neutral-400 hover:text-neutral-900 text-sm font-medium mb-4 flex items-center gap-2 transition-colors"
              >
                <ArrowRight className="rotate-180 w-4 h-4" /> Back to Search
              </button>
              <h2 className="text-3xl font-medium text-neutral-900">Verification Result</h2>
            </div>
            
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${
               verificationResult.isValid 
                 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                 : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {verificationResult.isValid ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span className="font-medium text-sm">
                {verificationResult.isValid ? 'Authentic Document' : 'Invalid Document'}
              </span>
            </div>
          </div>
          
          {verificationResult.certificate && (
            <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-100 bg-white">
                <div className="p-6">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Recipient</h4>
                  <p className="text-neutral-900 font-medium text-lg">{verificationResult.certificate.name}</p>
                </div>
                
                <div className="p-6">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Issue Date</h4>
                  <p className="text-neutral-900">
                    {new Date(verificationResult.certificate.issueDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="p-6">
                   <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Type</h4>
                   <p className="text-neutral-900 capitalize">
                      {verificationResult.certificate.subCategory || 'Standard'}
                    </p>
                </div>
                
                 <div className="p-6 bg-neutral-50 flex flex-col justify-center">
                   <a 
                      href={`https://sepolia.etherscan.io/tx/${verificationResult.certificate.blockchainHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-hover text-sm font-medium flex items-center gap-2 group"
                    >
                      View on Chain <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                    <span className="text-[10px] text-neutral-400 font-mono mt-1 break-all line-clamp-1">
                      {verificationResult.certificate.blockchainHash}
                    </span>
                </div>
              </div>

              <div className="border-t border-neutral-100 bg-neutral-50/50 p-8 flex justify-center">
                <div className="relative shadow-xl shadow-neutral-200/50 transform transition-transform hover:scale-[1.01] duration-300 bg-white">
                   <div className="origin-top scale-[0.6] md:scale-[0.75]">
                      <Certificate certificate={verificationResult.certificate} showDetails={true} />
                   </div>
                   <div className="h-[400px] md:h-[500px] w-[600px] md:w-[800px] hidden"></div> 
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyCertificate;