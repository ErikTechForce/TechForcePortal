import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import PieChart from '../components/PieChart';
import { getRobotFleetStats } from '../data/inventory';
import './Page.css';
import './Robots.css';

const Robots: React.FC = () => {
  const [robotSearch, setRobotSearch] = useState('');
  const robotStats = getRobotFleetStats();

  const total = robotStats.deployed + robotStats.inStorage + robotStats.needsMaintenance;
  
  const pieChartData = [
    {
      label: 'Deployed',
      value: robotStats.deployed,
      color: '#73BF43'
    },
    {
      label: 'In Storage',
      value: robotStats.inStorage,
      color: '#8A8F93'
    },
    {
      label: 'In Need of Maintenance',
      value: robotStats.needsMaintenance,
      color: '#E48B52'
    }
  ];

  const deployedPercentage = total > 0 ? Math.round((robotStats.deployed / total) * 100) : 0;
  const inStoragePercentage = total > 0 ? Math.round((robotStats.inStorage / total) * 100) : 0;
  const needsMaintenancePercentage = total > 0 ? Math.round((robotStats.needsMaintenance / total) * 100) : 0;

  return (
    <div className="page-container">
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          
          <div>
            <PageHeader title="Robots" subtitle="Manage robot fleet and configurations" />
          </div>

          <div className="page-content">

            <div className="page-toolbar">
              <input
                type="text"
                className="page-toolbar-search"
                placeholder="Search robots..."
                value={robotSearch}
                onChange={(e) => setRobotSearch(e.target.value)}
                aria-label="Search robots"
              />
            </div>

            <div className="robots-grid">

              {/* div1 — Pie chart */}
              <div className="robots-grid-div1">
                <PieChart data={pieChartData} size={290} />
              </div>

              {/* div2 — Robot Status */}
              <div className="robots-grid-div2 robots-stats-card">
                <h3 className="robots-stats-title">Robot Status</h3>
                <div className="robots-stats-body">
                  <div className="robots-stats-item">
                    <span className="robots-stats-indicator robots-stats-indicator-online"></span>
                    <span className="robots-stats-percentage">{deployedPercentage}%</span>
                    <span className="robots-stats-label">({robotStats.deployed} Deployed)</span>
                  </div>
                  <div className="robots-stats-item">
                    <span className="robots-stats-indicator robots-stats-indicator-service"></span>
                    <span className="robots-stats-percentage">{needsMaintenancePercentage}%</span>
                    <span className="robots-stats-label">({robotStats.needsMaintenance} In Need of Maintenance)</span>
                  </div>
                  <div className="robots-stats-item">
                    <span className="robots-stats-indicator robots-stats-indicator-offline"></span>
                    <span className="robots-stats-percentage">{inStoragePercentage}%</span>
                    <span className="robots-stats-label">({robotStats.inStorage} In Storage)</span>
                  </div>
                </div>
              </div>

              {/* div3 — Alerts */}
              <div className="robots-grid-div3 alerts-section">
                <h3 className="alerts-title">Alerts</h3>
                <div className="alerts-body">
                  <p className="alerts-empty">No alerts</p>
                </div>
              </div>

              {/* div4 — Activity Log */}
              <div className="robots-grid-div4 activity-log-section">
                <h3 className="activity-log-title">Activity Log</h3>
                <div className="activity-log-body">
                  <p className="activity-log-empty">No recent activity</p>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Robots;



