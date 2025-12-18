export interface Lead {
  id: number;
  companyName: string;
  pointOfContact: string;
  contactInformation: string;
  source: string;
  phoneNumber?: string;
  productInterested?: string;
  notes?: string;
}

export const leads: Lead[] = [
  {
    id: 1,
    companyName: 'FutureTech Solutions',
    pointOfContact: 'Mark Thompson',
    contactInformation: 'mark.thompson@futuretech.com',
    source: 'LinkedIn',
    phoneNumber: '+1 (555) 111-2222',
    productInterested: 'Robot A',
    notes: 'Initial inquiry about automation solutions. Follow-up scheduled for next week.'
  },
  {
    id: 2,
    companyName: 'Digital Innovations',
    pointOfContact: 'Jessica Lee',
    contactInformation: 'jessica.lee@digitalinnov.com',
    source: 'TechForce',
    phoneNumber: '+1 (555) 222-3333',
    productInterested: 'Robot B',
    notes: 'Referred by existing client. Very interested in our product line.'
  },
  {
    id: 3,
    companyName: 'Smart Systems LLC',
    pointOfContact: 'Robert Garcia',
    contactInformation: 'robert.garcia@smartsystems.com',
    source: 'Facebook',
    phoneNumber: '+1 (555) 333-4444',
    productInterested: 'Robot C',
    notes: 'Saw our advertisement on social media. Requested product demonstration.'
  },
  {
    id: 4,
    companyName: 'NextGen Robotics',
    pointOfContact: 'Amanda White',
    contactInformation: 'amanda.white@nextgen.com',
    source: 'Twitter',
    phoneNumber: '+1 (555) 444-5555',
    productInterested: 'Robot D',
    notes: 'Competitor analysis. Interested in comparing our solutions with other providers.'
  },
  {
    id: 5,
    companyName: 'Automation Pro',
    pointOfContact: 'James Miller',
    contactInformation: 'james.miller@automationpro.com',
    source: 'TechForce',
    phoneNumber: '+1 (555) 555-6666',
    productInterested: 'Robot E',
    notes: 'Trade show lead. High priority follow-up required.'
  },
  {
    id: 6,
    companyName: 'RoboTech Industries',
    pointOfContact: 'Maria Rodriguez',
    contactInformation: 'maria.rodriguez@robotech.com',
    source: 'Instagram',
    phoneNumber: '+1 (555) 666-7777',
    productInterested: 'Robot A',
    notes: 'Influencer referral. Strong interest in our latest product features.'
  }
];

export const getLeadById = (id: number): Lead | undefined => {
  return leads.find(lead => lead.id === id);
};

