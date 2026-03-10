import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Pending from '../components/Pending';
import SalesChart from '../components/SalesChart';
import PieChart from '../components/PieChart';
import LowStockInventory from '../components/LowStockInventory';
import { fetchClients, type ClientRow } from '../api/clients';
import { fetchTasks, fetchAllTasks, type TaskRow } from '../api/tasks';
import { fetchSalesProductCounts, fetchSiteActivity, type SalesProductCounts, type SiteActivityEntry } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiLeads, setApiLeads] = useState<ClientRow[]>([]);
  const [dashboardTasks, setDashboardTasks] = useState<TaskRow[]>([]);
  const [allTasks, setAllTasks] = useState<TaskRow[]>([]);
  const [salesData, setSalesData] = useState<SalesProductCounts | null>(null);
  const [siteActivity, setSiteActivity] = useState<SiteActivityEntry[]>([]);

  const isAdmin = Array.isArray(user?.roles) && user!.roles.includes('admin');

  useEffect(() => {
    let cancelled = false;
    fetchClients('lead')
      .then((leads) => {
        if (!cancelled) setApiLeads(leads);
      })
      .catch(() => {
        if (!cancelled) setApiLeads([]);
      });
    return () => { cancelled = true; };
  }, []);

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
              <LowStockInventory />
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
                  {apiLeads.length === 0 ? (
                    <p className="page-subtitle" style={{ margin: 0 }}>No leads</p>
                  ) : (
                    apiLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="clickable-item"
                        onClick={() => handleLeadClick(lead.id)}
                      >
                        {lead.company}
                      </div>
                    ))
                  )}
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
              <div className="dashboard-card">
                <h3 className="chart-title" style={{ margin: '0 0 0.75rem 0', padding: 0 }}>Sales</h3>
                <div className="card-content">
                  <SalesChart productData={salesProductData} totalData={salesTotalData} />
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="dashboard-admin-tasks-section">
                <h3 className="dashboard-admin-tasks-title">All tasks</h3>
                <div className="dashboard-admin-tasks-table-wrapper">
                  <table className="dashboard-admin-tasks-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Roles</th>
                        <th>Assigned to</th>
                        <th>Company</th>
                        <th>Due date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTasks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="dashboard-admin-tasks-empty">No tasks.</td>
                        </tr>
                      ) : (
                        allTasks.map((task) => (
                          <tr key={task.id} className="dashboard-admin-tasks-row" onClick={() => handleTaskClick(task.id)}>
                            <td>{task.name}</td>
                            <td>
                              <span
                                className="dashboard-pill"
                                style={{ backgroundColor: STATUS_PILL_COLORS[task.status] ?? '#e5e7eb' }}
                              >
                                {task.status}
                              </span>
                            </td>
                            <td>
                              {task.priority ? (
                                <span
                                  className="dashboard-pill"
                                  style={{ backgroundColor: PRIORITY_PILL_COLORS[task.priority] ?? '#e5e7eb' }}
                                >
                                  {task.priority}
                                </span>
                              ) : '—'}
                            </td>
                            <td>
                              <div className="dashboard-admin-tasks-tags">
                                {(task.tags?.length ? task.tags : []).map((tag) => (
                                  <span
                                    key={tag}
                                    className="dashboard-pill"
                                    style={{ backgroundColor: TAG_PILL_COLORS[tag] ?? '#e5e7eb' }}
                                  >
                                    {tag.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {(!task.tags || task.tags.length === 0) && '—'}
                              </div>
                            </td>
                            <td>{task.assigned_to_name ?? '—'}</td>
                            <td>{task.client_company ?? '—'}</td>
                            <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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


