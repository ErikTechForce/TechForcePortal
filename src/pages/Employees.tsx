import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Sidebar from '../components/Sidebar';
import TagSelector from '../components/TagSelector';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { fetchVerifiedUsers, updateUserRoles, type VerifiedUser } from '../api/users';
import { ROLE_OPTIONS } from '../api/users';
import { TAG_PILL_COLORS } from '../constants/taskTags';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [warnSelfAdminRevoke, setWarnSelfAdminRevoke] = useState(false);
  const [pendingRoles, setPendingRoles] = useState<string[] | null>(null);

  const isAdmin = Array.isArray(user?.roles) && user!.roles.includes('admin');

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    if (!searchLower) return users;
    return users.filter((u) => {
      const username = (u.username ?? '').toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const roleLabels = getUserRoles(u).map((r) => (ROLE_LABELS[r] ?? r).toLowerCase());
      const roleKeys = getUserRoles(u).map((r) => r.toLowerCase());
      return (
        username.includes(searchLower) ||
        email.includes(searchLower) ||
        roleLabels.some((l) => l.includes(searchLower)) ||
        roleKeys.some((k) => k.includes(searchLower))
      );
    });
  }, [users, searchLower]);

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

  const handleRolesChange = (newRoles: string[]) => {
    const removingSelfAdmin =
      user != null &&
      editUserId === user.id &&
      editRoles.includes('admin') &&
      !newRoles.includes('admin');

    if (removingSelfAdmin) {
      setPendingRoles(newRoles);
      setWarnSelfAdminRevoke(true);
    } else {
      setEditRoles(newRoles);
    }
  };

  const confirmAdminRevoke = () => {
    if (pendingRoles !== null) setEditRoles(pendingRoles);
    setPendingRoles(null);
    setWarnSelfAdminRevoke(false);
  };

  const cancelAdminRevoke = () => {
    setPendingRoles(null);
    setWarnSelfAdminRevoke(false);
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
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div>
            <PageHeader title="Employees" subtitle="View and manage platform users and their roles. Only admins can change roles." />
          </div>
          <div className="page-content">

            {loading ? (
              <p className="page-subtitle">Loading…</p>
            ) : (
              <>
                <div className="page-toolbar">
                  <input
                    type="text"
                    className="page-toolbar-search"
                    placeholder="Search by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search employees"
                  />
                </div>
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
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="employees-empty">
                            {users.length === 0 ? 'No users found.' : 'No employees match your search.'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td>{u.username}</td>
                          <td>{u.email}</td>
                          <td>
                            <div className="employees-roles-pills">
                              {(getUserRoles(u).length === 0 ? ['—'] : getUserRoles(u)).map((r) => (
                                <span
                                  key={r}
                                  className="employees-pill"
                                  style={TAG_PILL_COLORS[r] ? { backgroundColor: TAG_PILL_COLORS[r] } : undefined}
                                >
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
              </>
            )}

            {editUserId !== null && (
              <div className="employees-modal-overlay" onClick={closeEdit}>
                <div className="employees-modal" onClick={(e) => e.stopPropagation()}>
                  <h3 className="section-title">Edit roles</h3>
                  <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
                    {users.find((u) => u.id === editUserId)?.username ?? 'User'} — select all roles that apply. Admins can grant the Admin role.
                  </p>
                  <TagSelector
                    options={ROLE_OPTIONS}
                    labels={ROLE_LABELS}
                    selected={editRoles}
                    onChange={handleRolesChange}
                    colors={TAG_PILL_COLORS}
                  />
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

      <Modal
        isOpen={warnSelfAdminRevoke}
        onClose={cancelAdminRevoke}
        title="Remove your own admin role?"
        narrow
      >
        <div className="modal-body">
          <p style={{ marginBottom: '1rem' }}>
            You are deselecting the <strong>Admin</strong> role from your own account. Once saved, you will lose access to this page and will need another admin to restore it.
          </p>
          <p style={{ marginBottom: '0', fontWeight: 600, color: '#b45309' }}>
            Are you sure you want to remove it?
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={cancelAdminRevoke}>
            Keep admin role
          </button>
          <button
            type="button"
            className="employees-revoke-admin-btn"
            onClick={confirmAdminRevoke}
          >
            Yes, remove it
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;
