import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { fetchOrders, type OrderRow } from '../api/orderApi';
import { fetchClients } from '../api/clients';
import './Page.css';
import './Orders.css';

function matchesOrderSearch(order: OrderRow, search: string): boolean {
  if (!search.trim()) return true;
  const term = search.trim().toLowerCase();
  const numberMatch = (order.order_number ?? '').toLowerCase().includes(term);
  const companyMatch = (order.company_name ?? '').toLowerCase().includes(term);
  return numberMatch || companyMatch;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [clients, setClients] = useState<Array<{ id: number; company: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');

  const companyToClientId = useMemo(() => {
    const map: Record<string, number> = {};
    clients.forEach((c) => { map[c.company] = c.id; });
    return map;
  }, [clients]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, clientList] = await Promise.all([fetchOrders(), fetchClients('client')]);
        if (!cancelled) {
          setOrders(list);
          setClients(clientList.map((c) => ({ id: c.id, company: c.company })));
        }
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const contractsOrders = orders.filter((o) => o.category === 'Contract');
  const inventoryOrders = orders.filter((o) => o.category === 'Inventory');
  const installationOrders = orders.filter((o) => o.category === 'Installation');
  const completedOrders = orders.filter((o) => o.category === 'Completed');

  const filteredContracts = contractsOrders.filter((o) => matchesOrderSearch(o, orderSearch));
  const filteredInventory = inventoryOrders.filter((o) => matchesOrderSearch(o, orderSearch));
  const filteredInstallation = installationOrders.filter((o) => matchesOrderSearch(o, orderSearch));
  const filteredCompleted = completedOrders.filter((o) => matchesOrderSearch(o, orderSearch));

  const handleOrderClick = (orderNumber: string) => {
    navigate(`/orders/${orderNumber}`);
  };

  const handleCreateOrder = () => {
    // Placeholder: could navigate to /orders/new or open a modal
    navigate('/orders/new');
  };

  const renderTable = (list: OrderRow[], emptyMessage: string) => (
    <div className="orders-table-wrapper">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order Number</th>
            <th>Company Name</th>
            <th>Status</th>
            <th>Employee</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={4} className="orders-table-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            list.map((order) => {
              const clientId = order.company_name ? companyToClientId[order.company_name] : undefined;
              return (
              <tr
                key={order.id}
                onClick={() => handleOrderClick(order.order_number)}
                style={{ cursor: 'pointer' }}
              >
                <td>{order.order_number}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  {clientId != null ? (
                    <Link to={`/client/${clientId}`} className="orders-company-link">
                      {order.company_name}
                    </Link>
                  ) : (
                    order.company_name
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${String(order.status).toLowerCase().replace(/\s+/g, '-')}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.employee_name || 'unassigned'}</td>
              </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <div className="orders-page-header">
              <div>
                <h2 className="page-title">Orders</h2>
                <p className="page-subtitle">Manage and track all orders</p>
              </div>
              <button type="button" className="orders-create-button" onClick={handleCreateOrder}>
                Create New Order
              </button>
            </div>

            {loading ? (
              <p className="page-subtitle">Loading orders...</p>
            ) : (
              <>
                <div className="orders-search-row">
                  <input
                    type="text"
                    className="orders-search-input"
                    placeholder="Search by order number or company name..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    aria-label="Search orders"
                  />
                </div>
                <div className="orders-tables-container">
                  <div className="orders-table-section">
                    <h3 className="orders-table-title">Contracts</h3>
                    {renderTable(filteredContracts, 'No contract orders.')}
                  </div>

                  <div className="orders-table-section">
                    <h3 className="orders-table-title">Invoice</h3>
                    {renderTable(filteredInventory, 'No invoice orders.')}
                  </div>

                  <div className="orders-table-section">
                    <h3 className="orders-table-title">Installation</h3>
                    {renderTable(filteredInstallation, 'No installation orders.')}
                  </div>

                  <div className="orders-table-section">
                    <h3 className="orders-table-title">Completed Orders</h3>
                    {renderTable(filteredCompleted, 'No completed orders.')}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Orders;

