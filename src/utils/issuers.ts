// src/utils/issuers.ts

export interface IssuerProfile {
  did: string;
  name: string;
  type: string;
  website: string;
  logo?: string; // Optional URL for logo
}

// Mapping Categories to Specific Issuers (Based on your screenshot)
export const ISSUER_REGISTRY: Record<string, IssuerProfile> = {
  academic: {
    name: 'Indian Institute of Technology Delhi',
    type: 'University',
    did: 'did:ethr:0x123456789abcdef123456789abcdef1234567890',
    website: 'https://iitd.ac.in'
  },
  skill: {
    name: 'National Skill Development Corporation',
    type: 'Skill Institute',
    did: 'did:ethr:0x234567890abcdef234567890abcdef2345678901',
    website: 'https://nsdcindia.org'
  },
  employment: {
    name: 'Tata Consultancy Services',
    type: 'Employer',
    did: 'did:ethr:0x345678901abcdef345678901abcdef3456789012',
    website: 'https://tcs.com'
  },
  government: {
    name: 'Medical Council of India',
    type: 'Government Agency',
    did: 'did:ethr:0x456789012abcdef456789012abcdef4567890123',
    website: 'https://nmc.org.in'
  },
  gig: {
    name: 'Urban Company',
    type: 'Gig Platform',
    did: 'did:ethr:0x567890123abcdef567890123abcdef5678901234',
    website: 'https://urbancompany.com'
  }
};

// Helper to get issuer by category
export const getIssuerByCategory = (category: string): IssuerProfile => {
  return ISSUER_REGISTRY[category.toLowerCase()] || {
    name: 'Authorized Issuer',
    type: 'General',
    did: 'did:ethr:0x0000000000000000000000000000000000000000',
    website: ''
  };
};