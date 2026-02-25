import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { fetchTasks, type TaskRow } from '../api/tasks';
import { fetchClients, type ClientRow } from '../api/clients';
import { fetchOrdersForUser, type OrderRow } from '../api/orderApi';
import './Page.css';
import './TasksBoard.css';

const TAG_PILL_COLORS: Record<string, string> = {
  admin: '#fecaca',
  accounting: '#bbf7d0',
  sales: '#bfdbfe',
  marketing: '#fde68a',
  engineers: '#ddd6fe',
  installation: '#fed7aa',
  logistics: '#a5f3fc',
  corporate: '#fbcfe8',
  r_d: '#d1fae5',
  support: '#e0e7ff',
  customer_service: '#fef3c7',
  it: '#c7d2fe',
  operations: '#fcd5b0',
  finances: '#b8e0d2',
  manufacturing: '#e9d5ff',
  hr: '#fed7e2',
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
    navigate('/tasks/add');
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

  const renderTaskList = (tasks: TaskRow[]) => (
    <div className="tasks-card-content">
      {tasks.length === 0 ? (
        <p className="tasks-empty-hint">No tasks</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className="clickable-item tasks-board-item"
            onClick={() => handleTaskClick(task.id)}
          >
            <span className="tasks-item-name">
              {task.name} <span className="tasks-item-id">#{task.id}</span>
            </span>
            {task.tags?.length > 0 && (
              <span className="tasks-item-tags">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="tasks-tag-pill"
                    style={{ backgroundColor: TAG_PILL_COLORS[tag] ?? '#e5e7eb' }}
                  >
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </span>
            )}
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
              <span className="tasks-tag-pill" style={{ backgroundColor: '#e0e7ff' }} title="Stage">
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
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Tasks Board</h2>
            <p className="page-subtitle">Manage and track your tasks</p>

            {!user ? (
              <p className="page-subtitle">Log in to view and manage tasks.</p>
            ) : error ? (
              <p className="create-order-error" role="alert">{error}</p>
            ) : loading ? (
              <p className="page-subtitle">Loading tasks…</p>
            ) : (
              <>
                <div className="tasks-search-row">
                  <input
                    type="text"
                    className="tasks-search-input"
                    placeholder="Search by task name or task number (#123)..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    aria-label="Search tasks"
                  />
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
                            <td colSpan={5}>No tasks match your search</td>
                          </tr>
                        ) : (
                          searchResults.map(({ task, section }) => (
                            <tr
                              key={task.id}
                              onClick={() => handleTaskClick(task.id)}
                              className="tasks-search-result-row"
                            >
                              <td>#{task.id}</td>
                              <td>{task.name}</td>
                              <td>{section}</td>
                              <td>{task.status}</td>
                              <td>{task.priority ?? '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="tasks-board-cards">
                  <div className="tasks-board-card">
                    <h3 className="tasks-card-title">To-Do:</h3>
                    {todo.length > 0 || todoOrders.length > 0 ? (
                      <>
                        {todo.length > 0 && renderTaskList(todo)}
                        {todo.length > 0 && todoOrders.length > 0 && <div className="tasks-board-divider" />}
                        {todoOrders.length > 0 && renderOrderList(todoOrders)}
                      </>
                    ) : (
                      <p className="tasks-empty-hint">No tasks or orders</p>
                    )}
                  </div>
                  <div className="tasks-board-card">
                    <h3 className="tasks-card-title">In Progress:</h3>
                    {inProgress.length > 0 || inProgressOrders.length > 0 ? (
                      <>
                        {inProgress.length > 0 && renderTaskList(inProgress)}
                        {inProgress.length > 0 && inProgressOrders.length > 0 && <div className="tasks-board-divider" />}
                        {inProgressOrders.length > 0 && renderOrderList(inProgressOrders)}
                      </>
                    ) : (
                      <p className="tasks-empty-hint">No tasks or orders</p>
                    )}
                  </div>
                  <div className="tasks-board-card">
                    <h3 className="tasks-card-title">Unassigned Tasks:</h3>
                    {renderTaskList(unassigned)}
                  </div>
                </div>

                <div className="tasks-board-button-row">
                  <button type="button" className="add-task-button" onClick={handleAddTask}>
                    + Add New Task
                  </button>
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
                          <td colSpan={4}>No clients assigned to you</td>
                        </tr>
                      ) : (
                        assignedCompanies.map((client) => (
                          <tr
                            key={client.id}
                            onClick={() => handleClientClick(client.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{client.company}</td>
                            <td>{client.employee_name ?? '—'}</td>
                            <td>{client.point_of_contact}</td>
                            <td>{client.product ?? '—'}</td>
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
                          <td colSpan={3}>No completed tasks</td>
                        </tr>
                      ) : (
                        completed.map((task) => (
                          <tr
                            key={task.id}
                            onClick={() => handleTaskClick(task.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>#{task.id}</td>
                            <td>{task.name}</td>
                            <td>{task.priority ?? '—'}</td>
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
    </div>
  );
};

export default TasksBoard;
