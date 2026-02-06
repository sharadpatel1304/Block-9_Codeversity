import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, FileCheck, X, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
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
  
  // Check for certificate ID in URL query params
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
      
      setVerificationResult({
        ...result,
        verified: true
      });
      
      // Update URL with certificate ID for sharing
      navigate(`/verify?id=${id}`, { replace: true });
      
      if (result.isValid) {
        toast.success('Certificate verified successfully!');
      } else {
        toast.error(result.message || 'Certificate verification failed');
      }
    } catch (error: any) {
      setVerificationResult({
        isValid: false,
        certificate: null,
        message: error.message || 'Verification failed',
        verified: true
      });
      toast.error(error.message || 'Verification failed');
    }
  };
  
  const resetVerification = () => {
    setVerificationResult({
      isValid: false,
      certificate: null,
      message: '',
      verified: false
    });
    setCertificateId('');
    navigate('/verify', { replace: true });
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Verify Certificate</h1>
        
        {!verificationResult.verified ? (
          // --- SEARCH STATE ---
          <div className="space-y-6">
            <p className="text-gray-600">
              Enter a certificate ID to verify its authenticity on the blockchain.
            </p>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Enter certificate ID (e.g., 12345678-1234...)"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={() => handleVerify()}
                disabled={isLoading || !certificateId}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search size={20} />
                <span>Verify</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Certificate ID should be in UUID format (e.g., d2cfe4d4-36c7...)</p>
            </div>
            
            <div className="text-center py-8">
              <div className="inline-block p-6 bg-indigo-50 rounded-full mb-4">
                <Shield className="w-16 h-16 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Blockchain Verification</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Our platform uses blockchain technology to ensure certificates are tamper-proof and can be verified by anyone, anytime.
              </p>
            </div>
          </div>
        ) : (
          // --- RESULT STATE ---
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Verification Result</h2>
              <button
                onClick={resetVerification}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X size={18} />
                <span>Reset</span>
              </button>
            </div>
            
            {/* Status Banner */}
            <div className={`p-6 rounded-lg ${
              verificationResult.isValid 
                ? 'bg-emerald-50 border border-emerald-100' 
                : 'bg-red-50 border border-red-100'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  verificationResult.isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  {verificationResult.isValid ? (
                    <FileCheck size={24} />
                  ) : (
                    <AlertTriangle size={24} />
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    verificationResult.isValid ? 'text-emerald-800' : 'text-red-800'
                  }`}>
                    {verificationResult.isValid ? 'Valid Certificate' : 'Invalid Certificate'}
                  </h3>
                  <p className={`text-sm ${
                    verificationResult.isValid ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {verificationResult.message}
                  </p>
                </div>
              </div>
            </div>
            
            {verificationResult.certificate && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Certificate Details</h3>
                
                {/* Visual Certificate Preview */}
                <div className="bg-white rounded-xl p-4 shadow-inner overflow-hidden border border-gray-200">
                  <div className="flex justify-center transform scale-[0.45] origin-top h-[300px]">
                    <Certificate certificate={verificationResult.certificate} showDetails={true} />
                  </div>
                </div>
                
                {/* Detailed Data Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-medium text-gray-500 text-sm uppercase mb-1">Recipient</h4>
                    <p className="text-gray-900 font-semibold">{verificationResult.certificate.name}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-medium text-gray-500 text-sm uppercase mb-1">Issuer</h4>
                    <p className="text-gray-900 font-semibold">{verificationResult.certificate.issuerName}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-medium text-gray-500 text-sm uppercase mb-1">Issue Date</h4>
                    <p className="text-gray-900">
                      {new Date(verificationResult.certificate.issueDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-medium text-gray-500 text-sm uppercase mb-1">Category</h4>
                    <p className="text-gray-900 capitalize">
                      {/* FIX: Check both naming conventions to ensure data display */}
                      {verificationResult.certificate.category || 
                       verificationResult.certificate.certificateCategory || 
                       'Standard'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-medium text-gray-500 text-sm uppercase mb-1">Sub-Category</h4>
                    <p className="text-gray-900 capitalize">
                      {/* FIX: Check both naming conventions */}
                      {verificationResult.certificate.subCategory || 
                       verificationResult.certificate.certificateSubCategory || 
                       verificationResult.certificate.certificateType || 
                       'General'}
                    </p>
                  </div>

                  {verificationResult.certificate.expiryDate && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h4 className="font-medium text-gray-500 text-sm uppercase mb-1">Expiry Date</h4>
                      <p className="text-gray-900">
                        {new Date(verificationResult.certificate.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 md:col-span-2">
                    <h4 className="font-medium text-gray-500 text-sm uppercase mb-1 flex items-center gap-2">
                      Blockchain Hash
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${verificationResult.certificate.blockchainHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800"
                        title="View on Etherscan"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </h4>
                    <p className="text-gray-600 font-mono text-xs break-all bg-white p-2 rounded border border-gray-200">
                      {verificationResult.certificate.blockchainHash || "Pending on-chain anchor..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;