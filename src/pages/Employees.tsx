import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { fetchVerifiedUsers, updateUserRoles, type VerifiedUser } from '../api/users';
import { ROLE_OPTIONS } from '../api/users';
import './Page.css';
import './Settings.css';
import './Employees.css';

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

function getUserRoles(u: { roles?: string[] }): string[] {
  return Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [];
}

const Employees: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<VerifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = Array.isArray(user?.roles) && user!.roles.includes('admin');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    let cancelled = false;
    fetchVerifiedUsers()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAdmin, navigate]);

  const openEdit = (u: VerifiedUser) => {
    setEditUserId(u.id);
    setEditRoles(getUserRoles(u));
    setSaveError('');
  };

  const closeEdit = () => {
    setEditUserId(null);
    setSaveError('');
  };

  const toggleEditRole = (role: string) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveRoles = async () => {
    if (!user || editUserId == null) return;
    if (editRoles.length === 0) {
      setSaveError('Select at least one role.');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      await updateUserRoles(editUserId, editRoles, user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUserId ? { ...u, roles: editRoles } : u
        )
      );
      closeEdit();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update roles.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  if (!isAdmin) return null;

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Employees</h2>
            <p className="page-subtitle">View and manage platform users and their roles. Only admins can change roles.</p>

            {loading ? (
              <p className="page-subtitle">Loading…</p>
            ) : (
              <div className="employees-table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Roles</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="employees-empty">No users found.</td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.username}</td>
                          <td>{u.email}</td>
                          <td>
                            <div className="employees-roles-pills">
                              {(getUserRoles(u).length === 0 ? ['—'] : getUserRoles(u)).map((r) => (
                                <span key={r} className="employees-pill">
                                  {ROLE_LABELS[r] ?? r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="update-button employees-edit-btn"
                              onClick={() => openEdit(u)}
                            >
                              Edit roles
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {editUserId !== null && (
              <div className="employees-modal-overlay" onClick={closeEdit}>
                <div className="employees-modal" onClick={(e) => e.stopPropagation()}>
                  <h3 className="section-title">Edit roles</h3>
                  <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
                    {users.find((u) => u.id === editUserId)?.username ?? 'User'} — select all roles that apply. Admins can grant the Admin role.
                  </p>
                  <div className="settings-roles-checkbox-list">
                    {ROLE_OPTIONS.map((r) => (
                      <label key={r} className="settings-role-checkbox">
                        <input
                          type="checkbox"
                          checked={editRoles.includes(r)}
                          onChange={() => toggleEditRole(r)}
                        />
                        <span>{ROLE_LABELS[r] ?? r}</span>
                      </label>
                    ))}
                  </div>
                  {saveError && (
                    <p className="create-order-error" role="alert" style={{ marginTop: '0.75rem' }}>
                      {saveError}
                    </p>
                  )}
                  <div className="form-actions" style={{ marginTop: '1rem' }}>
                    <button type="button" className="cancel-button" onClick={closeEdit}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="update-button"
                      disabled={saving || editRoles.length === 0}
                      onClick={handleSaveRoles}
                    >
                      {saving ? 'Saving…' : 'Save roles'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Employees;
