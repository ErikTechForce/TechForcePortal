import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Pending from '../components/Pending';
import SalesChart from '../components/SalesChart';
import PieChart from '../components/PieChart';
import { fetchClients, type ClientRow } from '../api/clients';
import { fetchTasks, type TaskRow } from '../api/tasks';
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
  
  const salesProductData = {
    '1month': [
      { product: 'Robot A', sales: 12 },
      { product: 'Robot B', sales: 18 },
      { product: 'Robot C', sales: 15 },
      { product: 'Robot D', sales: 22 },
      { product: 'Robot E', sales: 20 }
    ],
    '3months': [
      { product: 'Robot A', sales: 35 },
      { product: 'Robot B', sales: 52 },
      { product: 'Robot C', sales: 44 },
      { product: 'Robot D', sales: 65 },
      { product: 'Robot E', sales: 58 }
    ],
    '6months': [
      { product: 'Robot A', sales: 72 },
      { product: 'Robot B', sales: 108 },
      { product: 'Robot C', sales: 90 },
      { product: 'Robot D', sales: 132 },
      { product: 'Robot E', sales: 120 }
    ],
    '1year': [
      { product: 'Robot A', sales: 144 },
      { product: 'Robot B', sales: 216 },
      { product: 'Robot C', sales: 180 },
      { product: 'Robot D', sales: 264 },
      { product: 'Robot E', sales: 240 }
    ]
  };

  // Calculate total sales from product sales for each period
  const calculateTotalFromProducts = (products: typeof salesProductData['1month']) => {
    return products.reduce((sum, p) => sum + p.sales, 0);
  };

  // Generate monthly sales data that matches product totals
  const generateMonthlySalesData = (months: number, periodTotal: number) => {
    const data = [];
    const today = new Date();
    const avgMonthly = Math.floor(periodTotal / months);
    const remainder = periodTotal % months;
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      // Distribute total evenly, with remainder added to first month
      const monthlyTotal = avgMonthly + (i === months - 1 ? remainder : 0);
      // Add slight variation for realism (±5%)
      const variation = Math.floor(monthlyTotal * 0.05 * (Math.random() * 2 - 1));
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: Math.max(1, monthlyTotal + variation)
      });
    }
    
    // Ensure the sum matches the period total exactly
    const currentSum = data.reduce((sum, d) => sum + d.total, 0);
    const difference = periodTotal - currentSum;
    if (difference !== 0) {
      data[data.length - 1].total += difference;
    }
    
    return data;
  };

  const salesTotalData = {
    '1month': generateMonthlySalesData(1, calculateTotalFromProducts(salesProductData['1month'])),
    '3months': generateMonthlySalesData(3, calculateTotalFromProducts(salesProductData['3months'])),
    '6months': generateMonthlySalesData(6, calculateTotalFromProducts(salesProductData['6months'])),
    '1year': generateMonthlySalesData(12, calculateTotalFromProducts(salesProductData['1year']))
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

  const socialMediaFeed = [
    { platform: 'Instagram', activity: 'TechForce has just posted a reel on Instagram', time: '2 hours ago' },
    { platform: 'LinkedIn', activity: 'TechForce shared a new article about robotics innovation', time: '5 hours ago' },
    { platform: 'Twitter', activity: 'TechForce tweeted about the latest product launch', time: '1 day ago' },
    { platform: 'Facebook', activity: 'TechForce posted a video showcasing new features', time: '1 day ago' },
    { platform: 'Instagram', activity: 'TechForce uploaded a new photo gallery', time: '2 days ago' },
    { platform: 'LinkedIn', activity: 'TechForce announced a partnership with industry leaders', time: '3 days ago' }
  ];
  
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
              <div className="dashboard-card">
                <h3 className="card-title">Feed</h3>
                <div className="card-content">
                  {socialMediaFeed.map((item, index) => (
                    <div key={index} className="feed-item">
                      <div className="feed-activity">{item.activity}</div>
                      <div className="feed-meta">
                        <span className="feed-platform">{item.platform}</span>
                        <span className="feed-time">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
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


