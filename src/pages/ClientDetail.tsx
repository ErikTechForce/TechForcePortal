import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { getClientById } from '../data/clients';
import { products } from '../data/tasks';
import './Page.css';
import './ClientDetail.css';

const ClientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const clientIdNum = clientId ? parseInt(clientId, 10) : null;
  const clientData = clientIdNum ? getClientById(clientIdNum) : null;

  const [company, setCompany] = useState(clientData?.company || '');
  const [employee, setEmployee] = useState(clientData?.employee || '');
  const [pointOfContact, setPointOfContact] = useState(clientData?.pointOfContact || '');
  const [product, setProduct] = useState(clientData?.product || '');
  const [contactEmail, setContactEmail] = useState(clientData?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(clientData?.contactPhone || '');
  const [notes, setNotes] = useState(clientData?.notes || '');

  useEffect(() => {
    if (clientData) {
      setCompany(clientData.company);
      setEmployee(clientData.employee);
      setPointOfContact(clientData.pointOfContact);
      setProduct(clientData.product);
      setContactEmail(clientData.contactEmail || '');
      setContactPhone(clientData.contactPhone || '');
      setNotes(clientData.notes || '');
    }
  }, [clientData]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle update logic here
    console.log('Client updated:', { company, employee, pointOfContact, product, contactEmail, contactPhone, notes });
    // Navigate back to clients
    navigate('/client');
  };

  if (!clientData) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <h2 className="page-title">Client Not Found</h2>
              <button onClick={() => navigate('/client')}>Back to Clients</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <h2 className="page-title">Client Details</h2>
            <p className="page-subtitle">View and update client information</p>
            
            <form className="client-detail-form" onSubmit={handleUpdate}>
              <div className="form-section">
                <h3 className="section-title">Client Information</h3>
                <div className="form-group">
                  <label htmlFor="company" className="form-label">Company</label>
                  <input
                    type="text"
                    id="company"
                    className="form-input"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employee" className="form-label">Employee</label>
                  <input
                    type="text"
                    id="employee"
                    className="form-input"
                    value={employee}
                    onChange={(e) => setEmployee(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="product" className="form-label">Product</label>
                  <SearchableDropdown
                    options={products}
                    value={product}
                    onChange={setProduct}
                    placeholder="Select or type product name..."
                    required={true}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Point of Contact Information</h3>
                <div className="form-group">
                  <label htmlFor="pointOfContact" className="form-label">Point of Contact</label>
                  <input
                    type="text"
                    id="pointOfContact"
                    className="form-input"
                    value={pointOfContact}
                    onChange={(e) => setPointOfContact(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactEmail" className="form-label">Email</label>
                  <input
                    type="email"
                    id="contactEmail"
                    className="form-input"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactPhone" className="form-label">Phone</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    className="form-input"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Additional Notes</h3>
                <div className="form-group">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea
                    id="notes"
                    className="form-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    placeholder="Enter any additional notes or comments about this client..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => navigate('/client')}>
                  Cancel
                </button>
                <button type="submit" className="update-button">
                  Update
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientDetail;

