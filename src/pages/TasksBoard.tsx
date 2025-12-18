import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { tasks } from '../data/tasks';
import { clients } from '../data/clients';
import './Page.css';
import './TasksBoard.css';

const TasksBoard: React.FC = () => {
  const navigate = useNavigate();

  const handleAddTask = () => {
    navigate('/tasks/add');
  };

  const handleTaskClick = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleClientClick = (clientId: number) => {
    navigate(`/client/${clientId}`);
  };

  const todoTasks = tasks.filter(task => task.status === 'Unassigned' && [1, 2, 3, 4].includes(task.id));
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress');
  const unassignedTasks = tasks.filter(task => task.status === 'Unassigned' && [9, 10, 11, 12].includes(task.id));
  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Tasks Board</h2>
            <p className="page-subtitle">Manage and track your tasks</p>
            
            <div className="tasks-board-cards">
              <div className="tasks-board-card">
                <h3 className="tasks-card-title">To-Do:</h3>
                <div className="tasks-card-content">
                  {todoTasks.map((task) => (
                    <div key={task.id} className="clickable-item" onClick={() => handleTaskClick(task.id)}>
                      {task.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="tasks-board-card">
                <h3 className="tasks-card-title">In Progress:</h3>
                <div className="tasks-card-content">
                  {inProgressTasks.map((task) => (
                    <div key={task.id} className="clickable-item" onClick={() => handleTaskClick(task.id)}>
                      {task.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="tasks-board-card">
                <h3 className="tasks-card-title">Unassigned Tasks:</h3>
                <div className="tasks-card-content">
                  {unassignedTasks.map((task) => (
                    <div key={task.id} className="clickable-item" onClick={() => handleTaskClick(task.id)}>
                      {task.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="tasks-board-button-row">
              <button className="add-task-button" onClick={handleAddTask}>+Add New Task</button>
            </div>

            <div className="assigned-companies-section">
              <h3 className="assigned-companies-title">Assigned Companies</h3>
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
                  {clients.map((client) => (
                    <tr 
                      key={client.id}
                      onClick={() => handleClientClick(client.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{client.company}</td>
                      <td>{client.employee}</td>
                      <td>{client.pointOfContact}</td>
                      <td>{client.product}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TasksBoard;


