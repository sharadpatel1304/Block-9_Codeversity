import React from 'react';
import { 
  Award, 
  Calendar, 
  Building, 
  GraduationCap, 
  Briefcase, 
  Globe, 
  Scale, 
  Shield, 
  Hash, 
  CheckCircle2
} from 'lucide-react';
import { Certificate as CertificateType, getCertificateStatus } from '../context/CertificateContext';
import { formatDate } from '../utils/helpers';
import QRCode from 'qrcode.react';

interface CertificateProps {
  certificate: CertificateType;
  showDetails?: boolean;
}

const Certificate: React.FC<CertificateProps> = ({ certificate, showDetails = true }) => {
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

  // Configuration for distinct visual identities per category
  const getConfig = () => {
    switch (category) {
      case 'academic':
        return {
          icon: <GraduationCap />,
          text: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-l-blue-600',
          label: 'Academic Record'
        };
      case 'skill':
        return {
          icon: <Award />,
          text: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-l-orange-600',
          label: 'Skill Proficiency'
        };
      case 'employment':
        return {
          icon: <Briefcase />,
          text: 'text-slate-800',
          bg: 'bg-slate-100',
          border: 'border-l-slate-800',
          label: 'Work Experience'
        };
      case 'government':
        return {
          icon: <Scale />,
          text: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-l-emerald-700',
          label: 'Official License'
        };
      case 'gig':
        return {
          icon: <Globe />,
          text: 'text-purple-700',
          bg: 'bg-purple-50',
          border: 'border-l-purple-700',
          label: 'Service Verified'
        };
      default:
        return {
          icon: <Shield />,
          text: 'text-gray-800',
          bg: 'bg-gray-50',
          border: 'border-l-gray-800',
          label: 'Digital Credential'
        };
    }
  };

  const config = getConfig();

  return (
    // MAIN CONTAINER: Fixed aspect ratio for consistency, tighter rounding (xl)
    <div className="relative w-[850px] h-[600px] bg-white rounded-xl shadow-lg overflow-hidden font-sans border border-gray-200 flex flex-col box-border">
      
      {/* 1. Left Accent Bar (Color Coded) */}
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${config.border}`} />

      {/* 2. Top Header: Category & Status */}
      <div className="pt-10 px-12 flex justify-between items-start">
        {/* Category Badge */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${config.bg} ${config.text}`}>
            {React.cloneElement(config.icon as React.ReactElement, { size: 20, strokeWidth: 2 })}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {config.label}
            </span>
            <span className={`text-xs font-bold uppercase ${config.text} opacity-80`}>
              Verified
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${
          status === 'valid' 
            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' 
            : 'bg-red-50/50 border-red-100 text-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${status === 'valid' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-[11px] font-bold uppercase tracking-wider">{status}</span>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="px-12 mt-12 flex-1 flex flex-col justify-start">
        
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-light text-gray-900 tracking-tight leading-none mb-2">
            {subCategory || certificateType}
          </h1>
          <p className="text-sm text-gray-400 italic font-medium">
            Authentic digital record verified by OpenCred Ledger
          </p>
        </div>

        {/* Recipient Section */}
        <div className="relative pl-4 border-l-2 border-gray-100 py-1">
          <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">
            Recipient
          </p>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">
            {name}
          </h2>
        </div>

        {/* Context Text */}
        <div className="mt-8 max-w-2xl">
          <p className="text-lg text-gray-600 font-normal leading-relaxed">
            This document confirms that the individual has successfully met the standards for{" "}
            <span className="font-semibold text-gray-900 border-b-2 border-gray-200 pb-0.5">
              {metadata.course || "the specified credential"}
            </span>
            {metadata.organization && (
              <> at <span className="font-semibold text-gray-900">{metadata.organization}</span></>
            )}
          </p>
        </div>

        {/* Dynamic Details Grid (Grades/IDs) */}
        {showDetails && (
           <div className="flex gap-8 mt-8">
              {metadata.grade && (
                <div>
                   <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-1">Performance</p>
                   <p className="text-xl font-bold text-gray-900">{metadata.grade}</p>
                </div>
              )}
              {metadata.rollNo && (
                 <div>
                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-1">Roll No / ID</p>
                    <p className="text-xl font-mono text-gray-700">{metadata.rollNo}</p>
                 </div>
              )}
           </div>
        )}
      </div>

      {/* 4. Footer Section (Structured Grid) */}
      <div className="mt-auto bg-gray-50 border-t border-gray-100 px-12 py-6">
        <div className="flex justify-between items-center">
          
          {/* Left: Metadata */}
          <div className="flex gap-12">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Issue Date</p>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">{formatDate(issueDate)}</span>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Authority</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className={config.text} />
                <span className="text-sm font-semibold text-gray-700">{issuerName}</span>
              </div>
            </div>
          </div>

          {/* Right: Verification Block */}
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Certificate ID</p>
              <div className="flex items-center justify-end gap-1.5">
                 <Hash size={12} className="text-gray-400" />
                 <span className="text-[10px] font-mono text-gray-500">{id.slice(0, 8)}...{id.slice(-4)}</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1">Stored on Decentralized Ledger</p>
            </div>

            <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
              <QRCode 
                value={verificationUrl} 
                size={64} 
                level="M" 
                renderAs="svg"
                fgColor="#111827"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Certificate;