import React from 'react';
import { 
  Award, 
  Calendar, 
  User, 
  Building, 
  GraduationCap, 
  CheckCircle, 
  Briefcase, 
  Globe, 
  Scale, 
  Shield, 
  Hash, 
  Clock 
} from 'lucide-react';
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
    category = 'default',
    subCategory,
    issuerName,
    issueDate,
    expiryDate,
    metadata,
    id,
  } = certificate;
  
  const status = getCertificateStatus(certificate);
  const verificationUrl = `${window.location.origin}/verify?id=${id}`;

  const isLicenseMode = 
    category === 'government' || 
    category === 'professional' || 
    certificateType.toLowerCase().includes('license');

  const getConfig = () => {
    switch (category) {
      case 'academic':
        return {
          icon: <GraduationCap className={isLicenseMode ? "w-8 h-8" : "w-12 h-12"} />,
          color: 'text-indigo-600',
          gradient: 'from-indigo-600 to-blue-600',
          bg: 'radial-gradient(circle at 10% 20%, rgba(216, 241, 230, 0.46) 0%, rgba(233, 226, 226, 0.28) 90.1%)',
          labels: { main: 'Course / Degree', org: 'Institution', grade: 'Grade / GPA', ref: 'Student ID', context: 'has successfully completed' }
        };
      case 'skill':
        return {
          icon: <Award className={isLicenseMode ? "w-8 h-8" : "w-12 h-12"} />,
          color: 'text-purple-600',
          gradient: 'from-purple-600 to-pink-600',
          bg: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)',
          labels: { main: 'Skill Certification', org: 'Certifying Body', grade: 'Score', ref: 'Certificate ID', context: 'has demonstrated proficiency in' }
        };
      case 'employment':
        return {
          icon: <Briefcase className={isLicenseMode ? "w-8 h-8" : "w-12 h-12"} />,
          color: 'text-slate-700',
          gradient: 'from-slate-700 to-slate-900',
          bg: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)',
          labels: { main: 'Job Title', org: 'Employer', grade: 'Performance', ref: 'Employee ID', context: 'served successfully as' }
        };
      case 'government':
        return {
          icon: <Scale className={isLicenseMode ? "w-8 h-8" : "w-12 h-12"} />,
          color: 'text-blue-800',
          gradient: 'from-blue-800 to-blue-900',
          bg: 'linear-gradient(to right, #eef2f3, #8e9eab)', 
          labels: { main: 'License Type', org: 'Authority', grade: 'Class', ref: 'License No', context: 'is officially authorized as' }
        };
      case 'gig':
        return {
          icon: <Globe className={isLicenseMode ? "w-8 h-8" : "w-12 h-12"} />,
          color: 'text-orange-600',
          gradient: 'from-orange-500 to-red-500',
          bg: 'linear-gradient(to top, #fcc5e4 0%, #fda34b 15%, #ff7882 35%, #c8699e 52%, #7046aa 71%, #0c1db8 87%, #020f75 100%)',
          labels: { main: 'Role / Service', org: 'Platform', grade: 'Rating', ref: 'Contract ID', context: 'delivered services as' }
        };
      default:
        return {
          icon: <Shield className={isLicenseMode ? "w-8 h-8" : "w-12 h-12"} />,
          color: 'text-gray-700',
          gradient: 'from-gray-700 to-black',
          bg: 'linear-gradient(to top, #dfe9f3 0%, white 100%)',
          labels: { main: 'Title', org: 'Organization', grade: 'Grade', ref: 'Reference ID', context: 'is recognized for' }
        };
    }
  };

  const config = getConfig();

  // --- 1. License Card Layout (Unchanged) ---
  if (isLicenseMode) {
    return (
      <div className="relative w-[600px] h-[380px] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 font-sans">
        <div className="absolute inset-0 z-0 opacity-15" style={{ background: config.bg }} />
        <div className={`relative z-10 h-16 bg-gradient-to-r ${config.gradient} flex items-center px-6 justify-between`}>
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-lg">
              {React.cloneElement(config.icon as React.ReactElement, { className: "w-6 h-6 text-white" })}
            </div>
            <div>
              <h3 className="text-sm font-medium opacity-90 uppercase tracking-wider">{category} Credential</h3>
              <p className="font-bold text-lg leading-tight">{metadata.organization || issuerName}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/90 ${status === 'valid' ? 'text-emerald-700' : 'text-red-700'}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className="relative z-10 p-6 flex gap-6">
          <div className="flex flex-col gap-4 w-32">
            <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-300" />
            </div>
            <div className="flex justify-center">
              <QRCode value={verificationUrl} size={80} level="M" />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Holder Name</p>
              <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">{config.labels.main}</p>
                <p className="font-semibold text-gray-800">{metadata.course || subCategory}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">{config.labels.ref}</p>
                <p className="font-mono text-gray-700">{metadata.referenceId || metadata.rollNo || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Issued On</p>
                <p className="text-gray-700">{formatDate(issueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Valid Until</p>
                <p className={`font-semibold ${expiryDate && new Date() > new Date(expiryDate) ? 'text-red-600' : 'text-gray-700'}`}>
                  {expiryDate ? formatDate(expiryDate) : 'Permanent'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. Standard Certificate Layout (Fixed Alignment) ---
  return (
    <div className="relative w-[800px] h-[600px] bg-white rounded-xl shadow-lg overflow-hidden font-serif">
      {/* Background & Pattern */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ background: config.bg }} />
      <div className={`absolute inset-[12px] border-[4px] rounded-lg z-0 ${config.color.replace('text', 'border')} opacity-20`} />
      
      {/* Status Badge */}
      <div className="absolute top-6 right-6 z-20 font-sans">
        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border ${
          status === 'valid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
          status === 'expired' ? 'bg-amber-50 border-amber-200 text-amber-700' :
          'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status.toUpperCase()}
        </span>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full p-8">
        
        {/* Header */}
        <div className="text-center mt-2">
          <div className="flex justify-center mb-2">
            {React.cloneElement(config.icon as React.ReactElement, { className: `w-12 h-12 ${config.color}` })}
          </div>
          
          {category && (
            <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-gray-400 mb-1 block font-sans">
              {category} Credential
            </span>
          )}

          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-1 capitalize leading-tight">
            {subCategory || certificateType}
          </h1>
          <p className="text-gray-500 italic text-sm">This document certifies that</p>
        </div>
        
        {/* Recipient */}
        <div className="flex-1 flex flex-col justify-center items-center text-center py-2">
          <h2 className={`text-4xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent mb-3 font-serif leading-tight px-4`}>
            {name}
          </h2>
          
          <div className="text-gray-700 text-lg leading-relaxed max-w-2xl mx-auto px-4">
            {config.labels.context}{" "}
            <span className="font-bold text-gray-900 block mt-1 text-xl">
              {metadata.course || "Credential Requirement"}
            </span>
            {metadata.organization && (
              <span className="block mt-1 text-gray-600 text-base">
                at <span className="font-semibold text-gray-800">{metadata.organization}</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Details Grid */}
        {showDetails && (
          <div className="w-full max-w-3xl mx-auto mb-4 bg-white/60 p-4 rounded-xl backdrop-blur-sm border border-gray-100 font-sans shadow-sm">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-1">
                <div className="flex items-center gap-2">
                  <Building className={`w-4 h-4 ${config.color}`} />
                  <span className="text-xs text-gray-500 uppercase font-semibold">{config.labels.org}</span>
                </div>
                <span className="text-sm font-bold text-gray-800 truncate ml-2 max-w-[180px] text-right">
                  {metadata.organization || issuerName}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-200/60 pb-1">
                <div className="flex items-center gap-2">
                  <Award className={`w-4 h-4 ${config.color}`} />
                  <span className="text-xs text-gray-500 uppercase font-semibold">{config.labels.grade}</span>
                </div>
                <span className="text-sm font-bold text-gray-800 text-right">
                  {metadata.grade || "Completed"}
                </span>
              </div>

              {metadata.achievements && metadata.achievements.length > 0 && (
                <div className="col-span-2 pt-1">
                   <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className={`w-4 h-4 ${config.color}`} />
                      <span className="text-xs text-gray-500 uppercase font-semibold">Highlight</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                    {metadata.achievements.slice(0, 3).map((item: string, i: number) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white border border-gray-200 text-gray-700 shadow-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* FOOTER - ALIGNMENT FIXED */}
        {/* Using 'items-start' to ensure both columns start at the same top visual line */}
        <div className="w-full flex justify-between items-start border-t border-gray-200 pt-3 mt-auto">
          {/* Left Column: Text Info */}
          <div className="space-y-1.5 font-sans pt-1">
            <div className="flex items-center text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 mr-2 opacity-70" />
              <span>Issued: {formatDate(issueDate)}</span>
            </div>
            {expiryDate && (
              <div className="flex items-center text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5 mr-2 opacity-70" />
                <span>Expires: {formatDate(expiryDate)}</span>
              </div>
            )}
            <div className="flex items-center text-xs text-gray-600 font-medium">
              <Shield className="w-3.5 h-3.5 mr-2 opacity-70" />
              <span>Issuer: {issuerName}</span>
            </div>
          </div>
          
          {/* Right Column: QR Code */}
          <div className="flex flex-col items-end">
            <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100 mb-1">
              <QRCode 
                value={verificationUrl}
                size={64}
                level="M"
                renderAs="svg"
              />
            </div>
            <div className="flex items-center text-[9px] text-gray-400 font-mono gap-1">
              <Hash className="w-3 h-3" />
              {id.slice(0, 8)}...
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Certificate;