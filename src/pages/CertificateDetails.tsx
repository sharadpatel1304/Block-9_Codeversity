import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Share2, ArrowLeft, Trash2, Copy, ExternalLink, ShieldCheck, Calendar, User, FileText } from 'lucide-react';
import { useCertificates } from '../context/CertificateContext';
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-2xl font-light text-neutral-900 mb-4">Certificate Not Found</h1>
        <button onClick={() => navigate(-1)} className="text-primary hover:underline">Return to Wallet</button>
      </div>
    );
  }
  
  const isIssuer = certificate.issuerAddress.toLowerCase() === walletAddress.toLowerCase();
  
  const handleDownload = async () => {
    if (!certificateRef.current) return;
    try {
      toast.loading('Generating PDF...', { duration: 2000 });
      await generateHighQualityPDF(certificateRef.current, certificate);
      toast.success('Downloaded successfully');
    } catch { toast.error('Download failed'); }
  };
  
  const handleShare = () => {
    const url = `${window.location.origin}/verify?id=${certificate.id}`;
    copyToClipboard(url); 
    toast.success('Verification link copied to clipboard');
  };
  
  const handleRevoke = async () => {
    if (!isIssuer) return;
    const reason = prompt('Reason for revocation:');
    if (!reason) return;
    if (await revokeCertificate(certificate.id, reason)) {
      toast.success('Certificate revoked');
    } else {
      toast.error('Revocation failed');
    }
  };

  // Helper for clean data rows
  const InfoBlock = ({ label, value, icon: Icon, copy = false }: any) => (
    <div className="group">
      <h4 className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
        {Icon && <Icon size={12} />} {label}
      </h4>
      <div className="flex items-center gap-2">
        <p className="text-lg font-light text-neutral-900 truncate">{value}</p>
        {copy && (
          <button 
            onClick={() => { copyToClipboard(value); toast.success('Copied'); }}
            className="text-neutral-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          >
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Top Navigation & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <button 
              onClick={() => navigate(-1)} 
              className="group flex items-center gap-2 text-neutral-400 hover:text-neutral-900 transition-colors mb-4 text-sm font-medium"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Wallet
            </button>
            <h1 className="text-4xl font-light text-neutral-900 tracking-tight">
              {certificate.certificateType}
            </h1>
          </div>

          <div className="flex gap-3">
             <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
              <Download size={16} /> <span className="hidden sm:inline">Download</span>
            </button>
            <button onClick={handleShare} className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
              <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
            </button>
             <a 
               href={`/verify?id=${certificate.id}`} 
               target="_blank" 
               rel="noreferrer" 
               className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-medium hover:bg-primary transition-colors"
             >
              <ShieldCheck size={16} /> Verify
            </a>
            {isIssuer && certificate.status === 'valid' && (
               <button onClick={handleRevoke} className="flex items-center gap-2 px-6 py-3 border border-red-100 text-red-600 bg-white text-sm font-medium hover:bg-red-50 transition-colors">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        
        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 border-t border-gray-100 pt-12">
          
          {/* LEFT: Large Certificate Preview */}
          <div className="lg:col-span-7">
             <div className="sticky top-8">
               <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-6">Document Preview</h3>
               <div className="border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8 flex justify-center bg-white" ref={certificateRef}>
                  <div className="transform origin-top scale-95">
                    <Certificate certificate={certificate} showDetails={true} />
                  </div>
               </div>
             </div>
          </div>
          
          {/* RIGHT: Detailed Metadata */}
          <div className="lg:col-span-5 space-y-12">
            
            {/* Essential Info */}
            <section>
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
                Credential Information
              </h3>
              <div className="grid grid-cols-1 gap-8">
                <InfoBlock label="Recipient Name" value={certificate.name} icon={User} />
                <InfoBlock label="Issuer Organization" value={certificate.issuerName} icon={FileText} />
                <div className="grid grid-cols-2 gap-4">
                  <InfoBlock label="Issue Date" value={new Date(certificate.issueDate).toLocaleDateString()} icon={Calendar} />
                  {certificate.expiryDate && (
                    <InfoBlock label="Expiry Date" value={new Date(certificate.expiryDate).toLocaleDateString()} icon={Calendar} />
                  )}
                </div>
                 <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Status</h4>
                    <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                        certificate.status === 'valid' ? 'border-emerald-600 text-emerald-700' :
                        certificate.status === 'expired' ? 'border-amber-600 text-amber-700' :
                        'border-red-600 text-red-700'
                      }`}>
                        {certificate.status}
                    </span>
                 </div>
              </div>
            </section>

            {/* Blockchain Proof */}
            <section>
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
                Blockchain Verification
              </h3>
              <div className="space-y-6">
                <InfoBlock label="Certificate ID (UUID)" value={certificate.id} copy />
                
                <div>
                   <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Transaction Hash</h4>
                   <div className="flex items-center gap-2 bg-white border border-gray-200 p-3">
                      <p className="text-xs font-mono text-neutral-600 truncate flex-1">{certificate.blockchainHash}</p>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${certificate.blockchainHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary hover:text-neutral-900"
                        title="View on Etherscan"
                      >
                        <ExternalLink size={14} />
                      </a>
                   </div>
                </div>

                <InfoBlock label="Issuer Wallet" value={truncateAddress(certificate.issuerAddress)} copy />
                <InfoBlock label="IPFS Reference" value={certificate.ipfsHash || "N/A"} copy />
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CertificateDetails;