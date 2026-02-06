import React from 'react';
import { X, CheckCircle, XCircle, Award, Tag, Layers } from 'lucide-react';
import { formatDate } from '../utils/helpers';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  hashId: string;
  isValid: boolean;
  certificateData?: {
    name: string;
    date: Date;
    hashId: string;
    category?: string;     // Added
    subCategory?: string;  // Added
  } | null;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  hashId,
  isValid,
  certificateData
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Certificate Verification
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center">
              {isValid ? (
                <div className="text-emerald-500 animate-bounce">
                  <CheckCircle size={64} />
                </div>
              ) : (
                <div className="text-red-500 animate-pulse">
                  <XCircle size={64} />
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Verification Status</h3>
              <p className={`text-lg font-medium ${isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                {isValid ? 'Certificate is Valid' : 'Certificate is Invalid'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Certificate Hash</h3>
              <p className="text-sm font-mono break-all text-gray-600">{hashId}</p>
            </div>

            {certificateData && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-4">Certificate Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Award size={20} className="text-indigo-600" />
                    <p className="text-gray-600">
                      <span className="font-medium">Recipient:</span> {certificateData.name}
                    </p>
                  </div>
                  
                  {certificateData.category && (
                    <div className="flex items-center gap-2">
                      <Tag size={20} className="text-indigo-600" />
                      <p className="text-gray-600 capitalize">
                        <span className="font-medium">Category:</span> {certificateData.category}
                      </p>
                    </div>
                  )}

                  {certificateData.subCategory && (
                    <div className="flex items-center gap-2">
                      <Layers size={20} className="text-indigo-600" />
                      <p className="text-gray-600">
                        <span className="font-medium">Type:</span> {certificateData.subCategory}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pl-7">
                    <p className="text-gray-600">
                      <span className="font-medium">Issue Date:</span> {formatDate(certificateData.date)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;