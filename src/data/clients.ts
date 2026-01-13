export interface Client {
  id: number;
  company: string;
  employee: string | null;
  pointOfContact: string;
  product: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export const clients: Client[] = [
  {
    id: 1,
    company: 'Acme Corporation',
    employee: 'John Smith',
    pointOfContact: 'Sarah Johnson',
    product: 'Robot A',
    contactEmail: 'sarah.johnson@acme.com',
    contactPhone: '+1 (555) 123-4567',
    notes: 'Long-term client with excellent payment history. Interested in expanding their automation capabilities.'
  },
  {
    id: 2,
    company: 'TechSolutions Inc.',
    employee: 'Michael Chen',
    pointOfContact: 'Robert Martinez',
    product: 'Robot B',
    contactEmail: 'robert.martinez@techsolutions.com',
    contactPhone: '+1 (555) 234-5678',
    notes: 'Fast-growing company, potential for multiple product orders in the next quarter.'
  },
  {
    id: 3,
    company: 'Global Industries Ltd.',
    employee: 'Emily Davis',
    pointOfContact: 'Jennifer Brown',
    product: 'Robot C',
    contactEmail: 'jennifer.brown@globalindustries.com',
    contactPhone: '+1 (555) 345-6789',
    notes: 'International client, requires special shipping arrangements.'
  },
  {
    id: 4,
    company: 'Innovation Dynamics',
    employee: 'David Wilson',
    pointOfContact: 'Thomas Anderson',
    product: 'Robot D',
    contactEmail: 'thomas.anderson@innovationdynamics.com',
    contactPhone: '+1 (555) 456-7890',
    notes: 'Tech startup, flexible payment terms. High potential for future growth.'
  },
  {
    id: 5,
    company: 'Advanced Systems Co.',
    employee: 'Lisa Anderson',
    pointOfContact: 'Patricia Williams',
    product: 'Robot E',
    contactEmail: 'patricia.williams@advancedsystems.com',
    contactPhone: '+1 (555) 567-8901',
    notes: 'Established client, regular maintenance contracts. Very satisfied with service quality.'
  },
  {
    id: 6,
    company: 'FutureTech Solutions',
    employee: 'Sarah Johnson',
    pointOfContact: 'James Wilson',
    product: 'Robot A',
    contactEmail: 'james.wilson@futuretech.com',
    contactPhone: '+1 (555) 678-9012',
    notes: 'New client, exploring automation solutions.'
  },
  {
    id: 7,
    company: 'Digital Innovations',
    employee: null,
    pointOfContact: 'Maria Garcia',
    product: 'Robot B',
    contactEmail: 'maria.garcia@digitalinnovations.com',
    contactPhone: '+1 (555) 789-0123',
    notes: 'Prospective client, needs assignment.'
  },
  {
    id: 8,
    company: 'Smart Systems LLC',
    employee: 'Emily Davis',
    pointOfContact: 'Christopher Lee',
    product: 'Robot C',
    contactEmail: 'christopher.lee@smartsystems.com',
    contactPhone: '+1 (555) 890-1234',
    notes: 'Growing company, multiple orders expected.'
  },
  {
    id: 9,
    company: 'NextGen Robotics',
    employee: null,
    pointOfContact: 'Amanda Taylor',
    product: 'Robot D',
    contactEmail: 'amanda.taylor@nextgenrobotics.com',
    contactPhone: '+1 (555) 901-2345',
    notes: 'Startup company, needs assignment.'
  },
  {
    id: 10,
    company: 'Automation Pro',
    employee: 'Lisa Anderson',
    pointOfContact: 'Daniel Moore',
    product: 'Robot E',
    contactEmail: 'daniel.moore@automationpro.com',
    contactPhone: '+1 (555) 012-3456',
    notes: 'Established automation company.'
  },
  {
    id: 11,
    company: 'RoboTech Industries',
    employee: null,
    pointOfContact: 'Jessica White',
    product: 'Robot A',
    contactEmail: 'jessica.white@robotech.com',
    contactPhone: '+1 (555) 123-4568',
    notes: 'New client, needs assignment.'
  }
];

export const getClientById = (id: number): Client | undefined => {
  return clients.find(client => client.id === id);
};

export const getClientByCompanyName = (companyName: string): Client | undefined => {
  return clients.find(client => client.company === companyName);
};




