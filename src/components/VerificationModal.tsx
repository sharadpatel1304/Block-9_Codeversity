import React from 'react';
import { X, CheckCircle, XCircle, Award, Tag, Layers, Calendar } from 'lucide-react';
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
    category?: string;
    subCategory?: string;
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
    // Backdrop: Lighter, less blur, sharp edges
    <div className="fixed inset-0 bg-white/90 z-50 flex items-center justify-center p-4">
      
      {/* Modal Container: Square edges, thin border, no shadow */}
      <div className="bg-white border border-gray-200 max-w-lg w-full relative">
        
        {/* Close Button: Top right, minimal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-primary transition-colors"
        >
          <X size={24} strokeWidth={1.5} />
        </button>

        <div className="p-8 md:p-12">
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-light text-neutral-900 mb-2">
              Verification Status
            </h2>
            <div className="w-12 h-0.5 bg-primary mx-auto"></div>
          </div>

          {/* Status Indicator */}
          <div className="flex flex-col items-center justify-center mb-10 space-y-4">
            {isValid ? (
              <>
                <CheckCircle size={56} strokeWidth={1} className="text-emerald-600" />
                <span className="text-emerald-700 text-lg font-medium tracking-wide">
                  Valid Certificate
                </span>
              </>
            ) : (
              <>
                <XCircle size={56} strokeWidth={1} className="text-red-600" />
                <span className="text-red-700 text-lg font-medium tracking-wide">
                  Invalid Certificate
                </span>
              </>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-0 divide-y divide-gray-100 border-t border-b border-gray-100 mb-10">
            
            {/* Hash Row */}
            <div className="py-4 grid grid-cols-12 gap-4">
              <span className="col-span-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Hash ID</span>
              <span className="col-span-8 text-sm font-mono text-neutral-600 break-all">{hashId}</span>
            </div>

            {certificateData && (
              <>
                {/* Recipient Row */}
                <div className="py-4 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 flex items-center gap-2">
                    <Award size={16} className="text-primary" strokeWidth={1.5} />
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Recipient</span>
                  </div>
                  <span className="col-span-8 text-base text-neutral-900 font-light">{certificateData.name}</span>
                </div>

                {/* Category Row */}
                {certificateData.category && (
                  <div className="py-4 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 flex items-center gap-2">
                      <Tag size={16} className="text-primary" strokeWidth={1.5} />
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Category</span>
                    </div>
                    <span className="col-span-8 text-base text-neutral-900 font-light capitalize">{certificateData.category}</span>
                  </div>
                )}

                {/* Type Row */}
                {certificateData.subCategory && (
                  <div className="py-4 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 flex items-center gap-2">
                      <Layers size={16} className="text-primary" strokeWidth={1.5} />
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Type</span>
                    </div>
                    <span className="col-span-8 text-base text-neutral-900 font-light">{certificateData.subCategory}</span>
                  </div>
                )}

                {/* Date Row */}
                <div className="py-4 grid grid-cols-12 gap-4 items-center">
                   <div className="col-span-4 flex items-center gap-2">
                      <Calendar size={16} className="text-primary" strokeWidth={1.5} />
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Issued</span>
                    </div>
                  <span className="col-span-8 text-base text-neutral-900 font-light">{formatDate(certificateData.date)}</span>
                </div>
              </>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-neutral-900 hover:bg-primary text-white text-sm font-medium py-4 transition-colors duration-300"
          >
            Close Verification
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;