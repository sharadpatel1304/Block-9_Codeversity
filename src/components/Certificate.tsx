import React from 'react';
import { Award, Calendar, User, Building, GraduationCap, CheckCircle } from 'lucide-react';
import { Certificate as CertificateType, getCertificateStatus } from '../context/CertificateContext';
import { formatDate } from '../utils/helpers';
import QRCode from 'qrcode.react';

interface CertificateProps {
  certificate: CertificateType;
  showDetails?: boolean;
}

const Certificate: React.FC<CertificateProps> = ({ certificate, showDetails = false }) => {
  const {
    name,
    certificateType,
    issuerName,
    issueDate,
    expiryDate,
    metadata,
    id,
  } = certificate;
  
  const status = getCertificateStatus(certificate);

  // Generate verification URL
  const verificationUrl = `${window.location.origin}/verify?id=${id}`;

  // Choose background pattern based on certificate type
  const getBackgroundPattern = () => {
    const patterns = [
      'radial-gradient(circle at 10% 20%, rgba(216, 241, 230, 0.46) 0%, rgba(233, 226, 226, 0.28) 90.1%)',
      'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      'linear-gradient(to top, #accbee 0%, #e7f0fd 100%)',
      'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)',
      'linear-gradient(to top, #dfe9f3 0%, white 100%)'
    ];
    
    // Use a hash of the certificate type to choose a consistent pattern
    const hash = certificateType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return patterns[hash % patterns.length];
  };

  return (
    <div className="relative w-[800px] h-[600px] bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ background: getBackgroundPattern() }}
      />
      
      {/* Border */}
      <div className="absolute inset-[12px] border-[3px] border-indigo-100 rounded-lg z-0" />
      
      {/* Status Badge */}
      <div className="absolute top-6 right-6 z-20">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
          status === 'valid' ? 'bg-emerald-100 text-emerald-800' :
          status === 'expired' ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status.toUpperCase()}
        </span>
      </div>
      
      {/* Certificate Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full p-12">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Award className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">{certificateType}</h1>
          <p className="text-gray-500">This certifies that</p>
        </div>
        
        {/* Recipient Name */}
        <div className="text-center my-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {name}
          </h2>
          
          {showDetails && metadata.course && (
            <p className="text-gray-700 text-xl">
              has successfully completed the course
              <span className="block font-semibold mt-2">{metadata.course}</span>
            </p>
          )}
        </div>
        
        {/* Details */}
        <div className="w-full">
          {showDetails && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {metadata.organization && (
                <div className="flex items-center">
                  <Building className="w-5 h-5 text-indigo-500 mr-2" />
                  <span className="text-gray-700">{metadata.organization}</span>
                </div>
              )}
              
              {metadata.grade && (
                <div className="flex items-center">
                  <GraduationCap className="w-5 h-5 text-indigo-500 mr-2" />
                  <span className="text-gray-700">Grade: {metadata.grade}</span>
                </div>
              )}
              
              {metadata.achievements && metadata.achievements.length > 0 && (
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-indigo-500 mr-2" />
                  <span className="text-gray-700">{metadata.achievements[0]}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center mb-1">
                <Calendar className="w-4 h-4 text-indigo-500 mr-2" />
                <span className="text-sm text-gray-600">Issue Date: {formatDate(issueDate)}</span>
              </div>
              
              {expiryDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-indigo-500 mr-2" />
                  <span className="text-sm text-gray-600">Expiry Date: {formatDate(expiryDate)}</span>
                </div>
              )}
              
              <div className="flex items-center mt-3">
                <User className="w-4 h-4 text-indigo-500 mr-2" />
                <span className="text-sm text-gray-600">Issued by: {issuerName}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <QRCode 
                value={verificationUrl}
                size={80}
                level="H"
                renderAs="svg"
                includeMargin={true}
                className="border-2 border-indigo-100 rounded-md p-1"
              />
              <span className="text-xs text-gray-500 mt-1">Scan to verify</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;