import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchableDropdown from '../components/SearchableDropdown';
import TagSelector from '../components/TagSelector';
import { useAuth } from '../context/AuthContext';
import { createTask } from '../api/tasks';
import { fetchVerifiedUsers, ROLE_OPTIONS } from '../api/users';
import { fetchClients } from '../api/clients';
import { TAG_PILL_COLORS, ROLE_LABELS } from '../constants/taskTags';
import './AddTask.css';
import './ClientDetail.css';
import './TaskDetail.css';

interface AddTaskFormProps {
  onClose: () => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verifiedUsers, setVerifiedUsers] = useState<{ id: number; username: string }[]>([]);
  const [clientOptions, setClientOptions] = useState<{ id: number; company: string }[]>([]);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<string>('Unassigned');
  const [assignedToUserId, setAssignedToUserId] = useState<number | null>(null);
  const [assignedToDisplay, setAssignedToDisplay] = useState('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientDisplay, setClientDisplay] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Task name is required.');
      return;
    }
    if (tags.length === 0) {
      setError('Select at least one role tag.');
      return;
    }
    setSubmitting(true);
    try {
      const task = await createTask({
        name: name.trim(),
        status,
        assigned_to_user_id: assignedToUserId ?? undefined,
        client_id: clientId ?? undefined,
        tags,
        start_date: startDate.trim() || undefined,
        due_date: dueDate.trim() || undefined,
        notes: notes.trim() || undefined,
        priority: priority.trim() || undefined,
      });
      // Navigate to the new task; modal closes because the page changes
      navigate(`/tasks/${task.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-body">
      <form className="add-task-form task-detail-cards" onSubmit={handleSubmit}>
        <div className="form-section task-detail-card">
          <h3 className="section-title">Task</h3>
          <div className="form-group">
            <label htmlFor="task-name" className="form-label">Name *</label>
            <input
              id="task-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Prepare quarterly report"
            />
          </div>
          <div className="form-group">
            <label htmlFor="task-status" className="form-label">Status</label>
            <select
              id="task-status"
              className="form-select"
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatus(newStatus);
                if (newStatus === 'Unassigned') {
                  setAssignedToUserId(null);
                  setAssignedToDisplay('');
                }
              }}
            >
              <option value="Unassigned">Unassigned</option>
              <option value="To-Do">To-Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="form-section task-detail-card">
          <h3 className="section-title">Assignment &amp; company</h3>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <SearchableDropdown
              options={verifiedUsers.map((u) => u.username)}
              value={assignedToDisplay}
              onChange={(display) => {
                setAssignedToDisplay(display);
                const u = verifiedUsers.find((x) => x.username === display);
                const userId = u ? u.id : null;
                setAssignedToUserId(userId);
                if (userId !== null && status === 'Unassigned') {
                  setStatus('To-Do');
                } else if (userId === null) {
                  setStatus('Unassigned');
                }
              }}
              placeholder="Select user (optional)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Company (client)</label>
            <SearchableDropdown
              options={clientOptions.map((c) => c.company)}
              value={clientDisplay}
              onChange={(display) => {
                setClientDisplay(display);
                const c = clientOptions.find((x) => x.company === display);
                setClientId(c ? c.id : null);
              }}
              placeholder="Select company (optional)"
            />
          </div>
        </div>

        <div className="form-section task-detail-card">
          <h3 className="section-title">Role tags *</h3>
          <p className="page-subtitle" style={{ marginBottom: '0.75rem' }}>
            At least one tag required.
          </p>
          <TagSelector
            options={ROLE_OPTIONS}
            labels={ROLE_LABELS}
            selected={tags}
            onChange={setTags}
            colors={TAG_PILL_COLORS}
          />
        </div>

        <div className="form-section task-detail-card">
          <h3 className="section-title">Dates &amp; Priority</h3>
          <div className="form-group">
            <label htmlFor="task-start" className="form-label">Start Date</label>
            <input
              id="task-start"
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="task-due" className="form-label">Due Date</label>
            <input
              id="task-due"
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="task-priority" className="form-label">Priority</label>
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

        <div className="form-section task-detail-card">
          <h3 className="section-title">Notes</h3>
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {error && <p className="create-order-error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="update-button" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTaskForm;
