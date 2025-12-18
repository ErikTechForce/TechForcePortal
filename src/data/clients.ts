export interface Client {
  id: number;
  company: string;
  employee: string;
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
  }
];

export const getClientById = (id: number): Client | undefined => {
  return clients.find(client => client.id === id);
};

