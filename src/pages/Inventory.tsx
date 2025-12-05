import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import './Page.css';
import './Inventory.css';

const Inventory: React.FC = () => {
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
                  <tr>
                    <td colSpan={4} className="table-empty">No inventory items found</td>
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


