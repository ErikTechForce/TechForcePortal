import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { getClientById } from '../data/clients';
import { getOrdersByCompanyName } from '../data/orders';
import { getProductsByOrderNumber } from '../data/orderProducts';
import { employees } from '../data/tasks';
import './Page.css';
import './ClientDetail.css';
import './Orders.css';

const ClientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const clientIdNum = clientId ? parseInt(clientId, 10) : null;
  const clientData = clientIdNum ? getClientById(clientIdNum) : null;

  const [company, setCompany] = useState(clientData?.company || '');
  const [employee, setEmployee] = useState(clientData?.employee || '');
  const [pointOfContact, setPointOfContact] = useState(clientData?.pointOfContact || '');
  const [billingAddress, setBillingAddress] = useState('');
  const [contactEmail, setContactEmail] = useState(clientData?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(clientData?.contactPhone || '');
  const [siteLocationAddress, setSiteLocationAddress] = useState('');
  const [notes, setNotes] = useState(clientData?.notes || '');
  const [startDate, setStartDate] = useState(clientData?.startDate || '');

  // Edit modal states
  const [isClientInfoModalOpen, setIsClientInfoModalOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(clientData?.employee || '');
  const [editStartDate, setEditStartDate] = useState(clientData?.startDate || '');
  const [editPointOfContact, setEditPointOfContact] = useState(clientData?.pointOfContact || '');
  const [editContactEmail, setEditContactEmail] = useState(clientData?.contactEmail || '');
  const [editContactPhone, setEditContactPhone] = useState(clientData?.contactPhone || '');
  const [editBillingAddress, setEditBillingAddress] = useState('');
  const [editSiteLocationAddress, setEditSiteLocationAddress] = useState('');

  // Get orders for this client
  const clientOrders = clientData ? getOrdersByCompanyName(clientData.company) : [];

  // Get all products for all orders of this client
  const clientProducts = useMemo(() => {
    if (!clientOrders.length) return [];
    const allProducts: Array<{ product: ReturnType<typeof getProductsByOrderNumber>[0]; orderNumber: string }> = [];
    clientOrders.forEach(order => {
      const products = getProductsByOrderNumber(order.orderNumber);
      products.forEach(product => {
        allProducts.push({ product, orderNumber: order.orderNumber });
      });
    });
    return allProducts;
  }, [clientOrders]);

  // Calculate relationship duration
  const calculateRelationshipDuration = (startDateStr: string): string => {
    if (!startDateStr) return 'Not set';
    
    const start = new Date(startDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      if (remainingMonths === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
      }
    }
  };

  useEffect(() => {
    if (clientData) {
      setCompany(clientData.company);
      setEmployee(clientData.employee || '');
      setPointOfContact(clientData.pointOfContact);
      setContactEmail(clientData.contactEmail || '');
      setContactPhone(clientData.contactPhone || '');
      setNotes(clientData.notes || '');
      setStartDate(clientData.startDate || '');
      // Set placeholder addresses
      setBillingAddress('123 Business St, Suite 100, City, State 12345');
      setSiteLocationAddress('456 Industrial Blvd, Building A, City, State 12345');
      
      // Initialize edit states
      setEditEmployee(clientData.employee || '');
      setEditStartDate(clientData.startDate || '');
      setEditPointOfContact(clientData.pointOfContact);
      setEditContactEmail(clientData.contactEmail || '');
      setEditContactPhone(clientData.contactPhone || '');
      setEditBillingAddress('123 Business St, Suite 100, City, State 12345');
      setEditSiteLocationAddress('456 Industrial Blvd, Building A, City, State 12345');
    }
  }, [clientData]);

  const handleClientInfoEditClick = () => {
    setIsClientInfoModalOpen(true);
  };

  const handleClientInfoSave = () => {
    setEmployee(editEmployee);
    setStartDate(editStartDate);
    setIsClientInfoModalOpen(false);
    // In a real app, you would save to backend here
    console.log('Client info updated:', { employee: editEmployee, startDate: editStartDate });
  };

  const handleClientInfoCancel = () => {
    setEditEmployee(employee);
    setEditStartDate(startDate);
    setIsClientInfoModalOpen(false);
  };

  const handleContactInfoEditClick = () => {
    setIsContactInfoModalOpen(true);
  };

  const handleContactInfoSave = () => {
    setPointOfContact(editPointOfContact);
    setContactEmail(editContactEmail);
    setContactPhone(editContactPhone);
    setBillingAddress(editBillingAddress);
    setSiteLocationAddress(editSiteLocationAddress);
    setIsContactInfoModalOpen(false);
    // In a real app, you would save to backend here
    console.log('Contact info updated:', { 
      pointOfContact: editPointOfContact, 
      contactEmail: editContactEmail, 
      contactPhone: editContactPhone,
      billingAddress: editBillingAddress,
      siteLocationAddress: editSiteLocationAddress
    });
  };

  const handleContactInfoCancel = () => {
    setEditPointOfContact(pointOfContact);
    setEditContactEmail(contactEmail);
    setEditContactPhone(contactPhone);
    setEditBillingAddress(billingAddress);
    setEditSiteLocationAddress(siteLocationAddress);
    setIsContactInfoModalOpen(false);
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
            
            {/* Client Information Card */}
            <div className="client-info-card">
              <div className="client-info-header">
                <h3 className="section-title">Client Information</h3>
                <button 
                  type="button" 
                  className="edit-client-button"
                  onClick={handleClientInfoEditClick}
                >
                  Edit
                </button>
              </div>
              
              <div className="client-info-grid">
                <div className="client-info-item">
                  <label className="client-info-label">Company</label>
                  <div className="client-info-value">{company}</div>
                </div>

                <div className="client-info-item">
                  <label className="client-info-label">Employee</label>
                  <div className="client-info-value">{employee || 'Unassigned'}</div>
                </div>

                <div className="client-info-item">
                  <label className="client-info-label">Relationship Duration</label>
                  <div className="client-info-value">{calculateRelationshipDuration(startDate)}</div>
                </div>
              </div>
            </div>

            {/* Point of Contact Information Card */}
            <div className="client-info-card">
              <div className="client-info-header">
                <h3 className="section-title">Point of Contact Information</h3>
                <button 
                  type="button" 
                  className="edit-client-button"
                  onClick={handleContactInfoEditClick}
                >
                  Edit
                </button>
              </div>
              
              <div className="client-info-grid">
                <div className="client-info-item">
                  <label className="client-info-label">Point of Contact</label>
                  <div className="client-info-value">{pointOfContact}</div>
                </div>

                <div className="client-info-item">
                  <label className="client-info-label">Email</label>
                  <div className="client-info-value">{contactEmail || 'Not set'}</div>
                </div>

                <div className="client-info-item">
                  <label className="client-info-label">Phone</label>
                  <div className="client-info-value">{contactPhone || 'Not set'}</div>
                </div>

                <div className="client-info-item">
                  <label className="client-info-label">Billing Address</label>
                  <div className="client-info-value">{billingAddress || 'Not set'}</div>
                </div>

                <div className="client-info-item">
                  <label className="client-info-label">Site Location Address</label>
                  <div className="client-info-value">{siteLocationAddress || 'Not set'}</div>
                </div>
              </div>
            </div>

            {/* Orders Section */}
            {clientOrders.length > 0 && (
              <div className="form-section">
                <h3 className="section-title">Orders</h3>
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order Number</th>
                        <th>Stage</th>
                        <th>Status</th>
                        <th>Employee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientOrders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.orderNumber}</td>
                          <td>{order.category}</td>
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
            )}

            {/* Products Section */}
            {clientProducts.length > 0 && (
              <div className="form-section">
                <h3 className="section-title">Products</h3>
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order Number</th>
                        <th>Product Name</th>
                        <th>Serial Number</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientProducts.map(({ product, orderNumber }, index) => (
                        <tr key={`${product.id}-${index}`}>
                          <td>{orderNumber}</td>
                          <td>{product.productName}</td>
                          <td>{product.serialNumber || 'N/A'}</td>
                          <td>
                            <span className={`status-badge status-${(product.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                              {product.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Additional Notes Section */}
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
              <button type="button" className="update-button" onClick={() => {
                console.log('Client updated:', { company, employee, pointOfContact, billingAddress, contactEmail, contactPhone, siteLocationAddress, notes, startDate });
                navigate('/client');
              }}>
                Update
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Client Information Edit Modal */}
      {isClientInfoModalOpen && (
        <div className="modal-overlay" onClick={handleClientInfoCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Client Information</h3>
              <button className="modal-close-button" onClick={handleClientInfoCancel}>×</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-company" className="form-label">Company</label>
                <input
                  type="text"
                  id="edit-company"
                  className="form-input"
                  value={company}
                  disabled
                  readOnly
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-employee" className="form-label">Employee</label>
                <SearchableDropdown
                  options={employees}
                  value={editEmployee}
                  onChange={(value) => setEditEmployee(value)}
                  placeholder="Select employee..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-start-date" className="form-label">Start Date</label>
                <input
                  type="date"
                  id="edit-start-date"
                  className="form-input"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={handleClientInfoCancel}>
                  Cancel
                </button>
                <button type="button" className="update-button" onClick={handleClientInfoSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Point of Contact Information Edit Modal */}
      {isContactInfoModalOpen && (
        <div className="modal-overlay" onClick={handleContactInfoCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Point of Contact Information</h3>
              <button className="modal-close-button" onClick={handleContactInfoCancel}>×</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-point-of-contact" className="form-label">Point of Contact</label>
                <input
                  type="text"
                  id="edit-point-of-contact"
                  className="form-input"
                  value={editPointOfContact}
                  onChange={(e) => setEditPointOfContact(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-contact-email" className="form-label">Email</label>
                <input
                  type="email"
                  id="edit-contact-email"
                  className="form-input"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-contact-phone" className="form-label">Phone</label>
                <input
                  type="tel"
                  id="edit-contact-phone"
                  className="form-input"
                  value={editContactPhone}
                  onChange={(e) => setEditContactPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-billing-address" className="form-label">Billing Address</label>
                <textarea
                  id="edit-billing-address"
                  className="form-textarea"
                  value={editBillingAddress}
                  onChange={(e) => setEditBillingAddress(e.target.value)}
                  rows={3}
                  placeholder="Enter billing address..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-site-location-address" className="form-label">Site Location Address</label>
                <textarea
                  id="edit-site-location-address"
                  className="form-textarea"
                  value={editSiteLocationAddress}
                  onChange={(e) => setEditSiteLocationAddress(e.target.value)}
                  rows={3}
                  placeholder="Enter site location address..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={handleContactInfoCancel}>
                  Cancel
                </button>
                <button type="button" className="update-button" onClick={handleContactInfoSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
