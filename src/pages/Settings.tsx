import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import TagSelector from '../components/TagSelector';
import { useAuth } from '../context/AuthContext';
import { updateMyRoles, SELF_ASSIGNABLE_ROLES } from '../api/users';
import { TAG_PILL_COLORS, ROLE_LABELS } from '../constants/taskTags';
import './Page.css';
import './Settings.css';

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
  const [warnSelfAdminRevoke, setWarnSelfAdminRevoke] = useState(false);
  const [pendingRoles, setPendingRoles] = useState<string[] | null>(null);

  const isAdmin = getUserRoles(user ?? {}).includes('admin');

  useEffect(() => {
    if (user) setSelectedRoles(getUserRoles(user));
  }, [user?.roles, user?.role]);

  const roleOptions = isAdmin
    ? (['admin', ...SELF_ASSIGNABLE_ROLES] as string[])
    : (SELF_ASSIGNABLE_ROLES as string[]);

  const handleRolesChange = (newRoles: string[]) => {
    setMessage(null);
    if (isAdmin && selectedRoles.includes('admin') && !newRoles.includes('admin')) {
      setPendingRoles(newRoles);
      setWarnSelfAdminRevoke(true);
      return;
    }
    setSelectedRoles(newRoles);
  };

  const confirmAdminRevoke = () => {
    if (pendingRoles !== null) setSelectedRoles(pendingRoles);
    setPendingRoles(null);
    setWarnSelfAdminRevoke(false);
  };

  const cancelAdminRevoke = () => {
    setPendingRoles(null);
    setWarnSelfAdminRevoke(false);
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

                <TagSelector
                  options={roleOptions}
                  labels={ROLE_LABELS}
                  selected={selectedRoles}
                  onChange={handleRolesChange}
                  colors={TAG_PILL_COLORS}
                />

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
      <Modal
        isOpen={warnSelfAdminRevoke}
        onClose={cancelAdminRevoke}
        title="Remove your own admin role?"
        narrow
      >
        <div className="modal-body">
          <p style={{ marginBottom: '1rem' }}>
            You are deselecting the <strong>Admin</strong> role from your own account. Once saved, you will lose access to admin features and will need another admin to restore it.
          </p>
          <p style={{ marginBottom: '0', fontWeight: 600, color: '#b45309' }}>
            Are you sure you want to remove it?
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={cancelAdminRevoke}>
            Keep admin role
          </button>
          <button type="button" className="employees-revoke-admin-btn" onClick={confirmAdminRevoke}>
            Yes, remove it
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
