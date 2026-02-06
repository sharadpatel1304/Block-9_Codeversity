import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Share2, ArrowLeft, Trash2, Copy, ExternalLink } from 'lucide-react';
import { useCertificates, getCertificateStatus as getStatus } from '../context/CertificateContext';
import { useWallet } from '../context/WalletContext';
import Certificate from '../components/Certificate';
import { generateHighQualityPDF, copyToClipboard, truncateAddress } from '../utils/helpers';
import toast from 'react-hot-toast';

const CertificateDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCertificateById, revokeCertificate } = useCertificates();
  const { walletAddress } = useWallet();
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const certificate = id ? getCertificateById(id) : undefined;
  
  if (!certificate) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Certificate Not Found</h1>
          <p className="text-gray-600 mb-6">
            The certificate you are looking for does not exist or has been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700"
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }
  
  const isIssuer = certificate.issuerAddress.toLowerCase() === walletAddress.toLowerCase();
  
  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    try {
      toast.loading('Generating high-quality certificate...', { duration: 3000 });
      await generateHighQualityPDF(certificateRef.current, certificate);
      toast.success('Certificate downloaded in high quality');
    } catch (error) {
      toast.error('Error downloading certificate');
    }
  };
  
  const handleShare = () => {
    const url = `${window.location.origin}/verify?id=${certificate.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Certificate for ${certificate.name}`,
        text: `View and verify my blockchain certificate: ${certificate.certificateType}`,
        url
      }).catch(() => {
        copyToClipboard(url);
        toast.success('Verification link copied to clipboard');
      });
    } else {
      copyToClipboard(url);
      toast.success('Verification link copied to clipboard');
    }
  };
  
  const handleRevoke = async () => {
    if (!isIssuer) {
      toast.error('Only the issuer can revoke this certificate');
      return;
    }
    
    const reason = prompt('Please provide a reason for revoking this certificate:');
    
    if (!reason) {
      toast.error('Revocation cancelled. A reason is required.');
      return;
    }
    
    try {
      const success = await revokeCertificate(certificate.id, reason);
      
      if (success) {
        toast.success('Certificate revoked successfully');
      } else {
        toast.error('Failed to revoke certificate');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke certificate');
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
            
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
            
            {isIssuer && getStatus(certificate) === 'valid' && (
              <button
                onClick={handleRevoke}
                className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100"
              >
                <Trash2 size={18} />
                <span>Revoke</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex justify-center mb-8" ref={certificateRef}>
          <Certificate certificate={certificate} showDetails={true} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Certificate Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Certificate Type</h3>
                <p className="text-gray-800">{certificate.certificateType}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Recipient</h3>
                <p className="text-gray-800">{certificate.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issuer</h3>
                <p className="text-gray-800">{certificate.issuerName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issue Date</h3>
                <p className="text-gray-800">{new Date(certificate.issueDate).toLocaleDateString()}</p>
              </div>
              
              {certificate.expiryDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Expiry Date</h3>
                  <p className="text-gray-800">{new Date(certificate.expiryDate).toLocaleDateString()}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  certificate.status === 'valid' ? 'bg-emerald-100 text-emerald-800' :
                  certificate.status === 'expired' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                </p>
              </div>
              
              {certificate.status === 'revoked' && certificate.revocationReason && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Revocation Reason</h3>
                  <p className="text-gray-800">{certificate.revocationReason}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Blockchain Verification</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Certificate ID</h3>
                <div className="flex items-center gap-2">
                  <p className="text-gray-800 font-mono text-sm truncate">{certificate.id}</p>
                  <button
                    onClick={() => {
                      copyToClipboard(certificate.id);
                      toast.success('Certificate ID copied to clipboard');
                    }}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Blockchain Hash</h3>
                <div className="flex items-center gap-2">
                  <p className="text-gray-800 font-mono text-sm truncate">{certificate.blockchainHash}</p>
                  <button
                    onClick={() => {
                      copyToClipboard(certificate.blockchainHash);
                      toast.success('Blockchain hash copied to clipboard');
                    }}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issuer Address</h3>
                <div className="flex items-center gap-2">
                  <p className="text-gray-800 font-mono text-sm">{truncateAddress(certificate.issuerAddress)}</p>
                  <button
                    onClick={() => {
                      copyToClipboard(certificate.issuerAddress);
                      toast.success('Issuer address copied to clipboard');
                    }}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">IPFS Hash</h3>
                <div className="flex items-center gap-2">
                  <p className="text-gray-800 font-mono text-sm truncate">{certificate.ipfsHash}</p>
                  <button
                    onClick={() => {
                      copyToClipboard(certificate.ipfsHash);
                      toast.success('IPFS hash copied to clipboard');
                    }}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Verification Link</h3>
                <div className="flex items-center gap-2">
                  <p className="text-gray-800 text-sm truncate">{`${window.location.origin}/verify?id=${certificate.id}`}</p>
                  <button
                    onClick={() => {
                      copyToClipboard(`${window.location.origin}/verify?id=${certificate.id}`);
                      toast.success('Verification link copied to clipboard');
                    }}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div className="pt-2">
                <a
                  href={`/verify?id=${certificate.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  <ExternalLink size={18} />
                  <span>Verify Certificate</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetails;