import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Pending from '../components/Pending';
import SalesChart from '../components/SalesChart';
import PieChart from '../components/PieChart';
import { fetchClients, type ClientRow } from '../api/clients';
import { fetchTasks, type TaskRow } from '../api/tasks';
import { fetchSalesProductCounts, fetchSiteActivity, type SalesProductCounts, type SiteActivityEntry } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
import { leads as staticLeads } from '../data/leads';
import { getRobotFleetStats } from '../data/inventory';
import './Dashboard.css';

const STATUS_PILL_COLORS: Record<string, string> = {
  Unassigned: '#e5e7eb',
  'To-Do': '#bfdbfe',
  'In Progress': '#fde68a',
  Completed: '#bbf7d0',
};

const PRIORITY_PILL_COLORS: Record<string, string> = {
  Low: '#d1fae5',
  Medium: '#fef3c7',
  High: '#fed7aa',
  Urgent: '#fecaca',
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiLeads, setApiLeads] = useState<ClientRow[]>([]);
  const [useFallback, setUseFallback] = useState(false);
  const [dashboardTasks, setDashboardTasks] = useState<TaskRow[]>([]);
  const [salesData, setSalesData] = useState<SalesProductCounts | null>(null);
  const [siteActivity, setSiteActivity] = useState<SiteActivityEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchClients('lead')
      .then((leads) => {
        if (!cancelled) {
          setApiLeads(leads);
          setUseFallback(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiLeads([]);
          setUseFallback(true);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const leadsList = useFallback ? staticLeads : apiLeads;

  const handleTaskClick = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleLeadClick = (leadId: number) => {
    navigate(`/lead/${leadId}`);
  };

  useEffect(() => {
    if (!user?.id) {
      setDashboardTasks([]);
      return;
    }
    let cancelled = false;
    fetchTasks(user.id)
      .then((sections) => {
        if (!cancelled) setDashboardTasks([...sections.todo, ...sections.inProgress]);
      })
      .catch(() => {
        if (!cancelled) setDashboardTasks([]);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    fetchSalesProductCounts()
      .then((data) => {
        if (!cancelled) setSalesData(data);
      })
      .catch(() => {
        if (!cancelled) setSalesData(null);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSiteActivity(50)
      .then((entries) => {
        if (!cancelled) setSiteActivity(entries);
      })
      .catch(() => {
        if (!cancelled) setSiteActivity([]);
      });
    return () => { cancelled = true; };
  }, []);

  // Sales chart data from completed orders (TIM-E Bot, BIM-E), or fallback zeros
  const defaultSalesPeriod = {
    productData: [
      { product: 'TIM-E Bot', sales: 0 },
      { product: 'BIM-E', sales: 0 },
    ],
    totalData: [{ date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), total: 0 }],
  };
  const salesProductData = salesData
    ? {
        '1month': salesData['1month'].productData,
        '3months': salesData['3months'].productData,
        '6months': salesData['6months'].productData,
        '1year': salesData['1year'].productData,
      }
    : {
        '1month': defaultSalesPeriod.productData,
        '3months': defaultSalesPeriod.productData,
        '6months': defaultSalesPeriod.productData,
        '1year': defaultSalesPeriod.productData,
      };
  const salesTotalData = salesData
    ? {
        '1month': salesData['1month'].totalData,
        '3months': salesData['3months'].totalData,
        '6months': salesData['6months'].totalData,
        '1year': salesData['1year'].totalData,
      }
    : {
        '1month': defaultSalesPeriod.totalData,
        '3months': defaultSalesPeriod.totalData,
        '6months': defaultSalesPeriod.totalData,
        '1year': defaultSalesPeriod.totalData,
      };
  
  const robotStats = getRobotFleetStats();
  const robotsData = [
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

  const formatActivityTime = (createdAt: string) => {
    try {
      const d = new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour(s) ago`;
      if (diffDays < 7) return `${diffDays} day(s) ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return createdAt;
    }
  };

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="dashboard-content">
            <h2 className="dashboard-title">Dashboard</h2>
            <p className="dashboard-subtitle">Welcome to TechForce Robotics Company Portal</p>
            
            <div className="dashboard-charts-row">
              <div className="dashboard-chart-card">
                <Pending />
              </div>
              <div className="dashboard-chart-card">
                <SalesChart productData={salesProductData} totalData={salesTotalData} />
              </div>
              <div className="dashboard-chart-card">
                <h3 className="chart-title">Robots Online</h3>
                <div className="robots-chart-wrapper">
                  <PieChart data={robotsData} size={150} />
                </div>
              </div>
            </div>
            
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3 className="card-title" style={{ cursor: 'pointer' }} onClick={() => navigate('/client')}>Leads</h3>
                <div className="card-content">
                  {leadsList.map((lead) => (
                    <div 
                      key={lead.id} 
                      className="clickable-item" 
                      onClick={() => handleLeadClick(lead.id)}
                    >
                      {useFallback ? (lead as { companyName: string }).companyName : (lead as ClientRow).company}
                    </div>
                  ))}
                </div>
              </div>
              <div className="dashboard-card">
                <h3 className="card-title" style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>Tasks</h3>
                <div className="card-content">
                  {dashboardTasks.length === 0 ? (
                    <p className="page-subtitle" style={{ margin: 0 }}>No tasks assigned to you</p>
                  ) : (
                    dashboardTasks.map((task) => (
                      <div key={task.id} className="clickable-item dashboard-task-item" onClick={() => handleTaskClick(task.id)}>
                        <span className="dashboard-task-name">{task.name}</span>
                        <div className="dashboard-task-pills">
                          <span
                            className="dashboard-pill"
                            style={{ backgroundColor: STATUS_PILL_COLORS[task.status] ?? '#e5e7eb' }}
                          >
                            {task.status}
                          </span>
                          {task.priority && (
                            <span
                              className="dashboard-pill"
                              style={{ backgroundColor: PRIORITY_PILL_COLORS[task.priority] ?? '#e5e7eb' }}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="activity-log-section">
              <h3 className="activity-log-title">Activity Log</h3>
              <div className="activity-log-content">
                <div className="activity-log-list">
                  {siteActivity.length === 0 ? (
                    <p className="activity-log-empty">No activity recorded yet.</p>
                  ) : (
                    siteActivity.map((entry) => (
                      <div key={entry.id} className="activity-log-item">
                        <span className="activity-log-time">[{formatActivityTime(entry.created_at)}]</span>{' '}
                        {entry.action}
                        {entry.user && entry.user !== 'System' && (
                          <span className="activity-log-user"> — {entry.user}</span>
                        )}
                      </div>
                    ))
                  )}
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


