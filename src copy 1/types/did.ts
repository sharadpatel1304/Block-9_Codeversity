// types/did.ts

export interface DIDDocument {
  '@context': string[];
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service?: ServiceEndpoint[];
  created: string;
  updated: string;
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: JsonWebKey;
  publicKeyMultibase?: string;
  blockchainAccountId?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | IssuerObject;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  credentialSchema?: CredentialSchema[];
  credentialStatus?: CredentialStatus;
  proof: Proof;
}

export interface IssuerObject {
  id: string;
  name?: string;
  type?: string[];
}

export interface CredentialSubject {
  id: string;
  [key: string]: any;
}

export interface CredentialSchema {
  id: string;
  type: string;
}

export interface CredentialStatus {
  id: string;
  type: string;
  statusListIndex?: string;
  statusListCredential?: string;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws?: string;
  proofValue?: string;
}

export interface VerifiablePresentation {
  '@context': string[];
  id: string;
  type: string[];
  holder: string;
  verifiableCredential: VerifiableCredential[];
  proof: Proof;
}

// Credential Categories and Schemas
export enum CredentialCategory {
  ACADEMIC = 'academic',
  SKILL = 'skill',
  EMPLOYMENT = 'employment',
  PROFESSIONAL = 'professional',
  GIG_WORK = 'gig-work', // Legacy
  GOVERNMENT = 'government', // New
  GIG = 'gig'                // New
}

export interface AcademicCredential extends CredentialSubject {
  degree: string;
  institution: string;
  graduationDate: string;
  gpa?: number;
  honors?: string[];
  fieldOfStudy: string;
}

export interface SkillCredential extends CredentialSubject {
  skillName: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certifyingOrganization: string;
  completionDate: string;
  assessmentScore?: number;
  prerequisites?: string[];
}

export interface EmploymentCredential extends CredentialSubject {
  jobTitle: string;
  employer: string;
  startDate: string;
  endDate?: string;
  responsibilities: string[];
  achievements?: string[];
  supervisor?: string;
}

export interface ProfessionalCredential extends CredentialSubject {
  licenseNumber: string;
  profession: string;
  issuingAuthority: string;
  issueDate: string;
  expirationDate?: string;
  specializations?: string[];
}

export interface GigWorkCredential extends CredentialSubject {
  platform: string;
  serviceType: string;
  completionDate: string;
  rating?: number;
  clientFeedback?: string;
  projectDescription: string;
}

// New Interfaces for added categories
export interface GovernmentCredential extends CredentialSubject {
  licenseType: string;
  authority: string;
  jurisdiction?: string;
}

export interface GigCredential extends CredentialSubject {
  platform: string;
  role: string;
  rating?: number;
}

// Issuer Types and Trust Registry
export enum IssuerType {
  UNIVERSITY = 'university',
  SKILL_INSTITUTE = 'skill-institute',
  EMPLOYER = 'employer',
  GIG_PLATFORM = 'gig-platform',
  GOVERNMENT = 'government',
  CERTIFICATION_BODY = 'certification-body'
}

export interface IssuerProfile {
  did: string;
  name: string;
  type: IssuerType;
  description: string;
  website?: string;
  logo?: string;
  verificationEndpoint?: string;
  trustScore: number;
  registrationDate: string;
  isActive: boolean;
  accreditations?: string[];
}

// Selective Disclosure and Privacy
export interface SelectiveDisclosureRequest {
  requiredAttributes: string[];
  optionalAttributes: string[];
  purpose: string;
  verifier: string;
}

export interface DisclosedCredential {
  credentialId: string;
  disclosedAttributes: { [key: string]: any };
  proof: Proof;
}

// Revocation and Status
export interface RevocationEntry {
  credentialHash: string;
  revocationDate: string;
  reason: string;
  category: CredentialCategory;
  issuer: string;
}

export interface CredentialVersion {
  version: number;
  hash: string;
  issuanceDate: string;
  previousVersion?: string;
}