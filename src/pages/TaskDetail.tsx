import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { useAuth } from '../context/AuthContext';
import { fetchTask, updateTask, type TaskRow } from '../api/tasks';
import { fetchVerifiedUsers, ROLE_OPTIONS } from '../api/users';
import { fetchClients } from '../api/clients';
import './Page.css';
import './TaskDetail.css';
import './ClientDetail.css';

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

const TaskDetail: React.FC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const taskIdNum = taskId ? parseInt(taskId, 10) : null;

  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(!!taskIdNum);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [status, setStatus] = useState<TaskRow['status']>('To-Do');
  const [assignedToUserId, setAssignedToUserId] = useState<number | null>(null);
  const [assignedToDisplay, setAssignedToDisplay] = useState('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientDisplay, setClientDisplay] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<string>('');

  const [verifiedUsers, setVerifiedUsers] = useState<{ id: number; username: string }[]>([]);
  const [clientOptions, setClientOptions] = useState<{ id: number; company: string }[]>([]);

  useEffect(() => {
    if (!taskIdNum) return;
    let cancelled = false;
    setLoading(true);
    fetchTask(taskIdNum)
      .then((t) => {
        if (cancelled) return;
        if (t) {
          setTask(t);
          setName(t.name);
          setStatus(t.status);
          setAssignedToUserId(t.assigned_to_user_id ?? null);
          setAssignedToDisplay(t.assigned_to_name ?? '');
          setClientId(t.client_id ?? null);
          setClientDisplay(t.client_company ?? '');
          setTags(t.tags ?? []);
          setStartDate(t.start_date ?? '');
          setDueDate(t.due_date ?? '');
          setNotes(t.notes ?? '');
          setPriority(t.priority ?? '');
        } else {
          setTask(null);
        }
      })
      .catch(() => {
        if (!cancelled) setTask(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [taskIdNum]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchVerifiedUsers(),
      user?.id ? fetchClients('client', user.id) : fetchClients('client'),
    ])
      .then(([users, clients]) => {
        if (cancelled) return;
        setVerifiedUsers(users.map((u) => ({ id: u.id, username: u.username })));
        setClientOptions(clients.map((c) => ({ id: c.id, company: c.company })));
      })
      .catch(() => {
        if (!cancelled) {
          setVerifiedUsers([]);
          setClientOptions([]);
        }
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const toggleTag = (role: string) => {
    setTags((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskIdNum || !task) return;
    if (tags.length === 0) {
      setMessage('Select at least one role tag.');
      return;
    }
    setMessage('');
    setSaving(true);
    try {
      await updateTask(taskIdNum, {
        name: name.trim(),
        status,
        assigned_to_user_id: assignedToUserId,
        client_id: clientId,
        tags,
        start_date: startDate.trim() || null,
        due_date: dueDate.trim() || null,
        notes: notes.trim() || null,
        priority: priority.trim() || null,
      });
      setMessage('Task updated.');
      const updated = await fetchTask(taskIdNum);
      if (updated) setTask(updated);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <p className="page-subtitle">Loading task…</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!taskIdNum || task === null) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <p className="page-subtitle">Task not found.</p>
              <button type="button" className="cancel-button" onClick={() => navigate('/tasks')}>
                Back to Tasks
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Task Details</h2>
            <p className="page-subtitle">View and update task information</p>

            <form onSubmit={handleSave} className="task-detail-form">
              <div className="task-info-card">
                <div className="task-info-header">
                  <h3 className="task-info-section-title" style={{ margin: 0 }}>Task #{task.id}</h3>
                </div>

                <div className="task-info-section">
                  <h4 className="task-info-section-title">Task</h4>
                  <div className="task-info-grid">
                    <div className="task-info-item">
                      <label htmlFor="task-name" className="task-info-label">Name</label>
                      <div className="task-info-value">
                        <input
                          id="task-name"
                          type="text"
                          className="form-input"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="task-info-section">
                  <h4 className="task-info-section-title">Status &amp; assignment</h4>
                  <div className="task-info-grid">
                    <div className="task-info-item">
                      <label htmlFor="task-status" className="task-info-label">Status</label>
                      <div className="task-info-value">
                        <select
                          id="task-status"
                          className="form-select"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as TaskRow['status'])}
                        >
                          <option value="Unassigned">Unassigned</option>
                          <option value="To-Do">To-Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="task-info-item">
                      <label htmlFor="task-assigned" className="task-info-label">Assigned To</label>
                      <div className="task-info-value">
                        <SearchableDropdown
                          options={verifiedUsers.map((u) => u.username)}
                          value={assignedToDisplay}
                          onChange={(display) => {
                            setAssignedToDisplay(display);
                            const u = verifiedUsers.find((x) => x.username === display);
                            setAssignedToUserId(u ? u.id : null);
                          }}
                          placeholder="Select user..."
                        />
                      </div>
                    </div>
                    <div className="task-info-item">
                      <label htmlFor="task-client" className="task-info-label">Company (client)</label>
                      <div className="task-info-value">
                        <SearchableDropdown
                          options={clientOptions.map((c) => c.company)}
                          value={clientDisplay}
                          onChange={(display) => {
                            setClientDisplay(display);
                            const c = clientOptions.find((x) => x.company === display);
                            setClientId(c ? c.id : null);
                          }}
                          placeholder="Select company..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="task-info-section">
                  <h4 className="task-info-section-title">Role tags</h4>
                  <p className="page-subtitle" style={{ marginBottom: '0.75rem', marginTop: 0 }}>
                    At least one tag required.
                  </p>
                  <div className="task-detail-tags">
                    {ROLE_OPTIONS.map((r) => (
                      <label key={r} className="task-detail-tag-checkbox">
                        <input
                          type="checkbox"
                          checked={tags.includes(r)}
                          onChange={() => toggleTag(r)}
                        />
                        <span>{ROLE_LABELS[r] ?? r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="task-info-section">
                  <h4 className="task-info-section-title">Dates &amp; priority</h4>
                  <div className="task-info-grid">
                    <div className="task-info-item">
                      <label htmlFor="task-start" className="task-info-label">Start Date</label>
                      <div className="task-info-value">
                        <input
                          id="task-start"
                          type="date"
                          className="form-input"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="task-info-item">
                      <label htmlFor="task-due" className="task-info-label">Due Date</label>
                      <div className="task-info-value">
                        <input
                          id="task-due"
                          type="date"
                          className="form-input"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="task-info-item">
                      <label htmlFor="task-priority" className="task-info-label">Priority</label>
                      <div className="task-info-value">
                        <select
                          id="task-priority"
                          className="form-select"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                        >
                          <option value="">—</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {message && (
                  <p
                    className={message.startsWith('Task updated') ? 'settings-success' : 'create-order-error'}
                    role="alert"
                    style={{ marginBottom: '1rem' }}
                  >
                    {message}
                  </p>
                )}

                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => navigate('/tasks')}>
                    Back to Tasks
                  </button>
                  <button type="submit" className="update-button" disabled={saving}>
                    {saving ? 'Saving…' : 'Update task'}
                  </button>
                </div>
              </div>

              <div className="task-detail-notes-section">
                <h4 className="task-detail-notes-title">Notes</h4>
                <textarea
                  className="form-textarea task-detail-notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Additional notes..."
                />
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TaskDetail;
