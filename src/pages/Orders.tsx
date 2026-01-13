import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { contractsOrders, inventoryOrders, installationOrders } from '../data/orders';
import './Page.css';
import './Orders.css';

const Orders: React.FC = () => {
  const navigate = useNavigate();

  const handleOrderClick = (orderNumber: string) => {
    navigate(`/orders/${orderNumber}`);
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Orders</h2>
            <p className="page-subtitle">Manage and track all orders</p>
            
            <div className="orders-tables-container">
              <div className="orders-table-section">
                <h3 className="orders-table-title">Contracts</h3>
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Company Name</th>
                        <th>Order Number</th>
                        <th>Status</th>
                        <th>Employee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractsOrders.map((order) => (
                        <tr 
                          key={order.id}
                          onClick={() => handleOrderClick(order.orderNumber)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{order.companyName}</td>
                          <td>{order.orderNumber}</td>
                          <td>
                            <span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{order.employee || 'unassigned'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="orders-table-section">
                <h3 className="orders-table-title">Inventory</h3>
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Company Name</th>
                        <th>Order Number</th>
                        <th>Status</th>
                        <th>Employee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryOrders.map((order) => (
                        <tr 
                          key={order.id}
                          onClick={() => handleOrderClick(order.orderNumber)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{order.companyName}</td>
                          <td>{order.orderNumber}</td>
                          <td>
                            <span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{order.employee || 'unassigned'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="orders-table-section">
                <h3 className="orders-table-title">Installation</h3>
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Company Name</th>
                        <th>Order Number</th>
                        <th>Status</th>
                        <th>Employee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installationOrders.map((order) => (
                        <tr 
                          key={order.id}
                          onClick={() => handleOrderClick(order.orderNumber)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{order.companyName}</td>
                          <td>{order.orderNumber}</td>
                          <td>
                            <span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{order.employee || 'unassigned'}</td>
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

export default Orders;

