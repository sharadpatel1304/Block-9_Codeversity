import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download, Share2, Trash2, Search, Filter, ChevronDown, Eye, X, Mail, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { useCertificates, getCertificateStatus } from '../context/CertificateContext';
import { useWallet } from '../context/WalletContext';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const CertificateWallet: React.FC = () => {
  const { issuedCertificates, receivedCertificates, revokeCertificate, isLoading } = useCertificates();
  const { isConnected, isIssuer } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'received' | 'issued'>(isIssuer ? 'issued' : 'received');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'expired' | 'revoked'>('all');
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [certificateToRevoke, setCertificateToRevoke] = useState<string | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; certificateId: string | null }>({
    isOpen: false,
    certificateId: null
  });
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  const certificates = activeTab === 'issued' ? issuedCertificates : receivedCertificates;
  
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.issuerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const handleRevoke = async () => {
      if (!certificateToRevoke || !revocationReason) return toast.error('Reason required');
      if (await revokeCertificate(certificateToRevoke, revocationReason)) {
          toast.success('Revoked'); setShowRevokeModal(false); setCertificateToRevoke(null);
      }
  };
  const handleShare = () => { toast.success(`Shared with ${recipientEmail}`); setShareModal({isOpen:false, certificateId:null}); };
  
  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 bg-white">
        <Award className="w-16 h-16 text-neutral-200 mb-6" strokeWidth={1} />
        <h1 className="text-3xl font-light text-neutral-900 mb-2">Wallet Locked</h1>
        <p className="text-neutral-500 font-light">Connect wallet to view assets.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-16">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <h1 className="text-5xl font-light text-neutral-900 tracking-tight mb-2">
              My Wallet
            </h1>
            <p className="text-lg font-light text-neutral-500">
              {filteredCertificates.length} credentials found
            </p>
          </div>
          
          {isIssuer && (
            <div className="flex border border-gray-200 p-1">
              <button
                className={`px-8 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'issued' 
                    ? 'bg-neutral-900 text-white' 
                    : 'bg-white text-neutral-500 hover:text-neutral-900'
                }`}
                onClick={() => setActiveTab('issued')}
              >
                Issued
              </button>
              <button
                className={`px-8 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'received' 
                    ? 'bg-neutral-900 text-white' 
                    : 'bg-white text-neutral-500 hover:text-neutral-900'
                }`}
                onClick={() => setActiveTab('received')}
              >
                Received
              </button>
            </div>
          )}
        </div>
        
        {/* Action Bar - Pure White */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-gray-200 mb-12">
          <div className="md:col-span-3 relative group border-b md:border-b-0 md:border-r border-gray-200">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="SEARCH CREDENTIALS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-none focus:ring-0 text-neutral-900 font-medium uppercase text-sm outline-none placeholder-neutral-400"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="w-full h-full flex items-center justify-between px-6 py-4 bg-white hover:bg-neutral-50 transition-colors text-neutral-900 font-medium uppercase text-sm"
            >
              <span>{statusFilter}</span>
              <ChevronDown size={18} />
            </button>
            
            {showStatusDropdown && (
              <div className="absolute top-full left-0 w-full bg-white border-x border-b border-gray-200 shadow-sm z-20">
                {['all', 'valid', 'expired', 'revoked'].map((status) => (
                  <button
                    key={status}
                    className="w-full text-left px-6 py-3 text-sm font-medium uppercase hover:bg-neutral-50 text-neutral-600 border-b border-gray-100 last:border-0"
                    onClick={() => { setStatusFilter(status as any); setShowStatusDropdown(false); }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCertificates.map(certificate => (
            <div 
              key={certificate.id}
              className="group bg-white border border-gray-200 hover:border-neutral-400 transition-all duration-300 flex flex-col justify-between min-h-[300px]"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                    certificate.status === 'valid' ? 'border-emerald-600 text-emerald-700 bg-white' :
                    certificate.status === 'expired' ? 'border-amber-600 text-amber-700 bg-white' :
                    'border-red-600 text-red-700 bg-white'
                  }`}>
                    {certificate.status}
                  </span>
                  <span className="text-xs font-medium text-neutral-400 font-mono">
                    {formatDate(certificate.issueDate)}
                  </span>
                </div>
                
                <h3 className="text-2xl font-light text-neutral-900 mb-2 leading-tight group-hover:text-primary transition-colors">
                  {certificate.certificateType}
                </h3>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                   <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                     {activeTab === 'issued' ? 'Issued To' : 'Issued By'}
                   </p>
                   <p className="text-lg font-normal text-neutral-900 truncate">
                     {activeTab === 'issued' ? certificate.name : certificate.issuerName}
                   </p>
                </div>
              </div>
              
              {/* Footer Actions - White Background */}
              <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center bg-white">
                <Link
                  to={`/certificate/${certificate.id}`}
                  className="text-xs font-bold text-neutral-900 hover:text-primary flex items-center gap-2 uppercase tracking-wide border-b border-transparent hover:border-primary pb-0.5 transition-all"
                >
                  View Details <Eye size={14} />
                </Link>
                
                <div className="flex gap-4">
                  <button onClick={() => toast.success('Downloaded')} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                    <Download size={18} strokeWidth={1.5} />
                  </button>
                  <button onClick={() => setShareModal({ isOpen: true, certificateId: certificate.id })} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                    <Share2 size={18} strokeWidth={1.5} />
                  </button>
                  {activeTab === 'issued' && getCertificateStatus(certificate) === 'valid' && (
                     <button onClick={() => { setCertificateToRevoke(certificate.id); setShowRevokeModal(true); }} className="text-neutral-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Modals remain mostly the same structure but ensure bg-white is used */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-white/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 shadow-xl p-10 max-w-lg w-full relative">
            <button onClick={() => setShowRevokeModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"><X size={20} strokeWidth={1}/></button>
            <h2 className="text-2xl font-light text-neutral-900 mb-2">Revoke Certificate</h2>
            <p className="text-sm text-neutral-500 mb-6 font-light">This action is permanent and cannot be undone.</p>
            <textarea
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              className="w-full bg-white border border-gray-200 p-3 text-sm focus:border-red-600 outline-none mb-6 font-light"
              placeholder="Reason for revocation..."
              rows={3}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowRevokeModal(false)} className="flex-1 py-3 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-neutral-700 transition-colors">Cancel</button>
              <button onClick={handleRevoke} className="flex-1 py-3 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">Revoke</button>
            </div>
          </div>
        </div>
      )}
      
      {shareModal.isOpen && (
         <div className="fixed inset-0 bg-white/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 shadow-xl p-10 max-w-lg w-full relative">
            <button onClick={() => setShareModal({ isOpen: false, certificateId: null })} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"><X size={20} strokeWidth={1}/></button>
            <h2 className="text-2xl font-light text-neutral-900 mb-6">Share Credential</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Email Address</label>
                <input 
                  type="email" 
                  value={recipientEmail} 
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full border-b border-gray-200 py-2 font-light text-lg focus:border-primary outline-none" 
                  placeholder="recipient@example.com"
                />
              </div>
              <button onClick={handleShare} disabled={!recipientEmail} className="w-full bg-neutral-900 text-white py-4 text-sm font-bold uppercase hover:bg-primary transition-colors mt-4">Send Link</button>
            </div>
          </div>
         </div>
      )}
    </div>
  );
};

export default CertificateWallet;