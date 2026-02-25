import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PieChart from '../components/PieChart';
import { getRobotFleetStats } from '../data/inventory';
import './Page.css';
import './Robots.css';

const Robots: React.FC = () => {
  const robotStats = getRobotFleetStats();

  const total = robotStats.deployed + robotStats.inStorage + robotStats.needsMaintenance;
  
  const pieChartData = [
    {
      label: 'Deployed',
      value: robotStats.deployed,
      color: '#4ade80'
    },
    {
      label: 'In Storage',
      value: robotStats.inStorage,
      color: '#6b7280'
    },
    {
      label: 'In Need of Maintenance',
      value: robotStats.needsMaintenance,
      color: '#dc2626'
    }
  ];

  const deployedPercentage = total > 0 ? Math.round((robotStats.deployed / total) * 100) : 0;
  const inStoragePercentage = total > 0 ? Math.round((robotStats.inStorage / total) * 100) : 0;
  const needsMaintenancePercentage = total > 0 ? Math.round((robotStats.needsMaintenance / total) * 100) : 0;

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Robots</h2>
            <p className="page-subtitle">Manage robot fleet and configurations</p>
            
            <div className="robots-stats-row">
              <div className="pie-chart-wrapper">
                <PieChart data={pieChartData} size={250} />
              </div>
              
              <div className="robots-stats-card">
                <h3 className="robots-stats-title">Robot Status</h3>
                <div className="robots-stats-item">
                  <span className="robots-stats-indicator robots-stats-indicator-online"></span>
                  <span className="robots-stats-percentage">{deployedPercentage}%</span>
                  <span className="robots-stats-label">({robotStats.deployed} Deployed)</span>
                </div>
                <div className="robots-stats-item">
                  <span className="robots-stats-indicator robots-stats-indicator-offline"></span>
                  <span className="robots-stats-percentage">{inStoragePercentage}%</span>
                  <span className="robots-stats-label">({robotStats.inStorage} In Storage)</span>
                </div>
                <div className="robots-stats-item">
                  <span className="robots-stats-indicator robots-stats-indicator-service"></span>
                  <span className="robots-stats-percentage">{needsMaintenancePercentage}%</span>
                  <span className="robots-stats-label">({robotStats.needsMaintenance} In Need of Maintenance)</span>
                </div>
              </div>
            </div>

            <div className="alerts-section">
              <h3 className="alerts-title">Alerts</h3>
              <div className="alerts-content">
                <p className="alerts-empty">No alerts</p>
              </div>
            </div>

            <div className="activity-log-section">
              <h3 className="activity-log-title">Activity Log</h3>
              <div className="activity-log-content">
                <p className="activity-log-empty">No recent activity</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Robots;



