import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, FileCheck, X, Plus, Loader, Shield, GraduationCap, 
  Award, Briefcase, Globe, ChevronDown, Info, FileSpreadsheet, 
  CheckCircle2, BookOpen, Fingerprint, Wallet 
} from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { useCertificates } from '../context/CertificateContext';
import { processExcelFile } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

// --- 1. CONFIGURATION: PASTE YOUR WALLET ADDRESSES HERE ---
const CATEGORY_WALLETS: Record<string, { did: string; org: string; address: string }> = {
  academic: { 
    did: 'did:web:academy.opencred.org', 
    org: 'OpenCred Academic Alliance',
    address: '0x95f648376BCac4f06bDbF68C77B7d253dC6b0515' // <--- PASTE ACADEMIC WALLET ADDRESS HERE
  },
  skill: { 
    did: 'did:web:skills.opencred.org', 
    org: 'OpenCred Skill Registry',
    address: '0x46Bc14696a69d70d2C9085227E6565fc9Daf7F2e' // <--- PASTE SKILL WALLET ADDRESS HERE
  },
  employment: { 
    did: 'did:web:work.opencred.org', 
    org: 'OpenCred Employment Verification',
    address: '0x2b287Cfa405b079Afe5Ab468112C27Bf4ccEbfE9' // <--- PASTE EMPLOYMENT WALLET ADDRESS HERE
  },
  government: { 
    did: 'did:gov:opencred:id', 
    org: 'Government Authority',
    address: '0x0148dEA9CeBD74f7639B553e4cD8d144D0441f68' // <--- PASTE GOVERNMENT WALLET ADDRESS HERE
  },
  gig: { 
    did: 'did:web:gig.opencred.org', 
    org: 'Decentralized Gig Platform',
    address: '0xfbA0B31735422de1B2Ee7d76089979a7b1910e36' // <--- PASTE GIG WALLET ADDRESS HERE
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
    course?: string;
    organization?: string;
    grade?: string;
    startDate?: string;
    endDate?: string;
    referenceId?: string;
    eventName?: string;
    eventDate?: string;
    eventLocation?: string;
    eventDescription?: string;
    achievements: string[];
    issuerDid?: string;
    operatorAddress?: string; // Tracks the Admin who performed the action
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
    achievements: [],
    issuerDid: '',
    operatorAddress: ''
  }
};

// --- Styled Components ---
const SectionHeader = ({ number, title }: { number: string, title: string }) => (
  <div className="flex items-baseline gap-4 mb-8 border-b border-gray-100 pb-4">
    <span className="text-2xl font-light text-neutral-300">{number}</span>
    <h3 className="text-lg font-medium text-neutral-900 uppercase tracking-wide">{title}</h3>
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 ml-1">
    {children}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-orange-50/50 border border-orange-100/50 text-neutral-900 px-4 py-3 text-base rounded-lg focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder-neutral-400 hover:bg-orange-50"
  />
);

const Select = ({ label, value, onChange, options, disabled = false }: any) => (
  <div className="relative group mb-6">
    <Label>{label}</Label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-orange-50/50 border border-orange-100/50 text-neutral-900 px-4 py-3 text-base rounded-lg focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none appearance-none disabled:text-neutral-300 disabled:bg-neutral-50 transition-colors cursor-pointer hover:bg-orange-50"
      >
        <option value="" disabled>Select option...</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none group-hover:text-neutral-900 transition-colors" />
    </div>
  </div>
);

// --- Guide Modal ---
const GuideModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-medium text-neutral-900">Issuer Guide</h2>
              <p className="text-sm text-neutral-500">Comprehensive manual for credential issuance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <section>
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-primary" /> Prerequisites
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="font-semibold text-neutral-900 block mb-1">Issuer Access</span>
                <p className="text-sm text-neutral-600 leading-relaxed">Only whitelisted wallet addresses can access this page.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="font-semibold text-neutral-900 block mb-1">Blockchain Gas</span>
                <p className="text-sm text-neutral-600 leading-relaxed">Ensure your wallet is funded with native tokens (ETH/MATIC).</p>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          <section>
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-primary" /> Bulk Upload Format
            </h3>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
              <h4 className="font-semibold text-emerald-900 text-sm mb-3">Required Excel Structure (.xlsx)</h4>
              <p className="text-sm text-emerald-800 mb-4">Required headers: <strong>name, walletAddress, rollNo</strong></p>
            </div>
          </section>

          <hr className="border-gray-100" />

           <section>
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary" /> Workflow
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-600">
              <li><strong>Connect:</strong> Sign in with your issuer wallet.</li>
              <li><strong>Select Mode:</strong> Choose Single or Bulk.</li>
              <li><strong>Define Context:</strong> Select the Category and Subcategory.</li>
              <li><strong>Fill Data:</strong> Enter details or upload Excel.</li>
              <li><strong>Issue:</strong> Click "Issue Certificate" and confirm.</li>
            </ol>
           </section>
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium">
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

const IssueCertificates: React.FC = () => {
  const { walletAddress, isConnected, isIssuer } = useWallet();
  const { issueCertificate, issueBulkCertificates, isLoading } = useCertificates();
  const { t } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [listInput, setListInput] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // --- Dynamic Categories & Subcategories (Translated) ---
  const credentialCategories = useMemo(() => {
    // Helper to create option object
    const opt = (val: string, labelKey: string) => ({ value: val, label: t(labelKey) || val });

    return {
      academic: {
        label: t('cat_academic'),
        subcategories: [
          opt('Degree Certificate', 'Degree Certificate'),
          opt('Diploma Certificate', 'Diploma Certificate'),
          opt('Marksheet / Transcript', 'Marksheet / Transcript'),
          opt('Course Completion', 'Course Completion'),
          opt('Research Grant', 'Research Grant')
        ]
      },
      skill: {
        label: t('cat_skill'),
        subcategories: [
          opt('Skill Certification', 'Skill Certification'),
          opt('Training Completion', 'Training Completion'),
          opt('Workshop / Bootcamp', 'Workshop / Bootcamp'),
          opt('Language Proficiency', 'Language Proficiency')
        ]
      },
      employment: {
        label: t('cat_employment'),
        subcategories: [
          opt('Experience Letter', 'Experience Letter'),
          opt('Internship Certificate', 'Internship Certificate'),
          opt('Employment Verification', 'Employment Verification'),
          opt('Recommendation Letter', 'Recommendation Letter')
        ]
      },
      government: {
        label: t('cat_gov'),
        subcategories: [
          opt('Professional License', 'Professional License'),
          opt('Government Authorization', 'Government Authorization'),
          opt('Regulatory Certificate', 'Regulatory Certificate'),
          opt('Identity Proof', 'Identity Proof')
        ]
      },
      gig: {
        label: t('cat_gig'),
        subcategories: [
          opt('Gig Work Record', 'Gig Work Record'),
          opt('Platform Skill Rating', 'Platform Skill Rating'),
          opt('Work History Summary', 'Work History Summary'),
          opt('Project Completion', 'Project Completion')
        ]
      }
    };
  }, [t]);

  // --- Dynamic Certificate Types (Translated) ---
  const certificateTypes = useMemo(() => [
    { value: 'completion', label: t('Certificate of Completion') },
    { value: 'achievement', label: t('Certificate of Achievement') },
    { value: 'participation', label: t('Certificate of Participation') },
    { value: 'excellence', label: t('Certificate of Excellence') },
    { value: 'training', label: t('Training Certificate') },
    { value: 'license', label: t('Official License') },
    { value: 'verification', label: t('Verification Letter') }
  ], [t]);

  // --- Handlers ---

  // Handle Category Change: Update Category AND Auto-fill Organization/DID info
  const handleCategoryChange = (val: string) => {
    const config = CATEGORY_WALLETS[val];
    setFormData(prev => ({
      ...prev,
      certificateCategory: val,
      certificateSubCategory: '',
      metadata: {
        ...prev.metadata,
        organization: config ? config.org : '', // Auto-populate Organization Name
        issuerDid: config ? config.did : ''     // Set DID internally
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !isIssuer) { toast.error('Please connect authorized wallet'); return; }
    if (!formData.certificateCategory) { toast.error('Select a Credential Category'); return; }

    const config = CATEGORY_WALLETS[formData.certificateCategory];
    
    // Safety check for wallet config
    if (!config || !config.address) {
      toast.error(`Wallet address not configured for ${formData.certificateCategory}`);
      return;
    }

    try {
      await issueCertificate({
        ...formData,
        // PRIMARY CHANGE: Set Issuer to the Category Wallet so they see it
        issuerAddress: config.address, 
        issuerName: formData.metadata.organization || config.org || 'Authorized Issuer', 
        issueDate: new Date(formData.issueDate),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        // @ts-ignore
        category: formData.certificateCategory,
        // @ts-ignore
        subCategory: formData.certificateSubCategory,
        metadata: {
          ...formData.metadata,
          issuerDid: config.did,
          operatorAddress: walletAddress // Record Admin as the actual signer
        }
      } as any);

      toast.success(`Issued for ${config.org}`);
      setFormData(initialFormState);
      setListInput('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to issue');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      toast.error('Excel file required');
    }
  };

  const handleBulkIssue = async () => {
    if (!selectedFile) { toast.error('Select a file first'); return; }
    if (!formData.certificateCategory) { toast.error('Select a category'); return; }

    const config = CATEGORY_WALLETS[formData.certificateCategory];
    
    if (!config || !config.address) {
      toast.error(`Wallet address not configured for ${formData.certificateCategory}`);
      return;
    }

    try {
      const data = await processExcelFile(selectedFile);
      const isValidData = data.every((row: any) => row.name && row.rollNo && row.walletAddress && ethers.isAddress(row.walletAddress));

      if (!isValidData) { toast.error('Invalid Excel format'); return; }

      await issueBulkCertificates(
        data.map((row: any) => ({
          name: row.name,
          recipientAddress: row.walletAddress,
          rollNo: row.rollNo,
          // PRIMARY CHANGE: Set Issuer to the Category Wallet
          issuerAddress: config.address, 
          issuerName: formData.metadata.organization || config.org || 'Authorized Issuer', 
          certificateType: formData.certificateType,
          // @ts-ignore
          category: formData.certificateCategory,
          // @ts-ignore
          subCategory: formData.certificateSubCategory,
          issueDate: new Date(),
          metadata: { 
            ...formData.metadata, 
            course: row.course || formData.metadata.course,
            issuerDid: config.did,
            operatorAddress: walletAddress // Record Admin
          }
        } as any))
      );
      toast.success(`Bulk issue successful for ${config.org}`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const addListItem = () => {
    if (!listInput.trim()) return;
    setFormData(prev => ({
      ...prev, metadata: { ...prev.metadata, achievements: [...prev.metadata.achievements, listInput.trim()] }
    }));
    setListInput('');
  };

  const removeListItem = (index: number) => {
    setFormData(prev => ({
      ...prev, metadata: { ...prev.metadata, achievements: prev.metadata.achievements.filter((_, i) => i !== index) }
    }));
  };

  // Helper for dynamic labels (using translation keys)
  const getFieldLabels = (category: string) => {
    switch (category) {
      case 'academic': return { title: t('lbl_course'), org: t('lbl_org'), grade: t('lbl_grade'), ref: t('lbl_ref'), listTitle: 'Honors', icon: GraduationCap };
      case 'skill': return { title: t('lbl_course'), org: t('lbl_org'), grade: t('lbl_grade'), ref: t('lbl_ref'), listTitle: 'Competencies', icon: Award };
      case 'employment': return { title: 'Job Title', org: 'Employer', grade: 'Rating', ref: 'Employee ID', listTitle: 'Responsibilities', icon: Briefcase };
      case 'government': return { title: 'License Type', org: 'Authority', grade: 'Class', ref: 'License #', listTitle: 'Privileges', icon: Shield };
      case 'gig': return { title: 'Role', org: 'Platform', grade: 'Rating', ref: 'Job ID', listTitle: 'Highlights', icon: Globe };
      default: return { title: t('lbl_course'), org: t('lbl_org'), grade: t('lbl_grade'), ref: t('lbl_ref'), listTitle: t('lbl_achievements'), icon: Award };
    }
  };

  const labels = getFieldLabels(formData.certificateCategory);

  if (!isConnected || !isIssuer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-white">
        <Shield className="w-12 h-12 text-neutral-200 mb-6" strokeWidth={1} />
        <h1 className="text-2xl font-light text-neutral-900 mb-2">Issuer Access Only</h1>
        <p className="text-neutral-500 font-light">Connect an authorized wallet to proceed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24 relative">
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 py-16">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-light text-neutral-900 tracking-tight mb-2">
                {t('iss_pageTitle')}
              </h1>
              <p className="text-neutral-500 font-light">{t('iss_pageSubtitle')}</p>
            </div>
            
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-4 py-2 rounded-full hover:bg-orange-100 transition-colors cursor-pointer group"
            >
              <Info size={16} />
              <span>{t('iss_guideBtn')}</span>
              <BookOpen size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
          </div>
          
          {/* Toggle */}
          <div className="border border-gray-200 p-1 inline-flex rounded-lg self-start md:self-auto">
            <button
              onClick={() => setBulkUploadMode(false)}
              className={`px-6 py-2 text-sm font-medium uppercase tracking-wide transition-all rounded-md ${
                !bulkUploadMode ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {t('iss_single')}
            </button>
            <button
              onClick={() => setBulkUploadMode(true)}
              className={`px-6 py-2 text-sm font-medium uppercase tracking-wide transition-all rounded-md ${
                bulkUploadMode ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {t('iss_bulk')}
            </button>
          </div>
        </div>

        {bulkUploadMode ? (
          // --- BULK MODE ---
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-12">
              <Select
                label={t('iss_cat')}
                value={formData.certificateCategory}
                onChange={handleCategoryChange} 
                options={Object.entries(credentialCategories).map(([k, v]) => ({ value: k, label: v.label }))}
              />
               <Select
                label={t('iss_subcat')}
                value={formData.certificateSubCategory}
                onChange={(val: string) => setFormData(p => ({ ...p, certificateSubCategory: val }))}
                // @ts-ignore
                options={formData.certificateCategory ? credentialCategories[formData.certificateCategory].subcategories : []}
                disabled={!formData.certificateCategory}
              />
               <Select
                label={t('iss_temp')}
                value={formData.certificateType}
                onChange={(val: string) => setFormData(p => ({ ...p, certificateType: val }))}
                options={certificateTypes}
              />
              <div>
                <Label>{t('iss_event')}</Label>
                <Input
                  value={formData.metadata.eventName}
                  onChange={(e) => setFormData(p => ({ ...p, metadata: { ...p.metadata, eventName: e.target.value } }))}
                  placeholder="e.g. Summer Batch 2026"
                />
              </div>
            </div>

            <div 
              className={`border border-dashed p-16 text-center transition-all duration-300 cursor-pointer group rounded-2xl ${
                selectedFile 
                ? 'bg-emerald-50/30 border-emerald-200' 
                : 'border-gray-300 bg-orange-50/20 hover:bg-orange-50/50 hover:border-primary/50'
              }`}
               onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
              {selectedFile ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <FileCheck className="w-12 h-12 text-emerald-600 mb-4" strokeWidth={1} />
                  <p className="text-lg font-medium text-emerald-900 mb-1">{selectedFile.name}</p>
                  <p className="text-sm text-emerald-600">Ready for processing</p>
                  <span className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider mt-4 border-b border-red-200">Remove File</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 text-neutral-300 group-hover:text-primary mb-4 transition-colors" strokeWidth={1} />
                  <p className="text-lg font-medium text-neutral-900 mb-1">{t('iss_bulk_drop')}</p>
                  <p className="text-sm text-neutral-400 font-light">Columns: name, rollNo, walletAddress</p>
                  <span className="text-xs text-primary mt-4 opacity-0 group-hover:opacity-100 transition-opacity">Click to browse</span>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <button
                onClick={handleBulkIssue}
                disabled={!selectedFile || isLoading || !formData.metadata.eventName}
                className="w-full bg-neutral-900 hover:bg-primary text-white py-4 text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 rounded-lg"
              >
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isLoading ? t('iss_btn_processing') : t('iss_bulk_btn')}
              </button>
            </div>
            
            <div className="text-center mt-6">
               <button onClick={() => setIsGuideOpen(true)} className="text-xs text-neutral-400 hover:text-neutral-600 underline">
                 View Excel formatting guide
               </button>
            </div>
          </div>
        ) : (
          // --- SINGLE MODE ---
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
              
              {/* Left Column: Context */}
              <div className="lg:col-span-5 space-y-12">
                <section>
                  <SectionHeader number="01" title={t('iss_step1')} />
                  <div className="space-y-4">
                    <Select
                      label={t('iss_cat')}
                      value={formData.certificateCategory}
                      onChange={handleCategoryChange} // Updated to use new handler
                      options={Object.entries(credentialCategories).map(([k, v]) => ({ value: k, label: v.label }))}
                    />
                    
                    {/* DID Display Indicator - Visual Confirmation for Admin */}
                    {formData.certificateCategory && CATEGORY_WALLETS[formData.certificateCategory] && (
                      <div className="flex flex-col gap-2 bg-blue-50/50 p-4 rounded-lg border border-blue-100 animate-in fade-in">
                        <div className="flex items-center gap-2 text-xs text-blue-700 font-bold uppercase tracking-wide">
                           <Fingerprint size={12} /> Issuing as:
                        </div>
                        <div className="text-sm font-medium text-neutral-900">
                          {CATEGORY_WALLETS[formData.certificateCategory].org}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-1 pt-2 border-t border-blue-100/50">
                           <Wallet size={10} /> 
                           {CATEGORY_WALLETS[formData.certificateCategory].address 
                             ? `${CATEGORY_WALLETS[formData.certificateCategory].address.slice(0, 10)}...` 
                             : 'Wallet not configured'}
                        </div>
                      </div>
                    )}

                    <Select
                      label={t('iss_subcat')}
                      value={formData.certificateSubCategory}
                      onChange={(val: string) => setFormData(p => ({ ...p, certificateSubCategory: val }))}
                      // @ts-ignore
                      options={formData.certificateCategory ? credentialCategories[formData.certificateCategory].subcategories : []}
                      disabled={!formData.certificateCategory}
                    />
                    <Select
                      label={t('iss_temp')}
                      value={formData.certificateType}
                      onChange={(val: string) => setFormData(p => ({ ...p, certificateType: val }))}
                      options={certificateTypes}
                    />
                  </div>
                </section>

                <section>
                  <SectionHeader number="02" title={t('iss_step2')} />
                  <div className="space-y-4">
                    <div className="mb-6">
                      <Label>{t('iss_name')}</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label>{t('iss_wallet')}</Label>
                      <Input
                        value={formData.recipientAddress}
                        onChange={(e) => setFormData(p => ({ ...p, recipientAddress: e.target.value }))}
                        placeholder="0x..."
                        required
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Details */}
              <div className="lg:col-span-7">
                <div className="bg-white lg:pl-12 h-full">
                  <SectionHeader number="03" title={t('iss_step3')} />
                  
                  {formData.certificateCategory ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                        <div className="md:col-span-2">
                          <Label>{labels.title}</Label>
                          <Input
                            value={formData.metadata.course}
                            onChange={(e) => setFormData(p => ({ ...p, metadata: { ...p.metadata, course: e.target.value } }))}
                          />
                        </div>
                        <div>
                          <Label>{labels.org}</Label>
                          <Input
                            value={formData.metadata.organization}
                            onChange={(e) => setFormData(p => ({ ...p, metadata: { ...p.metadata, organization: e.target.value } }))}
                            placeholder="Organization Name" 
                          />
                        </div>
                        <div>
                          <Label>{labels.grade}</Label>
                          <Input
                            value={formData.metadata.grade}
                            onChange={(e) => setFormData(p => ({ ...p, metadata: { ...p.metadata, grade: e.target.value } }))}
                          />
                        </div>
                          <div>
                          <Label>{t('iss_date')}</Label>
                          <Input
                            type="date"
                            value={formData.issueDate}
                            onChange={(e) => setFormData(p => ({ ...p, issueDate: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label>{t('Expiry Date') || "Expiry Date"}</Label>
                          <Input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => setFormData(p => ({ ...p, expiryDate: e.target.value }))}
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <Label>{labels.ref}</Label>
                          <Input
                            value={formData.metadata.referenceId}
                            onChange={(e) => setFormData(p => ({ ...p, metadata: { ...p.metadata, referenceId: e.target.value } }))}
                          />
                        </div>
                      </div>

                      {/* List Builder */}
                      <div>
                        <Label>{labels.listTitle}</Label>
                        <div className="flex gap-2 mt-4">
                          <div className="flex-1">
                             <Input 
                                value={listInput}
                                onChange={(e) => setListInput(e.target.value)}
                                placeholder="Type and press enter..."
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addListItem())}
                             />
                          </div>
                          <button
                            type="button"
                            onClick={addListItem}
                            className="bg-neutral-900 text-white rounded-lg px-4 hover:bg-primary transition-colors"
                          >
                            <Plus size={20} />
                          </button>
                        </div>

                        <div className="mt-4 space-y-2">
                          {formData.metadata.achievements.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-orange-50/30 px-4 py-3 border border-orange-100/50 rounded-lg hover:border-orange-200 transition-colors group">
                              <span className="text-sm font-medium text-neutral-700">{item}</span>
                              <button
                                type="button"
                                onClick={() => removeListItem(index)}
                                className="text-neutral-300 hover:text-red-600 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-8">
                          <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-primary hover:bg-neutral-900 text-white py-4 text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          {isLoading ? t('iss_btn_processing') : t('iss_btn')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 bg-neutral-50/50 rounded-xl text-neutral-400 font-light text-sm">
                      {t('iss_select_cat')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default IssueCertificates;