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

/** Roles a user can assign to themselves in Settings (excludes admin; admin only via Employees page). */
export const SELF_ASSIGNABLE_ROLES: readonly string[] = ROLE_OPTIONS.filter((r) => r !== 'admin');

/** Fetch current user profile with fresh roles from server (e.g. after another admin grants you a role). */
export async function fetchCurrentUser(userId: number): Promise<{ id: number; username: string; email: string; roles: string[] }> {
  const res = await fetch(`${API_BASE}/api/users/me?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  const data = await res.json();
  return data.user;
}

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

/** Admin only: set another user's roles (including admin). */
export async function updateUserRoles(
  targetUserId: number,
  roles: string[],
  adminUserId: number
): Promise<{ roles: string[] }> {
  const res = await fetch(`${API_BASE}/api/users/${targetUserId}/roles`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_user_id: adminUserId, roles }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update roles');
  return data;
}
