import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { tasks } from '../data/tasks';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleTaskClick = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  const dashboardTasks = tasks.filter(task => task.status === 'In Progress');
  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="dashboard-content">
            <h2 className="dashboard-title">Dashboard</h2>
            <p className="dashboard-subtitle">Welcome to TechForce Robotics Company Portal</p>
            
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3 className="card-title">Leads</h3>
                <div className="card-content">
                  <div className="clickable-item" onClick={(e) => e.preventDefault()}>
                    Acme Corporation
                  </div>
                  <div className="clickable-item" onClick={(e) => e.preventDefault()}>
                    TechSolutions Inc.
                  </div>
                  <div className="clickable-item" onClick={(e) => e.preventDefault()}>
                    Global Industries Ltd.
                  </div>
                </div>
              </div>
              <div className="dashboard-card">
                <h3 className="card-title">Tasks</h3>
                <div className="card-content">
                  {dashboardTasks.map((task) => (
                    <div key={task.id} className="clickable-item" onClick={() => handleTaskClick(task.id)}>
                      {task.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="dashboard-card">
                <h3 className="card-title">Feed</h3>
              </div>
            </div>

            <div className="activity-log-section">
              <h3 className="activity-log-title">Activity Log</h3>
              <div className="activity-log-content">
                <div className="activity-log-list">
                  <div className="activity-log-item">[16:10] Lisa Anderson has completed Client onboarding process.</div>
                  <div className="activity-log-item">[14:55] David Wilson has completed Prepare quarterly report.</div>
                  <div className="activity-log-item">[13:20] Emily Davis has completed Follow up with Acme Corporation.</div>
                  <div className="activity-log-item">[11:30] Michael Chen has completed Schedule team meeting.</div>
                  <div className="activity-log-item">[10:42] Sarah Johnson has completed Update project documentation.</div>
                  <div className="activity-log-item">[09:15] John Smith has completed Review client proposal.</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;


