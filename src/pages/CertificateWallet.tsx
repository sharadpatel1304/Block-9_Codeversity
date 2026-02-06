import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download, Share2, Trash2, Search, Filter, ChevronDown, Eye, X } from 'lucide-react';
import { useCertificates, getCertificateStatus } from '../context/CertificateContext';
import { useWallet } from '../context/WalletContext';
import { formatDate, truncateAddress } from '../utils/helpers';
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
  
  // Filter certificates based on search term and status
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.issuerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const handleRevoke = async () => {
    if (!certificateToRevoke || !revocationReason) {
      toast.error('Please provide a reason for revocation');
      return;
    }
    
    try {
      const success = await revokeCertificate(certificateToRevoke, revocationReason);
      
      if (success) {
        toast.success('Certificate revoked successfully');
        setShowRevokeModal(false);
        setCertificateToRevoke(null);
        setRevocationReason('');
      } else {
        toast.error('Failed to revoke certificate');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke certificate');
    }
  };
  
  const handleShare = async () => {
    if (!shareModal.certificateId || !recipientEmail) {
      toast.error('Please enter a recipient email');
      return;
    }
    
    try {
      // In a real implementation, this would send an email with a link to the certificate
      // For demo purposes, we're just showing a success message
      toast.success(`Certificate shared with ${recipientEmail}`);
      setShareModal({ isOpen: false, certificateId: null });
      setRecipientEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to share certificate');
    }
  };
  
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <Award className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Certificate Wallet</h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view and manage your certificates.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Certificate Wallet</h1>
          
          {isIssuer && (
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'issued' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('issued')}
              >
                Issued
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'received' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('received')}
              >
                Received
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <Filter size={18} className="text-gray-500" />
              <span className="text-gray-700">
                Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </span>
              <ChevronDown size={18} className="text-gray-500" />
            </button>
            
            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-100">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700"
                    onClick={() => {
                      setStatusFilter('all');
                      setShowStatusDropdown(false);
                    }}
                  >
                    All
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700"
                    onClick={() => {
                      setStatusFilter('valid');
                      setShowStatusDropdown(false);
                    }}
                  >
                    Valid
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700"
                    onClick={() => {
                      setStatusFilter('expired');
                      setShowStatusDropdown(false);
                    }}
                  >
                    Expired
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700"
                    onClick={() => {
                      setStatusFilter('revoked');
                      setShowStatusDropdown(false);
                    }}
                  >
                    Revoked
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Certificates Found</h2>
            <p className="text-gray-500">
              {activeTab === 'issued' 
                ? "You haven't issued any certificates yet." 
                : "You haven't received any certificates yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map(certificate => (
              <div 
                key={certificate.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        certificate.status === 'valid' ? 'bg-emerald-100 text-emerald-800' :
                        certificate.status === 'expired' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(certificate.issueDate)}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{certificate.certificateType}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {activeTab === 'issued' ? `Recipient: ${certificate.name}` : `Issuer: ${certificate.issuerName}`}
                    </p>
                    {certificate.metadata.course && (
                      <p className="text-gray-500 text-sm">Course: {certificate.metadata.course}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 flex justify-between items-center">
                  <Link
                    to={`/certificate/${certificate.id}`}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </Link>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Handle download
                        toast.success('Certificate download started');
                      }}
                      className="text-gray-600 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100"
                    >
                      <Download size={16} />
                    </button>
                    
                    <button
                      onClick={() => setShareModal({ isOpen: true, certificateId: certificate.id })}
                      className="text-gray-600 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100"
                    >
                      <Share2 size={16} />
                    </button>
                    
                    {activeTab === 'issued' && getCertificateStatus(certificate) === 'valid' && (
                      <button
                        onClick={() => {
                          setCertificateToRevoke(certificate.id);
                          setShowRevokeModal(true);
                        }}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Revoke Certificate</h2>
                <button
                  onClick={() => {
                    setShowRevokeModal(false);
                    setCertificateToRevoke(null);
                    setRevocationReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                This action cannot be undone. The certificate will be marked as revoked on the blockchain.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Revocation
                </label>
                <textarea
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Please provide a reason for revoking this certificate"
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRevokeModal(false);
                    setCertificateToRevoke(null);
                    setRevocationReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={isLoading || !revocationReason}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Revoke Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Share Certificate</h2>
                <button
                  onClick={() => {
                    setShareModal({ isOpen: false, certificateId: null });
                    setRecipientEmail('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter recipient's email"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={`${window.location.origin}/verify?id=${shareModal.certificateId}`}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/verify?id=${shareModal.certificateId}`);
                      toast.success('Link copied to clipboard');
                    }}
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-r-lg text-gray-700 hover:bg-gray-200"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShareModal({ isOpen: false, certificateId: null });
                    setRecipientEmail('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={!recipientEmail}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Share Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateWallet;