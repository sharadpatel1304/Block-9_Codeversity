import React, { useState, useRef } from 'react';
import { Upload, FileCheck, X, Plus, Loader, User, Building, Shield, GraduationCap, Award, Briefcase, Globe } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { useCertificates } from '../context/CertificateContext';
import { processExcelFile } from '../utils/helpers';
import toast from 'react-hot-toast';
import Dropdown from '../components/Dropdown';

// --- Configuration Data ---

// Credential Categories & Subcategories
const credentialCategories: Record<string, { label: string; subcategories: string[] }> = {
  academic: {
    label: 'Academic Credentials',
    subcategories: [
      'Degree Certificate',
      'Diploma Certificate',
      'Marksheet / Transcript',
      'Course Completion',
      'Research Grant'
    ]
  },
  skill: {
    label: 'Skill & Training Credentials',
    subcategories: [
      'Skill Certification',
      'Training Completion',
      'Workshop / Bootcamp',
      'Language Proficiency'
    ]
  },
  employment: {
    label: 'Employment & Experience Records',
    subcategories: [
      'Experience Letter',
      'Internship Certificate',
      'Employment Verification',
      'Recommendation Letter'
    ]
  },
  government: {
    label: 'Professional / Government Credentials',
    subcategories: [
      'Professional License',
      'Government Authorization',
      'Regulatory Certificate',
      'Identity Proof'
    ]
  },
  gig: {
    label: 'Informal / Gig Credentials',
    subcategories: [
      'Gig Work Record',
      'Platform Skill Rating',
      'Work History Summary',
      'Project Completion'
    ]
  }
};

interface FormData {
  certificateCategory: string;
  certificateSubCategory: string;
  certificateType: string;
  name: string;
  recipientAddress: string;
  issueDate: string;
  expiryDate: string;
  metadata: {
    // Standard Fields mapped dynamically
    course?: string;       // Maps to: Degree, Job Title, License Name, Service Type
    organization?: string; // Maps to: University, Employer, Authority, Platform
    grade?: string;        // Maps to: GPA, Rating, Score
    
    // Additional Context Fields
    startDate?: string;
    endDate?: string;
    referenceId?: string;  // For License Numbers, Employee IDs
    
    // Event/Context fields
    eventName?: string;
    eventDate?: string;
    eventLocation?: string;
    eventDescription?: string;
    
    // Dynamic List (Achievements, Responsibilities, etc.)
    achievements: string[];
    
    [key: string]: any;
  };
}

const initialFormState: FormData = {
  certificateCategory: '',
  certificateSubCategory: '',
  certificateType: 'completion',
  name: '',
  recipientAddress: '',
  issueDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  metadata: {
    course: '',
    organization: '',
    grade: '',
    startDate: '',
    endDate: '',
    referenceId: '',
    eventName: '',
    eventDate: '',
    eventLocation: '',
    eventDescription: '',
    achievements: []
  }
};

const IssueCertificates: React.FC = () => {
  const { walletAddress, isConnected, isIssuer } = useWallet();
  const { issueCertificate, issueBulkCertificates, isLoading } = useCertificates();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Definitions
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [listInput, setListInput] = useState(''); // Generic state for list items

  const certificateTypes = [
    { value: 'completion', label: 'Certificate of Completion' },
    { value: 'achievement', label: 'Certificate of Achievement' },
    { value: 'participation', label: 'Certificate of Participation' },
    { value: 'excellence', label: 'Certificate of Excellence' },
    { value: 'training', label: 'Training Certificate' },
    { value: 'license', label: 'Official License' },
    { value: 'verification', label: 'Verification Letter' }
  ];

  // --- Handlers ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !isIssuer) {
      toast.error('Please connect your authorized wallet');
      return;
    }

    // Basic Validation
    if (!formData.certificateCategory) {
      toast.error('Please select a Credential Category');
      return;
    }

    try {
      await issueCertificate({
        ...formData,
        issuerAddress: walletAddress,
        issuerName: 'Authorized Issuer',
        issueDate: new Date(formData.issueDate),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        // Passing these top level for the blockchain/context
        // @ts-ignore
        category: formData.certificateCategory,
        // @ts-ignore
        subCategory: formData.certificateSubCategory
      } as any);

      toast.success('Certificate issued successfully!');
      setFormData(initialFormState);
      setListInput('');

    } catch (error: any) {
      toast.error(error.message || 'Failed to issue certificate');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setSelectedFile(file);
  };

  const handleBulkIssue = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    // Basic validation for bulk
    if (!formData.certificateCategory) {
        toast.error('Please select a category for the bulk issue');
        return;
    }

    try {
      const data = await processExcelFile(selectedFile);
      
      const isValidData = data.every((row: any) => 
        row.name && 
        row.rollNo && 
        row.walletAddress && 
        ethers.isAddress(row.walletAddress)
      );

      if (!isValidData) {
        toast.error('Excel file must contain valid name, roll number, and wallet address columns');
        return;
      }

      const certificates = await issueBulkCertificates(
        data.map((row: any) => ({
          name: row.name,
          recipientAddress: row.walletAddress,
          rollNo: row.rollNo,
          issuerAddress: walletAddress,
          issuerName: 'Authorized Issuer',
          certificateType: formData.certificateType,
          // @ts-ignore
          category: formData.certificateCategory,
          // @ts-ignore
          subCategory: formData.certificateSubCategory,
          issueDate: new Date(),
          metadata: {
            ...formData.metadata,
            // In bulk, we might pull specific fields from excel row if columns exist, 
            // otherwise use form defaults
            course: row.course || formData.metadata.course,
            organization: formData.metadata.organization,
            achievements: formData.metadata.achievements
          }
        } as any))
      );

      toast.success(`Successfully issued ${certificates.length} certificates`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to issue certificates');
    }
  };

  const addListItem = () => {
    if (!listInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        achievements: [...prev.metadata.achievements, listInput.trim()]
      }
    }));
    setListInput('');
  };

  const removeListItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        achievements: prev.metadata.achievements.filter((_, i) => i !== index)
      }
    }));
  };

  // --- Dynamic Field Logic ---

  // Helper to determine labels based on category
  const getFieldLabels = (category: string) => {
    switch (category) {
      case 'academic':
        return {
          title: 'Course / Degree Name',
          org: 'University / Institution',
          grade: 'GPA / Grade',
          ref: 'Student ID / Roll No',
          listTitle: 'Honors & Achievements',
          icon: <GraduationCap className="w-5 h-5 text-indigo-500" />
        };
      case 'skill':
        return {
          title: 'Skill / Certification Name',
          org: 'Issuing Organization',
          grade: 'Score / Proficiency Level',
          ref: 'Certificate ID',
          listTitle: 'Core Competencies',
          icon: <Award className="w-5 h-5 text-purple-500" />
        };
      case 'employment':
        return {
          title: 'Job Title / Role',
          org: 'Employer / Company',
          grade: 'Performance Rating (Optional)',
          ref: 'Employee ID',
          listTitle: 'Key Responsibilities & Achievements',
          icon: <Briefcase className="w-5 h-5 text-blue-500" />
        };
      case 'government':
        return {
          title: 'License / Permit Type',
          org: 'Issuing Authority / Agency',
          grade: 'Class / Category',
          ref: 'License Number',
          listTitle: 'Authorized Privileges',
          icon: <Shield className="w-5 h-5 text-slate-500" />
        };
      case 'gig':
        return {
          title: 'Service Provided / Role',
          org: 'Platform Name',
          grade: 'Client Rating (0-5)',
          ref: 'Job / Contract ID',
          listTitle: 'Project Highlights',
          icon: <Globe className="w-5 h-5 text-orange-500" />
        };
      default:
        return {
          title: 'Title / Course Name',
          org: 'Organization',
          grade: 'Grade / Score',
          ref: 'Reference ID',
          listTitle: 'Achievements',
          icon: <Award className="w-5 h-5 text-gray-500" />
        };
    }
  };

  const labels = getFieldLabels(formData.certificateCategory);

  // --- Render ---

  if (!isConnected || !isIssuer) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Issue Certificates</h1>
          <p className="text-gray-600 mb-6">
            Please connect your authorized wallet to issue certificates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Issue Credentials</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setBulkUploadMode(false)}
              className={`px-4 py-2 rounded-lg ${
                !bulkUploadMode 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setBulkUploadMode(true)}
              className={`px-4 py-2 rounded-lg ${
                bulkUploadMode 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Bulk Upload
            </button>
          </div>
        </div>

        {bulkUploadMode ? (
          // --- BULK UPLOAD VIEW ---
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category Selectors for Bulk */}
              <Dropdown
                label="Credential Category"
                value={formData.certificateCategory}
                onChange={(value) => setFormData(prev => ({ ...prev, certificateCategory: value, certificateSubCategory: '' }))}
                options={Object.entries(credentialCategories).map(([key, val]) => ({ value: key, label: val.label }))}
              />
              
              {formData.certificateCategory && (
                <Dropdown
                  label="Credential Subcategory"
                  value={formData.certificateSubCategory}
                  onChange={(value) => setFormData(prev => ({ ...prev, certificateSubCategory: value }))}
                  options={credentialCategories[formData.certificateCategory].subcategories.map(sub => ({ value: sub, label: sub }))}
                />
              )}

              <Dropdown
                label="Certificate Type"
                value={formData.certificateType}
                onChange={(value) => setFormData(prev => ({ ...prev, certificateType: value }))}
                options={certificateTypes}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Event/Batch Name *</label>
                <input
                  type="text"
                  value={formData.metadata.eventName}
                  onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, eventName: e.target.value } }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
              {selectedFile ? (
                <div className="space-y-4 text-center">
                  <FileCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                  <p className="text-gray-800 font-medium">{selectedFile.name}</p>
                  <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-600 hover:text-red-800">Remove</button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer space-y-4 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-800 font-medium">Click to upload Excel file</p>
                    <p className="text-gray-500 text-sm">Required cols: name, rollNo, walletAddress</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleBulkIssue}
              disabled={!selectedFile || isLoading || !formData.metadata.eventName}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader className="w-5 h-5 animate-spin" /><span>Processing...</span></> : <><Upload className="w-5 h-5" /><span>Issue Bulk Certificates</span></>}
            </button>
          </div>
        ) : (
          // --- SINGLE ISSUE FORM (DYNAMIC) ---
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Category Selection Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-500" /> 
                Credential Classification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Dropdown
                  label="Credential Category"
                  value={formData.certificateCategory}
                  onChange={(value) => setFormData(prev => ({ ...prev, certificateCategory: value, certificateSubCategory: '' }))}
                  options={Object.entries(credentialCategories).map(([key, val]) => ({ value: key, label: val.label }))}
                />

                {formData.certificateCategory && (
                  <Dropdown
                    label="Credential Subcategory"
                    value={formData.certificateSubCategory}
                    onChange={(value) => setFormData(prev => ({ ...prev, certificateSubCategory: value }))}
                    options={credentialCategories[formData.certificateCategory].subcategories.map(sub => ({ value: sub, label: sub }))}
                  />
                )}

                <Dropdown
                  label="Certificate Template"
                  value={formData.certificateType}
                  onChange={(value) => setFormData(prev => ({ ...prev, certificateType: value }))}
                  options={certificateTypes}
                />
              </div>
            </div>

            {/* 2. Recipient Details Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                Recipient Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address *</label>
                  <input
                    type="text"
                    value={formData.recipientAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0x..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* 3. Dynamic Details Section (Changes based on Category) */}
            <div className="bg-white p-6 rounded-xl border-2 border-indigo-50 space-y-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {labels.icon}
                {formData.certificateCategory ? 'Credential Details' : 'Select a Category First'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Dynamic Field: Course / Job / License */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.title}</label>
                  <input
                    type="text"
                    value={formData.metadata.course}
                    onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, course: e.target.value } }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Enter ${labels.title.toLowerCase()}`}
                  />
                </div>

                {/* Dynamic Field: Organization / Employer / Authority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.org}</label>
                  <input
                    type="text"
                    value={formData.metadata.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, organization: e.target.value } }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Enter ${labels.org.toLowerCase()}`}
                  />
                </div>

                {/* Dynamic Field: Grade / Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.grade}</label>
                  <input
                    type="text"
                    value={formData.metadata.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, grade: e.target.value } }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Dynamic Field: Reference ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.ref}</label>
                  <input
                    type="text"
                    value={formData.metadata.referenceId}
                    onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, referenceId: e.target.value } }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Dates Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.certificateCategory === 'employment' ? 'Employment End Date' : 'Expiry Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Specific Fields for Employment/Gig: Start Date */}
                {(formData.certificateCategory === 'employment' || formData.certificateCategory === 'gig') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.metadata.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, startDate: e.target.value } }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Event Metadata (Hidden if not relevant, or repurposed) */}
              <div className="pt-4 border-t border-gray-100">
                 <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Additional Context</h4>
                 <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description / Project Details</label>
                      <textarea
                        value={formData.metadata.eventDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, eventDescription: e.target.value } }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                        placeholder="Describe the achievement, project, or context of this credential..."
                      />
                    </div>
                 </div>
              </div>
            </div>

            {/* 4. Dynamic List Section */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {labels.listTitle}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={listInput}
                  onChange={(e) => setListInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add item..."
                />
                <button
                  type="button"
                  onClick={addListItem}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              {formData.metadata.achievements.length > 0 && (
                <div className="space-y-2 mt-3">
                  {formData.metadata.achievements.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white border border-gray-200 px-4 py-2 rounded-lg"
                    >
                      <span className="text-gray-800">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeListItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Issue Certificate</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default IssueCertificates;