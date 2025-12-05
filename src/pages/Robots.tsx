import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PieChart from '../components/PieChart';
import './Page.css';
import './Robots.css';

interface RobotStats {
  online: number;
  offline: number;
  needsService: number;
}

const Robots: React.FC = () => {
  // Placeholder data - will be replaced with actual data
  const [robotStats] = useState<RobotStats>({
    online: 13,
    offline: 5,
    needsService: 2
  });

  const total = robotStats.online + robotStats.offline + robotStats.needsService;
  
  const pieChartData = [
    {
      label: 'Online',
      value: robotStats.online,
      color: '#4ade80'
    },
    {
      label: 'Offline',
      value: robotStats.offline,
      color: '#6b7280'
    },
    {
      label: 'Needs Service',
      value: robotStats.needsService,
      color: '#dc2626'
    }
  ];

  const onlinePercentage = total > 0 ? Math.round((robotStats.online / total) * 100) : 0;
  const offlinePercentage = total > 0 ? Math.round((robotStats.offline / total) * 100) : 0;
  const needsServicePercentage = total > 0 ? Math.round((robotStats.needsService / total) * 100) : 0;

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
                  <span className="robots-stats-percentage">{onlinePercentage}%</span>
                  <span className="robots-stats-label">({robotStats.online} Online)</span>
                </div>
                <div className="robots-stats-item">
                  <span className="robots-stats-indicator robots-stats-indicator-offline"></span>
                  <span className="robots-stats-percentage">{offlinePercentage}%</span>
                  <span className="robots-stats-label">({robotStats.offline} Offline)</span>
                </div>
                <div className="robots-stats-item">
                  <span className="robots-stats-indicator robots-stats-indicator-service"></span>
                  <span className="robots-stats-percentage">{needsServicePercentage}%</span>
                  <span className="robots-stats-label">({robotStats.needsService} In Need of Service)</span>
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



