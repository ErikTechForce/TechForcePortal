import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, type OrderRow } from '../api/orderApi';
import './Pending.css';

type TabType = 'Contracts' | 'Inventory' | 'Installation';

interface PendingOrderItem {
  id: number;
  orderNumber: string;
  companyName: string;
  employee: string | null;
}

const mapApiOrderToPending = (row: OrderRow): PendingOrderItem => ({
  id: row.id,
  orderNumber: row.order_number,
  companyName: row.company_name,
  employee: row.employee_name ?? null,
});

const Pending: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('Contracts');
  const [apiOrders, setApiOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchOrders()
      .then((orders) => {
        if (!cancelled) setApiOrders(orders);
      })
      .catch(() => {
        if (!cancelled) setApiOrders([]);
      });
    return () => { cancelled = true; };
  }, []);

  const ordersByTab = useMemo(() => {
    const contract = apiOrders.filter((o) => o.category === 'Contract').map(mapApiOrderToPending);
    const inventory = apiOrders.filter((o) => o.category === 'Inventory').map(mapApiOrderToPending);
    const installation = apiOrders.filter((o) => o.category === 'Installation').map(mapApiOrderToPending);
    return { Contracts: contract, Inventory: inventory, Installation: installation };
  }, [apiOrders]);

  const getCompaniesForTab = (tab: TabType): PendingOrderItem[] => {
    return ordersByTab[tab] ?? [];
  };

  const getCountForTab = (tab: TabType): number => getCompaniesForTab(tab).length;

  const handleCompanyClick = (orderNumber: string) => {
    // Navigate to order detail page
    navigate(`/orders/${orderNumber}`);
  };

  const currentCompanies = getCompaniesForTab(activeTab);

  return (
    <div className="pending-component">
      <h3 className="pending-header-title" style={{ cursor: 'pointer' }} onClick={() => navigate('/orders')}>Orders</h3>
      <div className="pending-tabs">
        <button
          className={`pending-tab ${activeTab === 'Contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('Contracts')}
        >
          Contracts
          <span className="pending-count">{getCountForTab('Contracts')}</span>
        </button>
        <button
          className={`pending-tab ${activeTab === 'Inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('Inventory')}
        >
          Invoice
          <span className="pending-count">{getCountForTab('Inventory')}</span>
        </button>
        <button
          className={`pending-tab ${activeTab === 'Installation' ? 'active' : ''}`}
          onClick={() => setActiveTab('Installation')}
        >
          Installation
          <span className="pending-count">{getCountForTab('Installation')}</span>
        </button>
      </div>
      <div className="pending-content">
        <div className="pending-companies-list">
          {currentCompanies.map((order) => (
            <div
              key={order.id}
              className="dash-list-item"
              onClick={() => handleCompanyClick(order.orderNumber)}
            >
              <span className="dash-list-item-primary">{order.companyName}</span>
              <span className={`dash-list-item-secondary ${!order.employee ? 'unassigned' : ''}`}>
                {order.employee || 'unassigned'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pending;

