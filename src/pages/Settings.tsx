import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { updateMyRoles, SELF_ASSIGNABLE_ROLES } from '../api/users';
import './Page.css';
import './ClientDetail.css';
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
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) setSelectedRoles(getUserRoles(user));
  }, [user?.roles, user?.role]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMessage('');
    if (selectedRoles.length === 0) {
      setMessage('Select at least one role.');
      return;
    }
    setSaving(true);
    try {
      const data = await updateMyRoles(user.id, selectedRoles);
      updateUser({ roles: data.roles });
      setMessage('Roles updated.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update roles.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Settings</h2>
            <p className="page-subtitle">Manage your account and role</p>

            <form onSubmit={handleSave} className="client-detail-form" style={{ maxWidth: '560px' }}>
              <div className="form-section">
                <h3 className="section-title">Account</h3>
                <div className="client-info-grid">
                  <div className="client-info-item">
                    <label className="client-info-label">Username</label>
                    <div className="client-info-value">{user.username}</div>
                  </div>
                  <div className="client-info-item">
                    <label className="client-info-label">Email</label>
                    <div className="client-info-value">{user.email}</div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Roles</h3>
                <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
                  You can assign yourself multiple roles. Admin can only be set by an existing admin.
                </p>
                <div className="form-group">
                  <span className="form-label">Your roles</span>
                  <div className="settings-roles-checkbox-list">
                    {getUserRoles(user).includes('admin') && (
                      <label className="settings-role-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes('admin')}
                          onChange={() => toggleRole('admin')}
                        />
                        <span>{ROLE_LABELS.admin}</span>
                      </label>
                    )}
                    {SELF_ASSIGNABLE_ROLES.map((r) => (
                      <label key={r} className="settings-role-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(r)}
                          onChange={() => toggleRole(r)}
                        />
                        <span>{ROLE_LABELS[r] ?? r}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {message && (
                <p className={message.startsWith('Roles updated') ? 'settings-success' : 'create-order-error'} role="alert">
                  {message}
                </p>
              )}

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => navigate(-1)}>
                  Back
                </button>
                <button type="submit" className="update-button" disabled={saving}>
                  {saving ? 'Saving…' : 'Save roles'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
