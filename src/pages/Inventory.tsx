import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import './Page.css';
import './Inventory.css';

const Inventory: React.FC = () => {
  const navigate = useNavigate();

  const handleProductClick = (productName: string) => {
    navigate(`/inventory/product/${encodeURIComponent(productName)}`);
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Inventory</h2>
            <p className="page-subtitle">Track and manage inventory items</p>
            
            <div className="inventory-search-row">
              <input 
                type="text" 
                className="inventory-search-bar" 
                placeholder="Search inventory..."
              />
            </div>

            <div className="inventory-table-section">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU Number</th>
                    <th>Availability</th>
                    <th>In-Use</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    onClick={() => handleProductClick('Robot A')}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>Robot A</td>
                    <td>SKU-001-A</td>
                    <td>15</td>
                    <td>8</td>
                  </tr>
                  <tr 
                    onClick={() => handleProductClick('Robot B')}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>Robot B</td>
                    <td>SKU-002-B</td>
                    <td>22</td>
                    <td>12</td>
                  </tr>
                  <tr 
                    onClick={() => handleProductClick('Robot C')}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>Robot C</td>
                    <td>SKU-003-C</td>
                    <td>18</td>
                    <td>10</td>
                  </tr>
                  <tr 
                    onClick={() => handleProductClick('Robot D')}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>Robot D</td>
                    <td>SKU-004-D</td>
                    <td>25</td>
                    <td>15</td>
                  </tr>
                  <tr 
                    onClick={() => handleProductClick('Robot E')}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>Robot E</td>
                    <td>SKU-005-E</td>
                    <td>30</td>
                    <td>20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Inventory;


