import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import './Page.css';
import './Client.css';

const Client: React.FC = () => {
  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Client</h2>
            <p className="page-subtitle">Manage client information and relationships</p>
            
            <div className="client-search-row">
              <input 
                type="text" 
                className="client-search-bar" 
                placeholder="Search clients..."
              />
            </div>

            <div className="clients-section">
              <h3 className="clients-title">Clients</h3>
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Employee</th>
                    <th>Point of Contact</th>
                    <th>Product</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="table-empty">No clients found</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="client-button-row">
              <button className="add-client-button">+Add Client</button>
            </div>

            <div className="leads-section">
              <h3 className="leads-title">Leads</h3>
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Point of Contact</th>
                    <th>Contact Information</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="table-empty">No leads found</td>
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

export default Client;


