import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractsOrders, inventoryOrders, installationOrders } from '../data/orders';
import './Pending.css';

type TabType = 'Contracts' | 'Inventory' | 'Installation';

const Pending: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('Contracts');

  const getCompaniesForTab = (tab: TabType) => {
    switch (tab) {
      case 'Contracts':
        return contractsOrders;
      case 'Inventory':
        return inventoryOrders;
      case 'Installation':
        return installationOrders;
      default:
        return [];
    }
  };

  const getCountForTab = (tab: TabType): number => {
    return getCompaniesForTab(tab).length;
  };

  const handleCompanyClick = (orderNumber: string) => {
    // Navigate to order detail page
    navigate(`/orders/${orderNumber}`);
  };

  const currentCompanies = getCompaniesForTab(activeTab);

  return (
    <div className="pending-component">
      <div className="pending-tabs">
        <button
          className={`pending-tab ${activeTab === 'Contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('Contracts')}
        >
          Contracts
          <span className="pending-count">({getCountForTab('Contracts')})</span>
        </button>
        <button
          className={`pending-tab ${activeTab === 'Inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('Inventory')}
        >
          Inventory
          <span className="pending-count">({getCountForTab('Inventory')})</span>
        </button>
        <button
          className={`pending-tab ${activeTab === 'Installation' ? 'active' : ''}`}
          onClick={() => setActiveTab('Installation')}
        >
          Installation
          <span className="pending-count">({getCountForTab('Installation')})</span>
        </button>
      </div>
      <div className="pending-content">
        <h3 className="pending-title">
          Pending <span className="pending-title-count">({getCountForTab(activeTab)})</span>
        </h3>
        <div className="pending-companies-list">
          {currentCompanies.map((order) => (
            <div
              key={order.id}
              className="pending-company-item"
              onClick={() => handleCompanyClick(order.orderNumber)}
            >
              <span className="company-name">{order.companyName}</span>
              <span className={`company-employee ${!order.employee ? 'unassigned' : ''}`}>
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

