import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, Loader, Award, Building, GraduationCap, Briefcase, Star } from 'lucide-react';
import { useDID } from '../context/DIDContext';
import { useWallet } from '../context/WalletContext';
import { 
  CredentialCategory, 
  IssuerType,
  AcademicCredential,
  SkillCredential,
  EmploymentCredential,
  ProfessionalCredential,
  GigWorkCredential
} from '../types/did';
import Dropdown from '../components/Dropdown';
import toast from 'react-hot-toast';

const IssueVerifiableCredentials: React.FC = () => {
  const { isConnected } = useWallet();
  const { 
    userDID, 
    isLoading, 
    issueCredential, 
    registerAsIssuer,
    getIssuerProfile,
    getAllIssuers,
    registeredIssuers
  } = useDID();

  const [isRegisteredIssuer, setIsRegisteredIssuer] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CredentialCategory>(CredentialCategory.ACADEMIC);
  const [subjectDID, setSubjectDID] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  // Issuer Registration Form
  const [issuerForm, setIssuerForm] = useState({
    name: '',
    type: IssuerType.UNIVERSITY,
    description: '',
    website: '',
    accreditations: [] as string[]
  });

  // Credential Forms
  const [academicForm, setAcademicForm] = useState<Partial<AcademicCredential>>({
    degree: '',
    institution: '',
    graduationDate: '',
    fieldOfStudy: '',
    gpa: undefined,
    honors: []
  });

  const [skillForm, setSkillForm] = useState<Partial<SkillCredential>>({
    skillName: '',
    skillLevel: 'intermediate',
    certifyingOrganization: '',
    completionDate: '',
    assessmentScore: undefined,
    prerequisites: []
  });

  const [employmentForm, setEmploymentForm] = useState<Partial<EmploymentCredential>>({
    jobTitle: '',
    employer: '',
    startDate: '',
    endDate: '',
    responsibilities: [],
    achievements: []
  });

  const [professionalForm, setProfessionalForm] = useState<Partial<ProfessionalCredential>>({
    licenseNumber: '',
    profession: '',
    issuingAuthority: '',
    issueDate: '',
    expirationDate: '',
    specializations: []
  });

  const [gigWorkForm, setGigWorkForm] = useState<Partial<GigWorkCredential>>({
    platform: '',
    serviceType: '',
    completionDate: '',
    rating: undefined,
    clientFeedback: '',
    projectDescription: ''
  });

  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (userDID) {
      checkIssuerStatus();
      getAllIssuers();
    }
  }, [userDID]);

  const checkIssuerStatus = async () => {
    if (!userDID) return;
    
    const profile = await getIssuerProfile(userDID);
    setIsRegisteredIssuer(!!profile);
  };

  const handleIssuerRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!issuerForm.name || !issuerForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const success = await registerAsIssuer(
        issuerForm.name,
        issuerForm.type,
        issuerForm.description,
        issuerForm.website,
        issuerForm.accreditations
      );

      if (success) {
        setIsRegisteredIssuer(true);
        setShowRegistration(false);
        toast.success('Successfully registered as issuer!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to register as issuer');
    }
  };

  const handleCredentialIssue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectDID) {
      toast.error('Please enter the subject DID');
      return;
    }

    let credentialData: any;

    switch (selectedCategory) {
      case CredentialCategory.ACADEMIC:
        if (!academicForm.degree || !academicForm.institution || !academicForm.fieldOfStudy) {
          toast.error('Please fill in all required academic fields');
          return;
        }
        credentialData = academicForm;
        break;
      
      case CredentialCategory.SKILL:
        if (!skillForm.skillName || !skillForm.certifyingOrganization) {
          toast.error('Please fill in all required skill fields');
          return;
        }
        credentialData = skillForm;
        break;
      
      case CredentialCategory.EMPLOYMENT:
        if (!employmentForm.jobTitle || !employmentForm.employer || !employmentForm.startDate) {
          toast.error('Please fill in all required employment fields');
          return;
        }
        credentialData = employmentForm;
        break;
      
      case CredentialCategory.PROFESSIONAL:
        if (!professionalForm.licenseNumber || !professionalForm.profession || !professionalForm.issuingAuthority) {
          toast.error('Please fill in all required professional fields');
          return;
        }
        credentialData = professionalForm;
        break;
      
      case CredentialCategory.GIG_WORK:
        if (!gigWorkForm.platform || !gigWorkForm.serviceType || !gigWorkForm.projectDescription) {
          toast.error('Please fill in all required gig work fields');
          return;
        }
        credentialData = gigWorkForm;
        break;
    }

    try {
      const expDate = expirationDate ? new Date(expirationDate) : undefined;
      await issueCredential(subjectDID, credentialData, selectedCategory, expDate);
      
      // Reset forms
      resetForms();
      toast.success('Verifiable credential issued successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to issue credential');
    }
  };

  const resetForms = () => {
    setSubjectDID('');
    setExpirationDate('');
    setAcademicForm({
      degree: '', institution: '', graduationDate: '', fieldOfStudy: '', gpa: undefined, honors: []
    });
    setSkillForm({
      skillName: '', skillLevel: 'intermediate', certifyingOrganization: '', completionDate: '', assessmentScore: undefined, prerequisites: []
    });
    setEmploymentForm({
      jobTitle: '', employer: '', startDate: '', endDate: '', responsibilities: [], achievements: []
    });
    setProfessionalForm({
      licenseNumber: '', profession: '', issuingAuthority: '', issueDate: '', expirationDate: '', specializations: []
    });
    setGigWorkForm({
      platform: '', serviceType: '', completionDate: '', rating: undefined, clientFeedback: '', projectDescription: ''
    });
  };

  const addArrayItem = (category: string, field: string) => {
    if (!newItem.trim()) return;

    switch (category) {
      case 'academic':
        if (field === 'honors') {
          setAcademicForm(prev => ({
            ...prev,
            honors: [...(prev.honors || []), newItem.trim()]
          }));
        }
        break;
      case 'skill':
        if (field === 'prerequisites') {
          setSkillForm(prev => ({
            ...prev,
            prerequisites: [...(prev.prerequisites || []), newItem.trim()]
          }));
        }
        break;
      case 'employment':
        if (field === 'responsibilities') {
          setEmploymentForm(prev => ({
            ...prev,
            responsibilities: [...(prev.responsibilities || []), newItem.trim()]
          }));
        } else if (field === 'achievements') {
          setEmploymentForm(prev => ({
            ...prev,
            achievements: [...(prev.achievements || []), newItem.trim()]
          }));
        }
        break;
      case 'professional':
        if (field === 'specializations') {
          setProfessionalForm(prev => ({
            ...prev,
            specializations: [...(prev.specializations || []), newItem.trim()]
          }));
        }
        break;
      case 'issuer':
        if (field === 'accreditations') {
          setIssuerForm(prev => ({
            ...prev,
            accreditations: [...prev.accreditations, newItem.trim()]
          }));
        }
        break;
    }
    setNewItem('');
  };

  const removeArrayItem = (category: string, field: string, index: number) => {
    switch (category) {
      case 'academic':
        if (field === 'honors') {
          setAcademicForm(prev => ({
            ...prev,
            honors: prev.honors?.filter((_, i) => i !== index) || []
          }));
        }
        break;
      case 'skill':
        if (field === 'prerequisites') {
          setSkillForm(prev => ({
            ...prev,
            prerequisites: prev.prerequisites?.filter((_, i) => i !== index) || []
          }));
        }
        break;
      case 'employment':
        if (field === 'responsibilities') {
          setEmploymentForm(prev => ({
            ...prev,
            responsibilities: prev.responsibilities?.filter((_, i) => i !== index) || []
          }));
        } else if (field === 'achievements') {
          setEmploymentForm(prev => ({
            ...prev,
            achievements: prev.achievements?.filter((_, i) => i !== index) || []
          }));
        }
        break;
      case 'professional':
        if (field === 'specializations') {
          setProfessionalForm(prev => ({
            ...prev,
            specializations: prev.specializations?.filter((_, i) => i !== index) || []
          }));
        }
        break;
      case 'issuer':
        if (field === 'accreditations') {
          setIssuerForm(prev => ({
            ...prev,
            accreditations: prev.accreditations.filter((_, i) => i !== index)
          }));
        }
        break;
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <Shield className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Issue Verifiable Credentials</h1>
          <p className="text-gray-600 mb-6">
            Connect your wallet to issue W3C-compliant verifiable credentials.
          </p>
        </div>
      </div>
    );
  }

  if (!isRegisteredIssuer && !showRegistration) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <Building className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Register as Issuer</h1>
          <p className="text-gray-600 mb-6">
            You need to register as a trusted issuer before you can issue verifiable credentials.
          </p>
          <button
            onClick={() => setShowRegistration(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity duration-200"
          >
            Register as Issuer
          </button>
        </div>
      </div>
    );
  }

  if (showRegistration) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Register as Issuer</h1>
          
          <form onSubmit={handleIssuerRegistration} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={issuerForm.name}
                  onChange={(e) => setIssuerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <Dropdown
                label="Issuer Type *"
                value={issuerForm.type}
                onChange={(value) => setIssuerForm(prev => ({ ...prev, type: value as IssuerType }))}
                options={[
                  { value: IssuerType.UNIVERSITY, label: 'University' },
                  { value: IssuerType.SKILL_INSTITUTE, label: 'Skill Institute' },
                  { value: IssuerType.EMPLOYER, label: 'Employer' },
                  { value: IssuerType.GIG_PLATFORM, label: 'Gig Platform' },
                  { value: IssuerType.GOVERNMENT, label: 'Government Agency' },
                  { value: IssuerType.CERTIFICATION_BODY, label: 'Certification Body' }
                ]}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={issuerForm.website}
                  onChange={(e) => setIssuerForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={issuerForm.description}
                  onChange={(e) => setIssuerForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accreditations
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add accreditation"
                  />
                  <button
                    type="button"
                    onClick={() => addArrayItem('issuer', 'accreditations')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                {issuerForm.accreditations.length > 0 && (
                  <div className="space-y-2">
                    {issuerForm.accreditations.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                        <span className="text-gray-800">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('issuer', 'accreditations', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRegistration(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Register as Issuer</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderCredentialForm = () => {
    switch (selectedCategory) {
      case CredentialCategory.ACADEMIC:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
              <input
                type="text"
                value={academicForm.degree || ''}
                onChange={(e) => setAcademicForm(prev => ({ ...prev, degree: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
              <input
                type="text"
                value={academicForm.institution || ''}
                onChange={(e) => setAcademicForm(prev => ({ ...prev, institution: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study *</label>
              <input
                type="text"
                value={academicForm.fieldOfStudy || ''}
                onChange={(e) => setAcademicForm(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Date</label>
              <input
                type="date"
                value={academicForm.graduationDate || ''}
                onChange={(e) => setAcademicForm(prev => ({ ...prev, graduationDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                value={academicForm.gpa || ''}
                onChange={(e) => setAcademicForm(prev => ({ ...prev, gpa: parseFloat(e.target.value) || undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case CredentialCategory.SKILL:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name *</label>
              <input
                type="text"
                value={skillForm.skillName || ''}
                onChange={(e) => setSkillForm(prev => ({ ...prev, skillName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <Dropdown
              label="Skill Level"
              value={skillForm.skillLevel || 'intermediate'}
              onChange={(value) => setSkillForm(prev => ({ ...prev, skillLevel: value as any }))}
              options={[
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
                { value: 'expert', label: 'Expert' }
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certifying Organization *</label>
              <input
                type="text"
                value={skillForm.certifyingOrganization || ''}
                onChange={(e) => setSkillForm(prev => ({ ...prev, certifyingOrganization: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
              <input
                type="date"
                value={skillForm.completionDate || ''}
                onChange={(e) => setSkillForm(prev => ({ ...prev, completionDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={skillForm.assessmentScore || ''}
                onChange={(e) => setSkillForm(prev => ({ ...prev, assessmentScore: parseInt(e.target.value) || undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        );

      // Add other credential forms...
      default:
        return <div>Select a credential category to continue</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Issue Verifiable Credentials</h1>
        
        <form onSubmit={handleCredentialIssue} className="space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject DID *
              </label>
              <input
                type="text"
                value={subjectDID}
                onChange={(e) => setSubjectDID(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="did:ethr:0x..."
                required
              />
            </div>

            <Dropdown
              label="Credential Category *"
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value as CredentialCategory)}
              options={[
                { value: CredentialCategory.ACADEMIC, label: 'Academic Qualification' },
                { value: CredentialCategory.SKILL, label: 'Skill Certification' },
                { value: CredentialCategory.EMPLOYMENT, label: 'Employment Record' },
                { value: CredentialCategory.PROFESSIONAL, label: 'Professional License' },
                { value: CredentialCategory.GIG_WORK, label: 'Gig Work Credential' }
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category-specific Form */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {selectedCategory === CredentialCategory.ACADEMIC && <GraduationCap className="w-5 h-5" />}
              {selectedCategory === CredentialCategory.SKILL && <Star className="w-5 h-5" />}
              {selectedCategory === CredentialCategory.EMPLOYMENT && <Briefcase className="w-5 h-5" />}
              {selectedCategory === CredentialCategory.PROFESSIONAL && <Award className="w-5 h-5" />}
              {selectedCategory === CredentialCategory.GIG_WORK && <Building className="w-5 h-5" />}
              {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Details
            </h2>
            {renderCredentialForm()}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Issuing...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Issue Verifiable Credential</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueVerifiableCredentials;