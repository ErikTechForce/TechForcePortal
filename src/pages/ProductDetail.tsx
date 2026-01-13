import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { clients } from '../data/clients';
import { employees } from '../data/tasks';
import './Page.css';
import './ProductDetail.css';

interface InUseItem {
  serialNumber: string;
  companyName: string;
  status: string;
  assigned: string;
}

interface AvailableItem {
  serialNumber: string;
  status: string;
  notes: string;
}

const ProductDetail: React.FC = () => {
  const navigate = useNavigate();
  const { productName } = useParams<{ productName: string }>();

  // Generate placeholder data for "In Use" table
  const inUseItems: InUseItem[] = [
    {
      serialNumber: 'SN-001',
      companyName: clients[0]?.company || 'Acme Corporation',
      status: 'Active',
      assigned: employees[0] || 'John Smith'
    },
    {
      serialNumber: 'SN-002',
      companyName: clients[1]?.company || 'TechSolutions Inc.',
      status: 'Active',
      assigned: employees[1] || 'Sarah Johnson'
    },
    {
      serialNumber: 'SN-003',
      companyName: clients[2]?.company || 'Global Industries Ltd.',
      status: 'Maintenance',
      assigned: employees[2] || 'Michael Chen'
    },
    {
      serialNumber: 'SN-004',
      companyName: clients[0]?.company || 'Acme Corporation',
      status: 'Active',
      assigned: employees[3] || 'Emily Davis'
    },
    {
      serialNumber: 'SN-005',
      companyName: clients[3]?.company || 'Innovation Dynamics',
      status: 'Active',
      assigned: employees[4] || 'David Wilson'
    },
    {
      serialNumber: 'SN-006',
      companyName: clients[1]?.company || 'TechSolutions Inc.',
      status: 'Active',
      assigned: employees[5] || 'Lisa Anderson'
    },
    {
      serialNumber: 'SN-007',
      companyName: clients[4]?.company || 'Advanced Systems Co.',
      status: 'Active',
      assigned: employees[0] || 'John Smith'
    },
    {
      serialNumber: 'SN-008',
      companyName: clients[2]?.company || 'Global Industries Ltd.',
      status: 'Active',
      assigned: employees[1] || 'Sarah Johnson'
    }
  ];

  // Generate placeholder data for "Available" table
  const availableItems: AvailableItem[] = [
    {
      serialNumber: 'SN-101',
      status: 'Ready',
      notes: 'Newly received, ready for deployment'
    },
    {
      serialNumber: 'SN-102',
      status: 'Ready',
      notes: 'Recently serviced, fully tested'
    },
    {
      serialNumber: 'SN-103',
      status: 'Inspection',
      notes: 'Pending quality inspection'
    },
    {
      serialNumber: 'SN-104',
      status: 'Ready',
      notes: 'Available for immediate assignment'
    },
    {
      serialNumber: 'SN-105',
      status: 'Maintenance',
      notes: 'Scheduled for routine maintenance'
    },
    {
      serialNumber: 'SN-106',
      status: 'Ready',
      notes: 'Fully configured and tested'
    },
    {
      serialNumber: 'SN-107',
      status: 'Ready',
      notes: 'Available for new client assignment'
    },
    {
      serialNumber: 'SN-108',
      status: 'Inspection',
      notes: 'Awaiting final inspection approval'
    },
    {
      serialNumber: 'SN-109',
      status: 'Ready',
      notes: 'Ready for deployment'
    },
    {
      serialNumber: 'SN-110',
      status: 'Ready',
      notes: 'Newly received, ready for deployment'
    },
    {
      serialNumber: 'SN-111',
      status: 'Maintenance',
      notes: 'Minor repairs completed, testing in progress'
    },
    {
      serialNumber: 'SN-112',
      status: 'Ready',
      notes: 'Available for assignment'
    },
    {
      serialNumber: 'SN-113',
      status: 'Ready',
      notes: 'Fully operational'
    },
    {
      serialNumber: 'SN-114',
      status: 'Inspection',
      notes: 'Quality check pending'
    },
    {
      serialNumber: 'SN-115',
      status: 'Ready',
      notes: 'Ready for immediate use'
    }
  ];

  const displayProductName = productName ? decodeURIComponent(productName) : 'Product';

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <div className="product-detail-header">
              <h2 className="page-title">{displayProductName}</h2>
              <button 
                className="back-button" 
                onClick={() => navigate('/inventory')}
              >
                ← Back to Inventory
              </button>
            </div>
            <p className="page-subtitle">Product inventory details and status</p>
            
            <div className="product-tables-container">
              <div className="product-table-section">
                <h3 className="product-table-title">In Use</h3>
                <div className="product-table-wrapper">
                  <table className="product-table">
                    <thead>
                      <tr>
                        <th>Serial Number</th>
                        <th>Company Name</th>
                        <th>Status</th>
                        <th>Assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inUseItems.map((item, index) => (
                        <tr 
                          key={index}
                          onClick={() => navigate(`/inventory/product/${encodeURIComponent(displayProductName)}/robot/${encodeURIComponent(item.serialNumber)}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{item.serialNumber}</td>
                          <td>{item.companyName}</td>
                          <td>
                            <span className={`status-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.assigned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="product-table-section">
                <h3 className="product-table-title">Available</h3>
                <div className="product-table-wrapper">
                  <table className="product-table">
                    <thead>
                      <tr>
                        <th>Serial Number</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableItems.map((item, index) => (
                        <tr 
                          key={index}
                          onClick={() => navigate(`/inventory/product/${encodeURIComponent(displayProductName)}/robot/${encodeURIComponent(item.serialNumber)}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{item.serialNumber}</td>
                          <td>
                            <span className={`status-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductDetail;

