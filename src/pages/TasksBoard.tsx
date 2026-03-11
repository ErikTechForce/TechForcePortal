import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import AddTaskForm from './AddTask';
import { useAuth } from '../context/AuthContext';
import { fetchTasks, fetchAllTasks, updateTask, type TaskRow } from '../api/tasks';
import { fetchClients, type ClientRow } from '../api/clients';
import { fetchOrdersForUser, type OrderRow } from '../api/orderApi';
import { TAG_PILL_COLORS, ROLE_LABELS as TAG_LABELS } from '../constants/taskTags';
import './Page.css';
import './TasksBoard.css';

const STATUS_PILL_COLORS: Record<string, string> = {
  Unassigned: '#e5e7eb',
  'To-Do': '#bfdbfe',
  'In Progress': '#fde68a',
  Completed: '#bbf7d0',
};

const PRIORITY_PILL_COLORS: Record<string, string> = {
  Low: '#73BF4380',
  Medium: '#FFC10780',
  High: '#E48B5280',
  Urgent: '#ef444480',
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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    assignedCompanies: false,
    completedTasks: false,
    allTasks: false,
  });
  const toggleSection = (key: string) =>
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

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
  const [allTasks, setAllTasks] = useState<TaskRow[]>([]);

  // All Tasks column filters
  const [allTasksFilters, setAllTasksFilters] = useState<Record<string, string[]>>({
    status: [], priority: [], tags: [], assigned_to: [], company: [],
  });
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [filterDropdownPos, setFilterDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const toggleFilterValue = (col: string, value: string) =>
    setAllTasksFilters((prev) => {
      const cur = prev[col];
      return { ...prev, [col]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });

  const allTasksUniqueValues = useMemo(() => ({
    status: Array.from(new Set(allTasks.map((t) => t.status))).sort(),
    priority: Array.from(new Set(allTasks.map((t) => t.priority ?? '—'))).filter(Boolean).sort(),
    tags: Array.from(new Set(allTasks.flatMap((t) => t.tags ?? []))).sort(),
    assigned_to: Array.from(new Set(allTasks.map((t) => t.assigned_to_name ?? '—'))).sort(),
    company: Array.from(new Set(allTasks.map((t) => t.client_company ?? '—'))).sort(),
  }), [allTasks]);

  const filteredAllTasks = useMemo(() => {
    const { status, priority, tags, assigned_to, company } = allTasksFilters;
    return allTasks.filter((task) => {
      if (status.length > 0 && !status.includes(task.status)) return false;
      if (priority.length > 0 && !priority.includes(task.priority ?? '—')) return false;
      if (tags.length > 0 && !tags.some((t) => (task.tags ?? []).includes(t))) return false;
      if (assigned_to.length > 0 && !assigned_to.includes(task.assigned_to_name ?? '—')) return false;
      if (company.length > 0 && !company.includes(task.client_company ?? '—')) return false;
      return true;
    });
  }, [allTasks, allTasksFilters]);

  const handleFilterBtnClick = (col: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (openFilterCol === col) {
      setOpenFilterCol(null);
      setFilterDropdownPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterDropdownPos({ top: rect.bottom + 6, left: rect.left });
    setOpenFilterCol(col);
  };

  const isAdmin = Array.isArray(user?.roles) && user!.roles.includes('admin');

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

  useEffect(() => {
    if (!isAdmin || !user?.id) {
      setAllTasks([]);
      return;
    }
    let cancelled = false;
    fetchAllTasks(user.id)
      .then((list) => {
        if (!cancelled) setAllTasks(list);
      })
      .catch(() => {
        if (!cancelled) setAllTasks([]);
      });
    return () => { cancelled = true; };
  }, [isAdmin, user?.id]);

  useEffect(() => {
    if (!openFilterCol) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.all-tasks-filter-btn') && !target.closest('.all-tasks-filter-dropdown')) {
        setOpenFilterCol(null);
        setFilterDropdownPos(null);
      }
    };
    const closeOnScroll = (e: Event) => {
      if ((e.target as Element)?.closest?.('.all-tasks-filter-dropdown')) return;
      setOpenFilterCol(null);
      setFilterDropdownPos(null);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [openFilterCol]);

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
                {task.name}
                {task.priority && (
                  <span
                    className="tasks-tag-pill"
                    style={{ backgroundColor: PRIORITY_PILL_COLORS[task.priority] ?? '#e5e7eb' }}
                  >
                    {task.priority}
                  </span>
                )}
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

                <h3 className="completed-tasks-title">Your Task Board</h3>
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

                <div className="completed-tasks-section">
                  <div className="collapsible-header" onClick={() => toggleSection('completedTasks')}>
                    <h3 className="completed-tasks-title">Your Completed Tasks</h3>
                    <span className={`collapse-arrow${!collapsedSections.completedTasks ? ' collapse-arrow--open' : ''}`}>▶</span>
                  </div>
                  {!collapsedSections.completedTasks && <>
                  <div className="collapsible-table-wrapper"><table className="completed-tasks-table">
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
                            <td data-label="Priority">
                              {task.priority ? (
                                <span
                                  className="tasks-tag-pill"
                                  style={{ backgroundColor: PRIORITY_PILL_COLORS[task.priority] ?? '#e5e7eb' }}
                                >
                                  {task.priority}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table></div>
                  </>}
                </div>

                {isAdmin && (
                  <div className="all-tasks-section">
                    <div className="collapsible-header" onClick={() => toggleSection('allTasks')}>
                      <h3 className="all-tasks-title">All Tasks</h3>
                      <span className={`collapse-arrow${!collapsedSections.allTasks ? ' collapse-arrow--open' : ''}`}>▶</span>
                    </div>
                    {!collapsedSections.allTasks && (
                      <div className="collapsible-table-wrapper">
                        <table className="all-tasks-table">
                          <thead>
                            <tr>
                              <th>Task</th>
                              {(['status', 'priority', 'tags', 'assigned_to', 'company'] as const).map((col) => {
                                const labels: Record<string, string> = { status: 'Status', priority: 'Priority', tags: 'Roles', assigned_to: 'Assigned to', company: 'Company' };
                                const isActive = allTasksFilters[col].length > 0;
                                return (
                                  <th key={col}>
                                    <div className="all-tasks-th-content">
                                      {labels[col]}
                                      <button
                                        className={`all-tasks-filter-btn${isActive ? ' active' : ''}`}
                                        onClick={(e) => handleFilterBtnClick(col, e)}
                                        title={`Filter by ${labels[col]}`}
                                      >
                                        ▾
                                      </button>
                                    </div>
                                  </th>
                                );
                              })}
                              <th>Due date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAllTasks.length === 0 ? (
                              <tr>
                                <td colSpan={7} data-label="">
                                  {allTasks.length === 0 ? 'No tasks.' : 'No tasks match the current filters.'}
                                </td>
                              </tr>
                            ) : (
                              filteredAllTasks.map((task) => (
                                <tr key={task.id} className="all-tasks-row" onClick={() => handleTaskClick(task.id)}>
                                  <td data-label="Task">{task.name}</td>
                                  <td data-label="Status">
                                    <span
                                      className="dashboard-pill"
                                      style={{ backgroundColor: STATUS_PILL_COLORS[task.status] ?? '#e5e7eb' }}
                                    >
                                      {task.status}
                                    </span>
                                  </td>
                                  <td data-label="Priority">
                                    {task.priority ? (
                                      <span
                                        className="dashboard-pill"
                                        style={{ backgroundColor: PRIORITY_PILL_COLORS[task.priority] ?? '#e5e7eb' }}
                                      >
                                        {task.priority}
                                      </span>
                                    ) : '—'}
                                  </td>
                                  <td data-label="Roles">
                                    <div className="dashboard-admin-tasks-tags">
                                      {(task.tags?.length ? task.tags : []).map((tag) => (
                                        <span
                                          key={tag}
                                          className="dashboard-pill"
                                          style={{ backgroundColor: TAG_PILL_COLORS[tag] ?? '#e5e7eb' }}
                                        >
                                          {TAG_LABELS[tag] ?? tag.replace(/_/g, ' ')}
                                        </span>
                                      ))}
                                      {(!task.tags || task.tags.length === 0) && '—'}
                                    </div>
                                  </td>
                                  <td data-label="Assigned to">{task.assigned_to_name ?? '—'}</td>
                                  <td data-label="Company">{task.client_company ?? '—'}</td>
                                  <td data-label="Due date">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="assigned-companies-section">
                  <div className="collapsible-header" onClick={() => toggleSection('assignedCompanies')}>
                    <h3 className="assigned-companies-title">Assigned Companies</h3>
                    <span className={`collapse-arrow${!collapsedSections.assignedCompanies ? ' collapse-arrow--open' : ''}`}>▶</span>
                  </div>
                  {!collapsedSections.assignedCompanies && <>
                  <div className="collapsible-table-wrapper"><table className="assigned-companies-table">
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
                  </table></div>
                  </>}
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

      {/* All Tasks column filter dropdown (fixed, escapes table overflow) */}
      {openFilterCol && filterDropdownPos && (() => {
        const col = openFilterCol;
        const vals = allTasksUniqueValues[col as keyof typeof allTasksUniqueValues] ?? [];
        const active = allTasksFilters[col] ?? [];
        return (
          <div
            className="all-tasks-filter-dropdown"
            style={{ top: filterDropdownPos.top, left: filterDropdownPos.left }}
          >
            {vals.length === 0 && <span className="all-tasks-filter-empty">No options</span>}
            {vals.map((val) => (
              <label key={val} className="all-tasks-filter-option">
                <input
                  type="checkbox"
                  checked={active.includes(val)}
                  onChange={() => toggleFilterValue(col, val)}
                />
                {col === 'tags' ? (TAG_LABELS[val] ?? val.replace(/_/g, ' ')) : val}
              </label>
            ))}
            {active.length > 0 && (
              <button
                className="all-tasks-filter-clear"
                onClick={() => setAllTasksFilters((p) => ({ ...p, [col]: [] }))}
              >
                Clear filter
              </button>
            )}
          </div>
        );
      })()}

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
