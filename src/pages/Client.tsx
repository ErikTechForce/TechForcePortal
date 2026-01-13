import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { clients } from '../data/clients';
import { leads } from '../data/leads';
import './Page.css';
import './Client.css';

const Client: React.FC = () => {
  const navigate = useNavigate();

  const handleClientClick = (clientId: number) => {
    navigate(`/client/${clientId}`);
  };

  const handleLeadClick = (leadId: number) => {
    navigate(`/lead/${leadId}`);
  };

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
                  {clients.map((client) => (
                    <tr 
                      key={client.id} 
                      onClick={() => handleClientClick(client.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{client.company}</td>
                      <td>{client.employee || 'unassigned'}</td>
                      <td>{client.pointOfContact}</td>
                      <td>{client.product}</td>
                    </tr>
                  ))}
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
                  {leads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => handleLeadClick(lead.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{lead.companyName}</td>
                      <td>{lead.pointOfContact}</td>
                      <td>{lead.contactInformation}</td>
                      <td>{lead.source}</td>
                    </tr>
                  ))}
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


