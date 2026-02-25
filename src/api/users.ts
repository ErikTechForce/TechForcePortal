/**
 * Verified users and current user roles (for employee assignment and settings).
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface VerifiedUser {
  id: number;
  username: string;
  email: string;
  roles?: string[];
}

/** All selectable role values (DB/store). Admin is only assignable by an existing admin. */
export const ROLE_OPTIONS = [
  'admin',
  'accounting',
  'sales',
  'marketing',
  'engineers',
  'installation',
  'logistics',
  'corporate',
  'r_d',
  'support',
  'customer_service',
  'it',
  'operations',
  'finances',
  'manufacturing',
  'hr',
] as const;

/** Roles a user can assign to themselves in Settings (no admin). */
export const SELF_ASSIGNABLE_ROLES: readonly string[] = ROLE_OPTIONS;

export async function fetchVerifiedUsers(): Promise<VerifiedUser[]> {
  const res = await fetch(`${API_BASE}/api/users/verified`);
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  return data.users || [];
}

export async function updateMyRoles(userId: number, roles: string[]): Promise<{ roles: string[] }> {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, roles }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update roles');
  return data;
}
