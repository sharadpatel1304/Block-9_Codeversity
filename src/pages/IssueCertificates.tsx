import React, { useState, useRef } from 'react';
import { Upload, FileCheck, X, Plus, Loader, Calendar } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { useCertificates } from '../context/CertificateContext';
import { processExcelFile } from '../utils/helpers';
import toast from 'react-hot-toast';
import Dropdown from '../components/Dropdown';

interface FormData {
  certificateType: string;
  name: string;
  recipientAddress: string;
  issueDate: string;
  expiryDate: string;
  metadata: {
    course?: string;
    organization?: string;
    grade?: string;
    eventName?: string;
    eventDate?: string;
    eventLocation?: string;
    eventDescription?: string;
    achievements: string[];
  };
}

const IssueCertificates: React.FC = () => {
  const { walletAddress, isConnected, isIssuer } = useWallet();
  const { issueCertificate, issueBulkCertificates, isLoading } = useCertificates();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    certificateType: 'completion',
    name: '',
    recipientAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    metadata: {
      course: '',
      organization: '',
      grade: '',
      eventName: '',
      eventDate: '',
      eventLocation: '',
      eventDescription: '',
      achievements: []
    }
  });

  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [achievement, setAchievement] = useState('');

  const certificateTypes = [
    { value: 'completion', label: 'Certificate of Completion' },
    { value: 'achievement', label: 'Certificate of Achievement' },
    { value: 'participation', label: 'Certificate of Participation' },
    { value: 'excellence', label: 'Certificate of Excellence' },
    { value: 'training', label: 'Training Certificate' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !isIssuer) {
      toast.error('Please connect your authorized wallet');
      return;
    }

    try {
      const certificate = await issueCertificate({
        ...formData,
        issuerAddress: walletAddress,
        issuerName: 'Authorized Issuer',
        issueDate: new Date(formData.issueDate),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined
      });

      toast.success('Certificate issued successfully!');
      
      // Reset form
      setFormData({
        certificateType: 'completion',
        name: '',
        recipientAddress: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        metadata: {
          course: '',
          organization: '',
          grade: '',
          eventName: '',
          eventDate: '',
          eventLocation: '',
          eventDescription: '',
          achievements: []
        }
      });
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

    if (!formData.metadata.eventName) {
      toast.error('Please enter an event name');
      return;
    }

    try {
      const data = await processExcelFile(selectedFile);
      
      // Validate Excel data
      const isValidData = data.every(row => 
        row.name && 
        row.rollNo && 
        row.walletAddress && 
        ethers.isAddress(row.walletAddress)
      );

      if (!isValidData) {
        toast.error('Excel file must contain valid name, roll number, and wallet address columns');
        return;
      }

      const certificates = await issueBulkCertificates(data.map(row => ({
        name: row.name,
        recipientAddress: row.walletAddress,
        rollNo: row.rollNo,
        issuerAddress: walletAddress,
        issuerName: 'Authorized Issuer',
        certificateType: formData.certificateType,
        issueDate: new Date(),
        metadata: {
          ...formData.metadata,
          achievements: formData.metadata.achievements
        }
      })));

      toast.success(`Successfully issued ${certificates.length} certificates`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to issue certificates');
    }
  };

  const addAchievement = () => {
    if (!achievement.trim()) return;
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        achievements: [...prev.metadata.achievements, achievement.trim()]
      }
    }));
    setAchievement('');
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        achievements: prev.metadata.achievements.filter((_, i) => i !== index)
      }
    }));
  };

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
          <h1 className="text-2xl font-bold text-gray-800">Issue Certificates</h1>
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Dropdown
                label="Certificate Type"
                value={formData.certificateType}
                onChange={(value) => setFormData(prev => ({ ...prev, certificateType: value }))}
                options={certificateTypes}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.metadata.eventName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, eventName: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={formData.metadata.eventDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, eventDate: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Location
                </label>
                <input
                  type="text"
                  value={formData.metadata.eventLocation}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, eventLocation: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Description
                </label>
                <textarea
                  value={formData.metadata.eventDescription}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, eventDescription: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Achievements (Common for all certificates)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add achievement"
                />
                <button
                  type="button"
                  onClick={addAchievement}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              {formData.metadata.achievements.length > 0 && (
                <div className="space-y-2">
                  {formData.metadata.achievements.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                    >
                      <span className="text-gray-800">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeAchievement(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-4 text-center">
                  <FileCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                  <p className="text-gray-800 font-medium">{selectedFile.name}</p>
                  <div className="text-sm text-gray-600">
                    <p>Excel file must contain these columns:</p>
                    <ul className="mt-1">
                      <li>name (Recipient's full name)</li>
                      <li>rollNo (Roll number/ID)</li>
                      <li>walletAddress (MetaMask address)</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer space-y-4 text-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-800 font-medium">Click to upload Excel file</p>
                    <p className="text-gray-500 text-sm">or drag and drop</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Excel must contain: name, rollNo, walletAddress columns
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleBulkIssue}
              disabled={!selectedFile || isLoading || !formData.metadata.eventName}
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
                  <span>Issue Certificates</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Dropdown
                label="Certificate Type"
                value={formData.certificateType}
                onChange={(value) => setFormData(prev => ({ ...prev, certificateType: value }))}
                options={certificateTypes}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={formData.metadata.eventName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, eventName: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Location
                </label>
                <input
                  type="text"
                  value={formData.metadata.eventLocation}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, eventLocation: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.metadata.course}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, course: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization (Optional)
                </label>
                <input
                  type="text"
                  value={formData.metadata.organization}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, organization: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade (Optional)
                </label>
                <input
                  type="text"
                  value={formData.metadata.grade}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, grade: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Achievements
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add achievement"
                />
                <button
                  type="button"
                  onClick={addAchievement}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              {formData.metadata.achievements.length > 0 && (
                <div className="space-y-2">
                  {formData.metadata.achievements.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                    >
                      <span className="text-gray-800">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeAchievement(index)}
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