import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Award, Wallet, Shield, Upload} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useCertificates, getCertificateStatus } from '../context/CertificateContext';

const Dashboard: React.FC = () => {
  const { isConnected, isIssuer } = useWallet();
  const { issuedCertificates, receivedCertificates } = useCertificates();
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">OpenCred</h1>
        <p className="text-lg text-gray-600 mb-8">
          A secure, tamper-proof platform for issuing, managing, and verifying digital certificates using blockchain technology.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isIssuer && (
            <Link
              to="/issue"
              className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center"
            >
              <div className="bg-indigo-100 p-4 rounded-full mb-4">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Issue Certificates</h2>
              <p className="text-gray-600">Create and issue blockchain-verified certificates to recipients.</p>
            </Link>
          )}
          
          <Link
            to="/verify"
            className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center"
          >
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <FileCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verify Certificates</h2>
            <p className="text-gray-600">Verify the authenticity of certificates using blockchain technology.</p>
          </Link>
          
          <Link
            to="/wallet"
            className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center"
          >
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <Wallet className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Certificate Wallet</h2>
            <p className="text-gray-600">Access and manage your certificates in one secure location.</p>
          </Link>
        </div>
      </div>
      
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {isIssuer && issuedCertificates.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recently Issued</h2>
                <Link to="/wallet" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {issuedCertificates.slice(0, 3).map(cert => (
                  <Link
                    key={cert.id}
                    to={`/certificate/${cert.id}`}
                    className="block bg-gray-50 rounded-lg p-4 hover:bg-indigo-50 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Award className="w-10 h-10 text-indigo-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-800">{cert.name}</h3>
                          <p className="text-sm text-gray-500">{cert.certificateType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          getCertificateStatus(cert) === 'valid' ? 'bg-emerald-100 text-emerald-800' :
                          getCertificateStatus(cert) === 'expired' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getCertificateStatus(cert).charAt(0).toUpperCase() + getCertificateStatus(cert).slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{new Date(cert.issueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {receivedCertificates.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Your Certificates</h2>
                <Link to="/wallet" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {receivedCertificates.slice(0, 3).map(cert => (
                  <Link
                    key={cert.id}
                    to={`/certificate/${cert.id}`}
                    className="block bg-gray-50 rounded-lg p-4 hover:bg-indigo-50 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Award className="w-10 h-10 text-indigo-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-800">{cert.certificateType}</h3>
                          <p className="text-sm text-gray-500">From: {cert.issuerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          getCertificateStatus(cert) === 'valid' ? 'bg-emerald-100 text-emerald-800' :
                          getCertificateStatus(cert) === 'expired' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getCertificateStatus(cert).charAt(0).toUpperCase() + getCertificateStatus(cert).slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{new Date(cert.issueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Issue</h3>
            <p className="text-gray-600">Issuers create certificates and store cryptographic proofs on the blockchain.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Secure</h3>
            <p className="text-gray-600">Certificates are tamper-proof and cryptographically secured using blockchain technology.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <FileCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verify</h3>
            <p className="text-gray-600">Anyone can instantly verify the authenticity of certificates without intermediaries.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;