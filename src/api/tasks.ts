/**
 * Tasks API (tied to techforce_portal tasks and task_tags).
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface TaskRow {
  id: number;
  name: string;
  status: 'Unassigned' | 'To-Do' | 'In Progress' | 'Completed';
  assigned_to_id: number | null;
  assigned_to_user_id: number | null;
  assigned_to_name: string | null;
  client_id: number | null;
  client_company: string | null;
  start_date: string | null;
  due_date: string | null;
  notes: string | null;
  priority: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TasksSections {
  todo: TaskRow[];
  inProgress: TaskRow[];
  unassigned: TaskRow[];
  completed: TaskRow[];
}

export async function fetchTasks(userId: number): Promise<TasksSections> {
  const res = await fetch(`${API_BASE}/api/tasks?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data = await res.json();
  return {
    todo: data.todo ?? [],
    inProgress: data.inProgress ?? [],
    unassigned: data.unassigned ?? [],
    completed: data.completed ?? [],
  };
}

export async function fetchTask(id: number): Promise<TaskRow | null> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch task');
  return res.json();
}

export interface CreateTaskPayload {
  name: string;
  status?: string;
  assigned_to_user_id?: number;
  client_id?: number;
  tags: string[];
  start_date?: string;
  due_date?: string;
  notes?: string;
  priority?: string;
}

export async function createTask(payload: CreateTaskPayload): Promise<TaskRow> {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create task');
  return data;
}

export interface UpdateTaskPayload {
  name?: string;
  status?: string;
  assigned_to_user_id?: number | null;
  client_id?: number | null;
  tags?: string[];
  start_date?: string | null;
  due_date?: string | null;
  notes?: string | null;
  priority?: string | null;
}

export async function updateTask(id: number, payload: UpdateTaskPayload): Promise<TaskRow> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update task');
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to delete task');
}
