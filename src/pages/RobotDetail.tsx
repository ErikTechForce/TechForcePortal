import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { employees } from '../data/tasks';
import './Page.css';
import './RobotDetail.css';

interface ActivityLogEntry {
  id: number;
  timestamp: string;
  action: string;
  user: string;
}

const RobotDetail: React.FC = () => {
  const navigate = useNavigate();
  const { productName, serialNumber } = useParams<{ productName: string; serialNumber: string }>();

  const decodedProductName = productName ? decodeURIComponent(productName) : 'Product';
  const decodedSerialNumber = serialNumber ? decodeURIComponent(serialNumber) : '';

  // Initialize state with placeholder/default values
  const [status, setStatus] = useState('Active');
  const [assignedTo, setAssignedTo] = useState(employees[0] || '');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');

  // Placeholder activity log data
  const activityLog: ActivityLogEntry[] = [
    {
      id: 1,
      timestamp: '2024-01-15 10:30 AM',
      action: 'Robot assigned to Acme Corporation',
      user: 'John Smith'
    },
    {
      id: 2,
      timestamp: '2024-01-14 02:15 PM',
      action: 'Status changed to Active',
      user: 'Sarah Johnson'
    },
    {
      id: 3,
      timestamp: '2024-01-13 09:00 AM',
      action: 'Maintenance completed',
      user: 'Michael Chen'
    },
    {
      id: 4,
      timestamp: '2024-01-12 11:45 AM',
      action: 'Robot received and inspected',
      user: 'Emily Davis'
    },
    {
      id: 5,
      timestamp: '2024-01-10 03:20 PM',
      action: 'Initial setup and configuration',
      user: 'David Wilson'
    }
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle save logic here
    console.log('Robot details saved:', {
      serialNumber: decodedSerialNumber,
      status,
      assignedTo,
      companyName,
      notes
    });
    // Navigate back to product detail page
    if (productName) {
      navigate(`/inventory/product/${productName}`);
    } else {
      navigate('/inventory');
    }
  };

  const handleBack = () => {
    if (productName) {
      navigate(`/inventory/product/${productName}`);
    } else {
      navigate('/inventory');
    }
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <div className="robot-detail-header">
              <h2 className="page-title">Robot Details</h2>
              <button 
                className="back-button" 
                onClick={handleBack}
              >
                ← Back to {decodedProductName}
              </button>
            </div>
            <p className="page-subtitle">Manage robot information and track activity</p>
            
            <form className="robot-detail-form" onSubmit={handleSave}>
              <div className="form-section">
                <h3 className="section-title">Robot Information</h3>
                
                <div className="form-group">
                  <label htmlFor="serialNumber" className="form-label">Serial Number</label>
                  <input
                    type="text"
                    id="serialNumber"
                    className="form-input"
                    value={decodedSerialNumber}
                    disabled
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    id="status"
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Ready">Ready</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="assignedTo" className="form-label">Assigned To</label>
                  <SearchableDropdown
                    options={employees}
                    value={assignedTo}
                    onChange={setAssignedTo}
                    placeholder="Select or type employee name..."
                    required={false}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyName" className="form-label">Company Name</label>
                  <input
                    type="text"
                    id="companyName"
                    className="form-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea
                    id="notes"
                    className="form-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Enter any additional notes or comments about this robot..."
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Activity Log</h3>
                <div className="activity-log-container">
                  <table className="activity-log-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLog.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.timestamp}</td>
                          <td>{entry.action}</td>
                          <td>{entry.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleBack}>
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  Save
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RobotDetail;



