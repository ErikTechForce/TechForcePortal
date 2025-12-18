import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { getLeadById } from '../data/leads';
import { products } from '../data/tasks';
import './Page.css';
import './LeadDetail.css';

const LeadDetail: React.FC = () => {
  const navigate = useNavigate();
  const { leadId } = useParams<{ leadId: string }>();
  const leadIdNum = leadId ? parseInt(leadId, 10) : null;
  const leadData = leadIdNum ? getLeadById(leadIdNum) : null;

  const [companyName, setCompanyName] = useState(leadData?.companyName || '');
  const [pointOfContact, setPointOfContact] = useState(leadData?.pointOfContact || '');
  const [contactInformation, setContactInformation] = useState(leadData?.contactInformation || '');
  const [source, setSource] = useState(leadData?.source || '');
  const [phoneNumber, setPhoneNumber] = useState(leadData?.phoneNumber || '');
  const [productInterested, setProductInterested] = useState(leadData?.productInterested || '');
  const [notes, setNotes] = useState(leadData?.notes || '');

  useEffect(() => {
    if (leadData) {
      setCompanyName(leadData.companyName);
      setPointOfContact(leadData.pointOfContact);
      setContactInformation(leadData.contactInformation);
      setSource(leadData.source);
      setPhoneNumber(leadData.phoneNumber || '');
      setProductInterested(leadData.productInterested || '');
      setNotes(leadData.notes || '');
    }
  }, [leadData]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle update logic here
    console.log('Lead updated:', { companyName, pointOfContact, contactInformation, source, phoneNumber, productInterested, notes });
    // Navigate back to clients
    navigate('/client');
  };

  if (!leadData) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <h2 className="page-title">Lead Not Found</h2>
              <button onClick={() => navigate('/client')}>Back to Leads</button>
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
            <h2 className="page-title">Lead Details</h2>
            <p className="page-subtitle">View and update lead information</p>
            
            <form className="lead-detail-form" onSubmit={handleUpdate}>
              <div className="form-section">
                <h3 className="section-title">Lead Information</h3>
                <div className="form-group">
                  <label htmlFor="companyName" className="form-label">Company Name</label>
                  <input
                    type="text"
                    id="companyName"
                    className="form-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

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
                  <label htmlFor="contactInformation" className="form-label">Contact Information (Email)</label>
                  <input
                    type="email"
                    id="contactInformation"
                    className="form-input"
                    value={contactInformation}
                    onChange={(e) => setContactInformation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    className="form-input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="source" className="form-label">Source</label>
                  <input
                    type="text"
                    id="source"
                    className="form-input"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Product Interest</h3>
                <div className="form-group">
                  <label htmlFor="productInterested" className="form-label">Product Interested In</label>
                  <SearchableDropdown
                    options={products}
                    value={productInterested}
                    onChange={setProductInterested}
                    placeholder="Select or type product name..."
                    required={false}
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
                    placeholder="Enter any additional notes or comments about this lead..."
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

export default LeadDetail;

