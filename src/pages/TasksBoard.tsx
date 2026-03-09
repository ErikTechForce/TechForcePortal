import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import AddTaskForm from './AddTask';
import { useAuth } from '../context/AuthContext';
import { fetchTasks, updateTask, type TaskRow } from '../api/tasks';
import { fetchClients, type ClientRow } from '../api/clients';
import { fetchOrdersForUser, type OrderRow } from '../api/orderApi';
import './Page.css';
import './TasksBoard.css';

const TAG_LABELS: Record<string, string> = {
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

const TAG_PILL_COLORS: Record<string, string> = {
  admin: '#bef26480',           // Lime
  accounting: '#34d39980',      // Medium Green
  sales: '#fbbf2480',           // Amber/Gold
  marketing: '#f472b680',       // Pink
  engineers: '#3b82f680',       // Blue
  installation: '#f59e0b80',    // Orange/Warning
  logistics: '#2dd4bf80',       // Teal
  corporate: '#94a3b880',       // Slate Grey
  r_d: '#86efac80',             // Green
  support: '#7dd3fc80',         // Light Blue
  customer_service: '#6366f180',// Indigo
  it: '#e879f980',              // Fuchsia
  operations: '#d6d3d180',      // Stone
  finances: '#05966980',        // Dark Green
  manufacturing: '#22d3ee80',   // Cyan
  hr: '#a78bfa80',              // Purple
};

function matchesSearch(task: TaskRow, search: string): boolean {
  if (!search.trim()) return true;
  const term = search.trim().toLowerCase();
  const idStr = String(task.id);
  const nameMatch = task.name.toLowerCase().includes(term);
  const idMatch = idStr.includes(term) || (term.startsWith('#') && idStr.includes(term.slice(1)));
  const tagsMatch = (task.tags ?? []).some(
    (tag) =>
      tag.toLowerCase().includes(term) ||
      tag.replace(/_/g, ' ').toLowerCase().includes(term) ||
      term.replace(/\s+/g, '_').includes(tag.toLowerCase())
  );
  return nameMatch || idMatch || tagsMatch;
}

type BoardColumn = 'todo' | 'inProgress' | 'unassigned';

const TasksBoard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [todo, setTodo] = useState<TaskRow[]>([]);
  const [inProgress, setInProgress] = useState<TaskRow[]>([]);
  const [unassigned, setUnassigned] = useState<TaskRow[]>([]);
  const [completed, setCompleted] = useState<TaskRow[]>([]);
  const [ordersForUser, setOrdersForUser] = useState<OrderRow[]>([]);
  const [assignedCompanies, setAssignedCompanies] = useState<ClientRow[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);

  // Drag-and-drop state
  const [draggedTask, setDraggedTask] = useState<TaskRow | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<BoardColumn | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<BoardColumn | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null);
  const [dragInsertAfter, setDragInsertAfter] = useState(false);
  const isDraggingRef = useRef(false);

  // Assign modal state
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [pendingDropTarget, setPendingDropTarget] = useState<'todo' | 'inProgress' | null>(null);

  // Confirm unassign modal state
  const [confirmUnassignOpen, setConfirmUnassignOpen] = useState(false);

  // Drag error
  const [dragError, setDragError] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setTodo([]);
      setInProgress([]);
      setUnassigned([]);
      setCompleted([]);
      setOrdersForUser([]);
      setAssignedCompanies([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      fetchTasks(user.id),
      fetchClients('client', user.id),
      fetchOrdersForUser(user.id),
    ])
      .then(([sections, clients, orders]) => {
        if (cancelled) return;
        setTodo(sections.todo);
        setInProgress(sections.inProgress);
        setUnassigned(sections.unassigned);
        setCompleted(sections.completed);
        setOrdersForUser(orders);
        setAssignedCompanies(clients);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load tasks.');
          setTodo([]);
          setInProgress([]);
          setUnassigned([]);
          setCompleted([]);
          setOrdersForUser([]);
          setAssignedCompanies([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleAddTask = () => {
    setAddTaskModalOpen(true);
  };

  const handleTaskClick = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleClientClick = (clientId: number) => {
    navigate(`/client/${clientId}`);
  };

  const handleOrderClick = (orderNumber: string) => {
    navigate(`/orders/${orderNumber}`);
  };

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, task: TaskRow, from: BoardColumn) => {
    isDraggingRef.current = true;
    setDraggedTask(task);
    setDraggedFrom(from);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDragOverColumn(null);
    setDragOverTaskId(null);
    setTimeout(() => { isDraggingRef.current = false; }, 100);
  };

  // Column-level drag-over: fires when hovering over empty space in a column
  const handleDragOver = (e: React.DragEvent, column: BoardColumn) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(column);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
      setDragOverTaskId(null);
    }
  };

  // Task-level drag-over: determines insert position (above or below the hovered task)
  const handleTaskDragOver = (e: React.DragEvent, task: TaskRow, column: BoardColumn) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(column);
    setDragOverTaskId(task.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragInsertAfter(e.clientY > rect.top + rect.height / 2);
  };

  // Column-level drop: fires when dropping on empty space → appends to end
  const handleDrop = async (e: React.DragEvent, target: BoardColumn) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDragOverTaskId(null);
    if (!draggedTask || !draggedFrom || draggedFrom === target) {
      setDraggedTask(null);
      setDraggedFrom(null);
      return;
    }

    if (draggedFrom === 'unassigned' && (target === 'todo' || target === 'inProgress')) {
      setPendingDropTarget(target);
      setAssigneeModalOpen(true);
      return;
    }

    if ((draggedFrom === 'todo' || draggedFrom === 'inProgress') && target === 'unassigned') {
      setConfirmUnassignOpen(true);
      return;
    }

    const newStatus = target === 'todo' ? 'To-Do' : 'In Progress';
    try {
      const updated = await updateTask(draggedTask.id, { status: newStatus });
      if (draggedFrom === 'todo') {
        setTodo((prev) => prev.filter((t) => t.id !== draggedTask.id));
        setInProgress((prev) => [...prev, updated]);
      } else {
        setInProgress((prev) => prev.filter((t) => t.id !== draggedTask.id));
        setTodo((prev) => [...prev, updated]);
      }
    } catch (err) {
      setDragError(err instanceof Error ? err.message : 'Failed to move task.');
      setTimeout(() => setDragError(''), 4000);
    }
    setDraggedTask(null);
    setDraggedFrom(null);
  };

  // Task-level drop: respects the insert-before/after position
  const handleTaskDrop = (e: React.DragEvent, targetTask: TaskRow, targetColumn: BoardColumn) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    setDragOverTaskId(null);
    if (!draggedTask || !draggedFrom) return;
    if (draggedTask.id === targetTask.id) {
      setDraggedTask(null);
      setDraggedFrom(null);
      return;
    }

    const after = dragInsertAfter;

    const insertInto = (
      setter: React.Dispatch<React.SetStateAction<TaskRow[]>>,
      item: TaskRow,
    ) => {
      setter((prev) => {
        const list = [...prev];
        const toIdx = list.findIndex((t) => t.id === targetTask.id);
        if (toIdx === -1) return [...list, item];
        list.splice(after ? toIdx + 1 : toIdx, 0, item);
        return list;
      });
    };

    // Cross-column modals (append at end — position inside the modal flow is less meaningful)
    if (draggedFrom === 'unassigned' && (targetColumn === 'todo' || targetColumn === 'inProgress')) {
      setPendingDropTarget(targetColumn);
      setAssigneeModalOpen(true);
      return;
    }
    if ((draggedFrom === 'todo' || draggedFrom === 'inProgress') && targetColumn === 'unassigned') {
      setConfirmUnassignOpen(true);
      return;
    }

    // Same column: local reorder only
    if (draggedFrom === targetColumn) {
      const setter =
        targetColumn === 'todo' ? setTodo :
        targetColumn === 'inProgress' ? setInProgress : setUnassigned;
      setter((prev) => {
        const list = [...prev];
        const fromIdx = list.findIndex((t) => t.id === draggedTask.id);
        if (fromIdx === -1) return prev;
        const [removed] = list.splice(fromIdx, 1);
        const toIdx = list.findIndex((t) => t.id === targetTask.id);
        if (toIdx === -1) { list.push(removed); return list; }
        list.splice(after ? toIdx + 1 : toIdx, 0, removed);
        return list;
      });
      setDraggedTask(null);
      setDraggedFrom(null);
      return;
    }

    // To-Do ↔ In Progress: API status update + positional insert
    const newStatus = targetColumn === 'todo' ? 'To-Do' : 'In Progress';
    updateTask(draggedTask.id, { status: newStatus })
      .then((updated) => {
        if (draggedFrom === 'todo') setTodo((prev) => prev.filter((t) => t.id !== draggedTask.id));
        else setInProgress((prev) => prev.filter((t) => t.id !== draggedTask.id));
        insertInto(targetColumn === 'todo' ? setTodo : setInProgress, updated);
      })
      .catch((err) => {
        setDragError(err instanceof Error ? err.message : 'Failed to move task.');
        setTimeout(() => setDragError(''), 4000);
      });
    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const handleConfirmAssign = async () => {
    if (!draggedTask || !pendingDropTarget || !user?.id) return;
    const newStatus = pendingDropTarget === 'todo' ? 'To-Do' : 'In Progress';
    try {
      const updated = await updateTask(draggedTask.id, {
        status: newStatus,
        assigned_to_user_id: user.id,
      });
      setUnassigned((prev) => prev.filter((t) => t.id !== draggedTask.id));
      if (pendingDropTarget === 'todo') setTodo((prev) => [...prev, updated]);
      else setInProgress((prev) => [...prev, updated]);
    } catch (err) {
      setDragError(err instanceof Error ? err.message : 'Failed to assign task.');
      setTimeout(() => setDragError(''), 4000);
    }
    setAssigneeModalOpen(false);
    setPendingDropTarget(null);
    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const handleCancelAssign = () => {
    setAssigneeModalOpen(false);
    setPendingDropTarget(null);
    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const handleConfirmUnassign = async () => {
    if (!draggedTask) return;
    try {
      const updated = await updateTask(draggedTask.id, {
        status: 'Unassigned',
        assigned_to_user_id: null,
      });
      if (draggedFrom === 'todo') setTodo((prev) => prev.filter((t) => t.id !== draggedTask.id));
      else setInProgress((prev) => prev.filter((t) => t.id !== draggedTask.id));
      setUnassigned((prev) => [...prev, updated]);
    } catch (err) {
      setDragError(err instanceof Error ? err.message : 'Failed to unassign task.');
      setTimeout(() => setDragError(''), 4000);
    }
    setConfirmUnassignOpen(false);
    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const handleCancelUnassign = () => {
    setConfirmUnassignOpen(false);
    setDraggedTask(null);
    setDraggedFrom(null);
  };

  // ── End drag-and-drop handlers ─────────────────────────────────────────────

  // Orders assigned to user: map to To-Do (pending / contract not approved) vs In Progress (in progress, approved, or delivery/installation)
  const todoOrders = ordersForUser.filter(
    (o) => o.status === 'Pending' || (o.category === 'Contract' && o.status !== 'Approved')
  );
  const inProgressOrders = ordersForUser.filter(
    (o) => o.status === 'In Progress' || o.status === 'Approved' || o.category === 'Inventory' || o.category === 'Installation'
  );

  const filteredTodo = todo.filter((t) => matchesSearch(t, taskSearch));
  const filteredInProgress = inProgress.filter((t) => matchesSearch(t, taskSearch));
  const filteredUnassigned = unassigned.filter((t) => matchesSearch(t, taskSearch));
  const filteredCompleted = completed.filter((t) => matchesSearch(t, taskSearch));

  const searchActive = taskSearch.trim().length > 0;
  const searchResults: { task: TaskRow; section: string }[] = searchActive
    ? [
        ...filteredTodo.map((task) => ({ task, section: 'To-Do' })),
        ...filteredInProgress.map((task) => ({ task, section: 'In Progress' })),
        ...filteredUnassigned.map((task) => ({ task, section: 'Unassigned' })),
        ...filteredCompleted.map((task) => ({ task, section: 'Completed' })),
      ]
    : [];

  const renderTaskList = (tasks: TaskRow[], column: BoardColumn) => (
    <div className="tasks-card-content">
      {tasks.length === 0 ? (
        <p className="tasks-empty-hint">No tasks</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className={[
              'clickable-item tasks-board-item tasks-board-item--draggable',
              draggedTask?.id === task.id ? 'tasks-board-item--dragging' : '',
              dragOverTaskId === task.id && !dragInsertAfter ? 'tasks-board-item--insert-before' : '',
              dragOverTaskId === task.id && dragInsertAfter ? 'tasks-board-item--insert-after' : '',
            ].filter(Boolean).join(' ')}
            draggable
            onDragStart={(e) => handleDragStart(e, task, column)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleTaskDragOver(e, task, column)}
            onDrop={(e) => handleTaskDrop(e, task, column)}
            onClick={() => { if (!isDraggingRef.current) handleTaskClick(task.id); }}
          >
            <span className="tasks-item-drag-handle" aria-hidden="true">⠿</span>
            <div className="tasks-item-body">
              <span className="tasks-item-name">
                {task.name} <span className="tasks-item-id">#{task.id}</span>
              </span>
              {task.tags?.length > 0 && (
                <span className="tasks-item-tags">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="tasks-tag-pill"
                    style={{ backgroundColor: TAG_PILL_COLORS[tag] ?? '#8A8F93' }}
                  >
                    {TAG_LABELS[tag] ?? tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const orderStageLabel = (category: string) =>
    category === 'Contract' ? 'Contract' : category === 'Inventory' ? 'Invoice' : category === 'Installation' ? 'Installation' : category;

  const renderOrderList = (orders: OrderRow[]) => (
    <div className="tasks-card-content">
      {orders.length === 0 ? null : (
        orders.map((order) => (
          <div
            key={order.order_number}
            className="clickable-item tasks-board-item tasks-board-order-item"
            onClick={() => handleOrderClick(order.order_number)}
          >
            <span className="tasks-item-name">
              Order {order.order_number} — {order.company_name}
            </span>
            <span className="tasks-item-tags">
              <span className="tasks-tag-pill" style={{ backgroundColor: '#dbeafe' }} title="Stage">
                {orderStageLabel(order.category)}
              </span>
              <span className="tasks-tag-pill" style={{ backgroundColor: '#dbeafe' }}>
                {order.status}
              </span>
            </span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">

          <div>
            <PageHeader title="Tasks Board" subtitle="Manage and track your tasks" />
          </div>
          
          <div className="page-content">
            {!user ? (
              <p className="page-subtitle">Log in to view and manage tasks.</p>
            ) : error ? (
              <p className="create-order-error" role="alert">{error}</p>
            ) : loading ? (
              <p className="page-subtitle">Loading tasks…</p>
            ) : (
              <>
                <div className="page-toolbar">
                  <input
                    type="text"
                    className="page-toolbar-search"
                    placeholder="Search by task name or task number (#123)..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    aria-label="Search tasks"
                  />
                  <button type="button" className="page-toolbar-btn" onClick={handleAddTask}>
                    +&nbsp; Add Task
                  </button>
                </div>
                {searchActive && (
                  <div className="tasks-search-results-section">
                    <table className="tasks-search-results-table">
                      <thead>
                        <tr>
                          <th>Task #</th>
                          <th>Task Name</th>
                          <th>Section</th>
                          <th>Status</th>
                          <th>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.length === 0 ? (
                          <tr>
                            <td colSpan={5} data-label="">No tasks match your search</td>
                          </tr>
                        ) : (
                          searchResults.map(({ task, section }) => (
                            <tr
                              key={task.id}
                              onClick={() => handleTaskClick(task.id)}
                              className="tasks-search-result-row"
                            >
                              <td data-label="Task #">#{task.id}</td>
                              <td data-label="Task Name">{task.name}</td>
                              <td data-label="Section">{section}</td>
                              <td data-label="Status">{task.status}</td>
                              <td data-label="Priority">{task.priority ?? '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {dragError && (
                  <p className="tasks-drag-error" role="alert">{dragError}</p>
                )}

                <div className="tasks-board-cards">
                  <div
                    className={`tasks-board-card${dragOverColumn === 'todo' ? ' tasks-board-card--drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'todo')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'todo')}
                  >
                    <h3 className="tasks-card-title">To-Do:</h3>
                    {todo.length > 0 || todoOrders.length > 0 ? (
                      <>
                        {todo.length > 0 && renderTaskList(todo, 'todo')}
                        {todo.length > 0 && todoOrders.length > 0 && <div className="tasks-board-divider" />}
                        {todoOrders.length > 0 && renderOrderList(todoOrders)}
                      </>
                    ) : (
                      <p className="tasks-empty-hint">Drop tasks here or no tasks</p>
                    )}
                  </div>
                  <div
                    className={`tasks-board-card${dragOverColumn === 'inProgress' ? ' tasks-board-card--drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'inProgress')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'inProgress')}
                  >
                    <h3 className="tasks-card-title">In Progress:</h3>
                    {inProgress.length > 0 || inProgressOrders.length > 0 ? (
                      <>
                        {inProgress.length > 0 && renderTaskList(inProgress, 'inProgress')}
                        {inProgress.length > 0 && inProgressOrders.length > 0 && <div className="tasks-board-divider" />}
                        {inProgressOrders.length > 0 && renderOrderList(inProgressOrders)}
                      </>
                    ) : (
                      <p className="tasks-empty-hint">Drop tasks here or no tasks</p>
                    )}
                  </div>
                  <div
                    className={`tasks-board-card${dragOverColumn === 'unassigned' ? ' tasks-board-card--drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'unassigned')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'unassigned')}
                  >
                    <h3 className="tasks-card-title">Unassigned Tasks:</h3>
                    {renderTaskList(unassigned, 'unassigned')}
                  </div>
                </div>

                <div className="assigned-companies-section">
                  <h3 className="assigned-companies-title">Assigned Companies</h3>
                  <p className="page-subtitle" style={{ marginBottom: '0.75rem' }}>
                    Clients assigned to you
                  </p>
                  <table className="assigned-companies-table">
                    <thead>
                      <tr>
                        <th>Company Name</th>
                        <th>Employee</th>
                        <th>Point of Contact</th>
                        <th>Product</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedCompanies.length === 0 ? (
                        <tr>
                          <td colSpan={4} data-label="">No clients assigned to you</td>
                        </tr>
                      ) : (
                        assignedCompanies.map((client) => (
                          <tr
                            key={client.id}
                            onClick={() => handleClientClick(client.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td data-label="Company">{client.company}</td>
                            <td data-label="Employee">{client.employee_name ?? '—'}</td>
                            <td data-label="Point of Contact">{client.point_of_contact}</td>
                            <td data-label="Product">{client.product ?? '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="completed-tasks-section">
                  <h3 className="completed-tasks-title">Completed Tasks</h3>
                  <p className="page-subtitle" style={{ marginBottom: '0.75rem' }}>
                    Tasks assigned to you with status Completed
                  </p>
                  <table className="completed-tasks-table">
                    <thead>
                      <tr>
                        <th>Task #</th>
                        <th>Task Name</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completed.length === 0 ? (
                        <tr>
                          <td colSpan={3} data-label="">No completed tasks</td>
                        </tr>
                      ) : (
                        completed.map((task) => (
                          <tr
                            key={task.id}
                            onClick={() => handleTaskClick(task.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td data-label="Task #">#{task.id}</td>
                            <td data-label="Task Name">{task.name}</td>
                            <td data-label="Priority">{task.priority ?? '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        title="Add New Task"
        wide
      >
        <AddTaskForm onClose={() => setAddTaskModalOpen(false)} />
      </Modal>

      {/* Confirm assign modal: shown when dropping an unassigned task onto To-Do or In Progress */}
      <Modal
        isOpen={assigneeModalOpen}
        onClose={handleCancelAssign}
        title="Assign Task?"
        narrow
      >
        <div className="tasks-modal-body">
          <p className="tasks-modal-desc">
            Moving <strong>{draggedTask?.name}</strong> to{' '}
            <strong>{pendingDropTarget === 'todo' ? 'To-Do' : 'In Progress'}</strong> will assign this task to you ({user?.username}).
          </p>
          <div className="tasks-modal-actions">
            <button type="button" className="tasks-modal-btn tasks-modal-btn--secondary" onClick={handleCancelAssign}>
              Cancel
            </button>
            <button type="button" className="tasks-modal-btn tasks-modal-btn--primary" onClick={handleConfirmAssign}>
              Assign to Me &amp; Move
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm unassign modal: shown when dropping a task back onto Unassigned */}
      <Modal
        isOpen={confirmUnassignOpen}
        onClose={handleCancelUnassign}
        title="Unassign Task?"
        narrow
      >
        <div className="tasks-modal-body">
          <p className="tasks-modal-desc">
            Moving <strong>{draggedTask?.name}</strong> back to <strong>Unassigned</strong> will unassign this task from you ({user?.username}).
          </p>
          <div className="tasks-modal-actions">
            <button type="button" className="tasks-modal-btn tasks-modal-btn--secondary" onClick={handleCancelUnassign}>
              Cancel
            </button>
            <button type="button" className="tasks-modal-btn tasks-modal-btn--danger" onClick={handleConfirmUnassign}>
              Unassign &amp; Move
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksBoard;
