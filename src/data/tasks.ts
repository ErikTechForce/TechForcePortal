export interface Task {
  id: number;
  name: string;
  status: 'Unassigned' | 'In Progress' | 'Completed';
  assignedTo?: string;
  startDate?: string;
  notes?: string;
}

/** Placeholder tasks removed; use API (fetchTasks) for real data. */
export const tasks: Task[] = [];

/** @deprecated Use fetchVerifiedUsers() for employee assignment. */
export const employees: string[] = [];

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

