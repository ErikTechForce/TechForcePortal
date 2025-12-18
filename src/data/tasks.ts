export interface Task {
  id: number;
  name: string;
  status: 'Unassigned' | 'In Progress' | 'Completed';
  assignedTo?: string;
  startDate?: string;
  notes?: string;
}

export const tasks: Task[] = [
  // To-Do tasks
  { id: 1, name: 'Prepare quarterly report', status: 'Unassigned' },
  { id: 2, name: 'Client onboarding process', status: 'Unassigned' },
  { id: 3, name: 'Review contract terms', status: 'Unassigned' },
  { id: 4, name: 'Update client database', status: 'Unassigned' },
  
  // In Progress tasks
  { id: 5, name: 'Review client proposal', status: 'In Progress', assignedTo: 'John Smith' },
  { id: 6, name: 'Update project documentation', status: 'In Progress', assignedTo: 'Sarah Johnson' },
  { id: 7, name: 'Schedule team meeting', status: 'In Progress', assignedTo: 'Michael Chen' },
  { id: 8, name: 'Follow up with Acme Corporation', status: 'In Progress', assignedTo: 'Emily Davis' },
  
  // Unassigned Tasks
  { id: 9, name: 'Analyze market trends', status: 'Unassigned' },
  { id: 10, name: 'Prepare presentation slides', status: 'Unassigned' },
  { id: 11, name: 'Conduct competitor research', status: 'Unassigned' },
  { id: 12, name: 'Update website content', status: 'Unassigned' },
];

export const employees = [
  'John Smith',
  'Sarah Johnson',
  'Michael Chen',
  'Emily Davis',
  'David Wilson',
  'Lisa Anderson',
];

export const products: string[] = [
  'Robot A',
  'Robot B',
  'Robot C',
  'Robot D',
  'Robot E'
];

export const getTaskById = (id: number): Task | undefined => {
  return tasks.find(task => task.id === id);
};

