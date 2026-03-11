import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
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

const STATUS_FILTER_ORDER = ['To-Do', 'In Progress'] as const;
type StatusFilter = typeof STATUS_FILTER_ORDER[number];

const STATUS_PILL_COLORS: Record<string, string> = {
  Unassigned: '#8A8F93',
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
  const [taskStatusFilter, setTaskStatusFilter] = useState<StatusFilter>('To-Do');
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

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.dashboard-card');
    const cleanups: (() => void)[] = [];
    cards.forEach((card) => {
      const handler = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      };
      card.addEventListener('mousemove', handler);
      cleanups.push(() => card.removeEventListener('mousemove', handler));
    });
    return () => cleanups.forEach((fn) => fn());
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

  const taskCountByStatus = STATUS_FILTER_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = dashboardTasks.filter((t) => t.status === s).length;
    return acc;
  }, {});

  const filteredTasks = dashboardTasks.filter((t) => t.status === taskStatusFilter);

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
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">

          <div>
            <PageHeader
              title={`Hello, ${user?.username ?? 'there'}!`}
              subtitle="Welcome to TechForce Robotics Company Portal"
            />
          </div>

          <div className="dashboard-content">
            <div className="dashboard-grid">

              {/* div1 — Sales */}
              <div className="dash-sales dashboard-card dashboard-chart-card">
                <SalesChart productData={salesProductData} totalData={salesTotalData} />
              </div>

              {/* div2 — Robots Online */}
              <div className="dash-robots dashboard-card dashboard-chart-card">
                <h3 className="chart-title">Robots Online</h3>
                <div className="robots-legend">
                  {robotsData.map((item) => (
                    <div key={item.label} className="robots-legend-item">
                      <span className="robots-legend-dot" style={{ backgroundColor: item.color }} />
                      <span className="robots-legend-label">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="robots-chart-wrapper">
                  <PieChart data={robotsData} size={180} />
                </div>
              </div>

              {/* div3 — Low Stock Inventory */}
              <div className="dash-inventory">
                <LowStockInventory />
              </div>

              {/* div4 — Tasks */}
              <div className="dash-tasks dashboard-card">
                <h3 className="card-title" style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>Your Tasks</h3>
                <div className="dash-tasks-filter-bar">
                  {STATUS_FILTER_ORDER.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`dash-tasks-filter-btn ${taskStatusFilter === status ? 'active' : ''}`}
                      onClick={() => setTaskStatusFilter(status)}
                    >
                      {status}
                      <span className="dash-tasks-filter-count">{taskCountByStatus[status]}</span>
                    </button>
                  ))}
                </div>
                <div className="card-content">
                  {filteredTasks.length === 0 ? (
                    <p className="page-subtitle" style={{ margin: 0 }}>No {taskStatusFilter.toLowerCase()} tasks</p>
                  ) : (
                    filteredTasks.map((task) => (
                      <div key={task.id} className="dash-list-item" onClick={() => handleTaskClick(task.id)}>
                        <span className="dash-list-item-primary">{task.name}</span>
                        {task.priority && (
                          <div className="dashboard-task-pills">
                            <span
                              className="dashboard-pill"
                              style={{ backgroundColor: PRIORITY_PILL_COLORS[task.priority] ?? '#e5e7eb' }}
                            >
                              {task.priority}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* div5 — Pending / Orders */}
              <div className="dash-pending dashboard-card">
                <Pending />
              </div>

              {/* div6 — Leads */}
              <div className="dash-leads dashboard-card">
                <h3 className="card-title" style={{ cursor: 'pointer' }} onClick={() => navigate('/client')}>Leads</h3>
                <div className="card-content">
                  {apiLeads.length === 0 ? (
                    <p className="page-subtitle" style={{ margin: 0 }}>No leads</p>
                  ) : (
                    apiLeads.map((lead) => (
                      <div key={lead.id} className="dash-list-item" onClick={() => handleLeadClick(lead.id)}>
                        <span className="dash-list-item-primary">{lead.company}</span>
                        <span className="dash-list-item-secondary">{lead.point_of_contact}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* div7 — Activity Log */}
              <div className="dash-activity dashboard-card">
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;


