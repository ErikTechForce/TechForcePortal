import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import SearchableDropdown from '../components/SearchableDropdown';
import TagSelector from '../components/TagSelector';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { fetchTask, updateTask, deleteTask, type TaskRow } from '../api/tasks';
import { fetchVerifiedUsers, ROLE_OPTIONS } from '../api/users';
import { fetchClients } from '../api/clients';
import { TAG_PILL_COLORS, ROLE_LABELS } from '../constants/taskTags';
import './Page.css';
import './TaskDetail.css';


const STATUS_CLASS: Record<string, string> = {
  'Unassigned': 'task-status-unassigned',
  'To-Do': 'task-status-todo',
  'In Progress': 'task-status-inprogress',
  'Completed': 'task-status-completed',
};

const PRIORITY_CLASS: Record<string, string> = {
  Low: 'task-priority-low',
  Medium: 'task-priority-medium',
  High: 'task-priority-high',
  Urgent: 'task-priority-urgent',
};

const fmt = (d: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const TaskDetail: React.FC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const taskIdNum = taskId ? parseInt(taskId, 10) : null;

  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(!!taskIdNum);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Display state (read-only card)
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
  const [priority, setPriority] = useState('');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<TaskRow['status']>('To-Do');
  const [editAssignedToUserId, setEditAssignedToUserId] = useState<number | null>(null);
  const [editAssignedToDisplay, setEditAssignedToDisplay] = useState('');
  const [editClientId, setEditClientId] = useState<number | null>(null);
  const [editClientDisplay, setEditClientDisplay] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPriority, setEditPriority] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      .catch(() => { if (!cancelled) setTask(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
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
        if (!cancelled) { setVerifiedUsers([]); setClientOptions([]); }
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const openEditModal = () => {
    setEditName(name);
    setEditStatus(status);
    setEditAssignedToUserId(assignedToUserId);
    setEditAssignedToDisplay(assignedToDisplay);
    setEditClientId(clientId);
    setEditClientDisplay(clientDisplay);
    setEditTags([...tags]);
    setEditStartDate(startDate);
    setEditDueDate(dueDate);
    setEditNotes(notes);
    setEditPriority(priority);
    setMessage('');
    setEditModalOpen(true);
  };

  const toggleEditTag = (role: string) => {
    setEditTags((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskIdNum || !task) return;
    if (editTags.length === 0) {
      setMessage('Select at least one role tag.');
      return;
    }
    setMessage('');
    setSaving(true);
    try {
      await updateTask(taskIdNum, {
        name: editName.trim(),
        status: editStatus,
        assigned_to_user_id: editAssignedToUserId,
        client_id: editClientId,
        tags: editTags,
        start_date: editStartDate.trim() || null,
        due_date: editDueDate.trim() || null,
        notes: editNotes.trim() || null,
        priority: editPriority.trim() || null,
      });
      setName(editName.trim());
      setStatus(editStatus);
      setAssignedToUserId(editAssignedToUserId);
      setAssignedToDisplay(editAssignedToDisplay);
      setClientId(editClientId);
      setClientDisplay(editClientDisplay);
      setTags(editTags);
      setStartDate(editStartDate);
      setDueDate(editDueDate);
      setNotes(editNotes.trim());
      setPriority(editPriority);
      setEditModalOpen(false);
      setMessage('Task updated successfully.');
      setTimeout(() => setMessage(''), 4000);
      const updated = await fetchTask(taskIdNum);
      if (updated) setTask(updated);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!taskIdNum) return;
    setDeleting(true);
    try {
      await deleteTask(taskIdNum);
      navigate('/tasks');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete task.');
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content"><p className="page-subtitle">Loading task…</p></div>
          </main>
        </div>
      </div>
    );
  }

  if (!taskIdNum || task === null) {
    return (
      <div className="page-container">
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
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <PageHeader
            title={task ? `Task #${task.id} Details` : 'Task Details'}
            subtitle="View and update task information"
            onBack={() => navigate('/tasks')}
            backLabel="Back"
          />
          <div className="page-content">
            {/* ── Read-only info card ── */}
            <div className="task-info-card">
              <div className="task-info-header">
                <h3 className="task-info-section-title" style={{ margin: 0 }}>Task #{task.id}</h3>
                <div className="task-action-buttons">
                  <button
                    type="button"
                    className="task-action-btn task-action-btn--edit"
                    data-tooltip="Edit task"
                    onClick={openEditModal}
                    aria-label="Edit task"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  <button
                    type="button"
                    className="task-action-btn task-action-btn--delete"
                    data-tooltip="Delete task"
                    onClick={() => setDeleteModalOpen(true)}
                    aria-label="Delete task"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              <div className="task-info-section">
                <div className="task-info-grid">
                  <div className="task-info-item">
                    <span className="task-info-name-value">{name || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="task-info-section">
                <h4 className="task-info-section-title">Status &amp; Assignment</h4>
                <div className="task-info-grid">
                  <div className="task-info-item">
                    <span className="task-info-label">Status</span>
                    <span className={`task-status-badge ${STATUS_CLASS[status] ?? ''}`}>{status}</span>
                  </div>
                  <div className="task-info-item">
                    <span className="task-info-label">Assigned To</span>
                    <span className="task-info-value">{assignedToDisplay || '—'}</span>
                  </div>
                  <div className="task-info-item">
                    <span className="task-info-label">Company</span>
                    <span className="task-info-value">{clientDisplay || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="task-info-section">
                <h4 className="task-info-section-title">Role Tags</h4>
                <div className="task-tag-pills">
                  {tags.length === 0
                    ? <span className="task-info-value">—</span>
                    : tags.map((r) => (
                        <span
                          key={r}
                          className="task-tag-pill"
                          style={TAG_PILL_COLORS[r] ? { backgroundColor: TAG_PILL_COLORS[r], color: '#1B1C1E' } : undefined}
                        >
                          {ROLE_LABELS[r] ?? r}
                        </span>
                      ))
                  }
                </div>
              </div>

              <div className="task-info-section">
                <h4 className="task-info-section-title">Dates &amp; Priority</h4>
                <div className="task-info-grid">
                  <div className="task-info-item">
                    <span className="task-info-label">Start Date</span>
                    <span className="task-info-value">{fmt(startDate)}</span>
                  </div>
                  <div className="task-info-item">
                    <span className="task-info-label">Due Date</span>
                    <span className="task-info-value">{fmt(dueDate)}</span>
                  </div>
                  <div className="task-info-item">
                    <span className="task-info-label">Priority</span>
                    {priority
                      ? <span className={`task-priority-badge ${PRIORITY_CLASS[priority] ?? ''}`}>{priority}</span>
                      : <span className="task-info-value">—</span>
                    }
                  </div>
                </div>
              </div>

              {notes && (
                <div className="task-info-section">
                  <h4 className="task-info-section-title">Notes</h4>
                  <p className="task-info-notes">{notes}</p>
                </div>
              )}
            </div>

            {message && (
              <p
                className={`update-message-banner ${message.startsWith('Task updated') ? 'settings-success' : 'create-order-error'}`}
                role="alert"
                style={{ marginTop: '1rem' }}
              >
                {message}
              </p>
            )}

          </div>
        </main>
      </div>

      {/* ── Delete confirmation modal ── */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Task" narrow>
        <div className="modal-body">
          <p style={{ margin: 0, color: '#1B1C1E' }}>
            Are you sure you want to delete <strong>Task #{task?.id} — {name}</strong>? This cannot be undone.
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
          <button type="button" className="task-delete-confirm-btn" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>

      {/* ── Edit modal ── */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Task #${task.id}`} wide>
        <form onSubmit={handleEditSave}>
          <div className="modal-body">

            <div className="form-group">
              <label htmlFor="edit-task-name" className="form-label">Name *</label>
              <input
                id="edit-task-name"
                type="text"
                className="form-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-task-status" className="form-label">Status</label>
              <select
                id="edit-task-status"
                className="form-select"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TaskRow['status'])}
              >
                <option value="Unassigned">Unassigned</option>
                <option value="To-Do">To-Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <SearchableDropdown
                options={verifiedUsers.map((u) => u.username)}
                value={editAssignedToDisplay}
                onChange={(display) => {
                  setEditAssignedToDisplay(display);
                  const u = verifiedUsers.find((x) => x.username === display);
                  setEditAssignedToUserId(u ? u.id : null);
                }}
                placeholder="Select user..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company (client)</label>
              <SearchableDropdown
                options={clientOptions.map((c) => c.company)}
                value={editClientDisplay}
                onChange={(display) => {
                  setEditClientDisplay(display);
                  const c = clientOptions.find((x) => x.company === display);
                  setEditClientId(c ? c.id : null);
                }}
                placeholder="Select company..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role Tags <span className="task-edit-required">(at least one required)</span></label>
              <TagSelector
                options={ROLE_OPTIONS}
                labels={ROLE_LABELS}
                selected={editTags}
                onChange={setEditTags}
                colors={TAG_PILL_COLORS}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-task-start" className="form-label">Start Date</label>
              <input
                id="edit-task-start"
                type="date"
                className="form-input"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-task-due" className="form-label">Due Date</label>
              <input
                id="edit-task-due"
                type="date"
                className="form-input"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-task-priority" className="form-label">Priority</label>
              <select
                id="edit-task-priority"
                className="form-select"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <option value="">—</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-task-notes" className="form-label">Notes</label>
              <textarea
                id="edit-task-notes"
                className="form-textarea"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                placeholder="Additional notes..."
              />
            </div>

            {message && (
              <p className="create-order-error" role="alert">{message}</p>
            )}

          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={() => setEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="update-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskDetail;
