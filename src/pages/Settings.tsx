import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { updateMyRoles, SELF_ASSIGNABLE_ROLES } from '../api/users';
import './Page.css';
import './Settings.css';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  accounting: 'Accounting',
  sales: 'Sales',
  marketing: 'Marketing',
  engineers: 'Engineers',
  installation: 'Installation',
  logistics: 'Logistics',
  corporate: 'Corporate',
  r_d: 'R&D',
  support: 'Support',
  customer_service: 'Customer Service',
  it: 'IT',
  operations: 'Operations',
  finances: 'Finances',
  manufacturing: 'Manufacturing',
  hr: 'HR',
};

function getUserRoles(user: { roles?: string[]; role?: string }): string[] {
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles;
  if (user.role) return [user.role];
  return ['sales'];
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => getUserRoles(user ?? {}));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isAdmin = getUserRoles(user ?? {}).includes('admin');

  useEffect(() => {
    if (user) setSelectedRoles(getUserRoles(user));
  }, [user?.roles, user?.role]);

  const toggleRole = (role: string) => {
    setMessage(null);
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMessage(null);
    if (selectedRoles.length === 0) {
      setMessage({ text: 'Select at least one role.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const data = await updateMyRoles(user.id, selectedRoles);
      updateUser({ roles: data.roles });
      setMessage({ text: 'Roles updated successfully.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Failed to update roles.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div>
            <PageHeader title="Settings" subtitle="Manage your account and preferences" />
          </div>

          <div className="page-content settings-content">

            {/* Account card */}
            <div className="settings-card">
              <h3 className="settings-card-title">Account</h3>
              <div className="settings-card-body">
                <div className="settings-field-row">
                  <div className="settings-field">
                    <span className="settings-field-label">Username</span>
                    <span className="settings-field-value">{user.username}</span>
                  </div>
                  <div className="settings-field">
                    <span className="settings-field-label">Email</span>
                    <span className="settings-field-value">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Roles card */}
            <form onSubmit={handleSave} className="settings-card">
              <h3 className="settings-card-title">Roles</h3>
              <div className="settings-card-body">
                <p className="settings-hint">
                  You can assign yourself multiple roles.
                  {isAdmin
                    ? ' As an admin you can also grant or revoke the Admin role.'
                    : ' Admin can only be set by an existing admin.'}
                </p>

                <div className="settings-roles-grid">
                  {/* Admin toggle — only visible to existing admins */}
                  {isAdmin && (
                    <button
                      type="button"
                      className={`settings-role-pill${selectedRoles.includes('admin') ? ' settings-role-pill--active settings-role-pill--admin' : ''}`}
                      onClick={() => toggleRole('admin')}
                    >
                      {ROLE_LABELS.admin}
                    </button>
                  )}

                  {/* All self-assignable roles (admin excluded) */}
                  {SELF_ASSIGNABLE_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`settings-role-pill${selectedRoles.includes(r) ? ' settings-role-pill--active' : ''}`}
                      onClick={() => toggleRole(r)}
                    >
                      {ROLE_LABELS[r] ?? r}
                    </button>
                  ))}
                </div>

                {selectedRoles.length > 0 && (
                  <div className="settings-selected-summary">
                    <span className="settings-field-label">Selected:</span>{' '}
                    {selectedRoles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
                  </div>
                )}

                {message && (
                  <p className={`settings-message settings-message--${message.type}`} role="alert">
                    {message.text}
                  </p>
                )}

                <div className="settings-actions">
                  <button type="button" className="cancel-button" onClick={() => navigate(-1)}>
                    Back
                  </button>
                  <button type="submit" className="save-button" disabled={saving}>
                    {saving ? 'Saving…' : 'Save roles'}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
