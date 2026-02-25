import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { fetchClientById, fetchClientOrders, fetchClientContracts, fetchClientInvoices, updateClient, type ClientRow, type OrderRow, type ContractRow, type InvoiceRow } from '../api/clients';
import { fetchVerifiedUsers, type VerifiedUser } from '../api/users';
import { getClientById } from '../data/clients';
import { getOrdersByCompanyName } from '../data/orders';
import { getProductsByOrderNumber } from '../data/orderProducts';
import './Page.css';
import './ClientDetail.css';
import './Orders.css';

const ClientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const clientIdNum = clientId ? parseInt(clientId, 10) : null;

  const [apiClient, setApiClient] = useState<ClientRow | null>(null);
  const [clientOrders, setClientOrders] = useState<OrderRow[]>([]);
  const [clientContracts, setClientContracts] = useState<ContractRow[]>([]);
  const [clientInvoices, setClientInvoices] = useState<InvoiceRow[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const staticClient = clientIdNum ? getClientById(clientIdNum) : null;
  const staticOrders = staticClient ? getOrdersByCompanyName(staticClient.company) : [];
  const clientData = useFallback ? staticClient : apiClient;

  const [company, setCompany] = useState('');
  const [employee, setEmployee] = useState('');
  const [pointOfContact, setPointOfContact] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [siteLocationAddress, setSiteLocationAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');

  // Edit modal states
  const [isClientInfoModalOpen, setIsClientInfoModalOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState('');
  const [editSelectedUserId, setEditSelectedUserId] = useState<number | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editPointOfContact, setEditPointOfContact] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editBillingAddress, setEditBillingAddress] = useState('');
  const [editSiteLocationAddress, setEditSiteLocationAddress] = useState('');

  const ordersList = useFallback ? staticOrders : clientOrders;

  // Get all products for all orders of this client (from static data when we have order numbers)
  const clientProducts = useMemo(() => {
    if (!ordersList.length) return [];
    const allProducts: Array<{ product: ReturnType<typeof getProductsByOrderNumber>[0]; orderNumber: string }> = [];
    ordersList.forEach((order) => {
      const orderNumber = 'order_number' in order ? order.order_number : (order as { orderNumber: string }).orderNumber;
      const products = getProductsByOrderNumber(orderNumber);
      products.forEach((product) => {
        allProducts.push({ product, orderNumber });
      });
    });
    return allProducts;
  }, [ordersList]);

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
    if (!clientIdNum) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setUseFallback(false);
      try {
        const c = await fetchClientById(clientIdNum);
        if (cancelled) return;
        if (!c) {
          setNotFound(true);
          setApiClient(null);
          setLoading(false);
          return;
        }
        if (c.type !== 'client') {
          setNotFound(true);
          setApiClient(null);
          setLoading(false);
          return;
        }
        setApiClient(c);
        const [orders, contracts, invoices] = await Promise.all([
          fetchClientOrders(clientIdNum),
          fetchClientContracts(clientIdNum),
          fetchClientInvoices(clientIdNum),
        ]);
        if (!cancelled) {
          setClientOrders(orders);
          setClientContracts(contracts);
          setClientInvoices(invoices);
        }
      } catch {
        if (!cancelled) {
          setUseFallback(true);
          setApiClient(null);
          setClientOrders([]);
          setClientContracts([]);
          setClientInvoices([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientIdNum]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const users = await fetchVerifiedUsers();
        if (!cancelled) setVerifiedUsers(users);
      } catch {
        if (!cancelled) setVerifiedUsers([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (clientData) {
      const companyVal = 'company' in clientData ? clientData.company : (clientData as { company: string }).company;
      const employeeVal = 'employee_name' in clientData ? (clientData as ClientRow).employee_name : (clientData as { employee?: string }).employee;
      const pocVal = 'point_of_contact' in clientData ? (clientData as ClientRow).point_of_contact : (clientData as { pointOfContact: string }).pointOfContact;
      const emailVal = 'contact_email' in clientData ? (clientData as ClientRow).contact_email : (clientData as { contactEmail?: string }).contactEmail;
      const phoneVal = 'contact_phone' in clientData ? (clientData as ClientRow).contact_phone : (clientData as { contactPhone?: string }).contactPhone;
      const notesVal = 'notes' in clientData ? clientData.notes ?? '' : (clientData as { notes?: string }).notes ?? '';
      const startVal = 'start_date' in clientData ? (clientData as ClientRow).start_date : (clientData as { startDate?: string }).startDate;
      const billingVal = 'billing_address' in clientData ? (clientData as ClientRow).billing_address ?? '' : '';
      const siteVal = 'site_location' in clientData ? (clientData as ClientRow).site_location ?? '' : '';

      setCompany(companyVal);
      setEmployee(employeeVal ?? '');
      setPointOfContact(pocVal);
      setContactEmail(emailVal ?? '');
      setContactPhone(phoneVal ?? '');
      setNotes(notesVal);
      setStartDate(startVal ?? '');
      setBillingAddress(billingVal || (useFallback ? '123 Business St, Suite 100, City, State 12345' : ''));
      setSiteLocationAddress(siteVal || (useFallback ? '456 Industrial Blvd, Building A, City, State 12345' : ''));

      setEditEmployee(employeeVal ?? '');
      setEditStartDate(startVal ?? '');
      setEditPointOfContact(pocVal);
      setEditContactEmail(emailVal ?? '');
      setEditContactPhone(phoneVal ?? '');
      setEditBillingAddress(billingVal || (useFallback ? '123 Business St, Suite 100, City, State 12345' : ''));
      setEditSiteLocationAddress(siteVal || (useFallback ? '456 Industrial Blvd, Building A, City, State 12345' : ''));
    }
  }, [clientData, useFallback]);

  useEffect(() => {
    if (!clientData || verifiedUsers.length === 0) return;
    const employeeName = 'employee_name' in clientData ? (clientData as ClientRow).employee_name : (clientData as { employee?: string }).employee;
    const name = employeeName ?? '';
    const u = verifiedUsers.find((x) => x.username === name);
    setEditSelectedUserId(u ? u.id : null);
  }, [clientData, verifiedUsers]);

  const handleClientInfoEditClick = () => {
    setSaveError('');
    setIsClientInfoModalOpen(true);
  };

  const handleClientInfoSave = async () => {
    setSaveError('');
    if (useFallback || !clientIdNum) {
      setEmployee(editEmployee);
      setStartDate(editStartDate);
      setIsClientInfoModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      const payload: { user_id?: number | null; employee_name?: string | null; start_date?: string | null } = {
        start_date: editStartDate.trim() || null,
      };
      if (editSelectedUserId != null) payload.user_id = editSelectedUserId;
      else if (editEmployee.trim()) payload.employee_name = editEmployee.trim();
      else payload.employee_name = null;
      const updated = await updateClient(clientIdNum, payload);
      setApiClient(updated);
      setEmployee(updated.employee_name ?? '');
      setStartDate(updated.start_date ?? '');
      setEditEmployee(updated.employee_name ?? '');
      setEditStartDate(updated.start_date ?? '');
      setIsClientInfoModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update client.');
    } finally {
      setSaving(false);
    }
  };

  const handleClientInfoCancel = () => {
    setEditEmployee(employee);
    setEditStartDate(startDate);
    setIsClientInfoModalOpen(false);
  };

  const handleContactInfoEditClick = () => {
    setSaveError('');
    setIsContactInfoModalOpen(true);
  };

  const handleContactInfoSave = async () => {
    setSaveError('');
    if (useFallback || !clientIdNum) {
      setPointOfContact(editPointOfContact);
      setContactEmail(editContactEmail);
      setContactPhone(editContactPhone);
      setBillingAddress(editBillingAddress);
      setSiteLocationAddress(editSiteLocationAddress);
      setIsContactInfoModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateClient(clientIdNum, {
        point_of_contact: editPointOfContact.trim(),
        contact_email: editContactEmail.trim() || null,
        contact_phone: editContactPhone.trim() || null,
        billing_address: editBillingAddress.trim() || null,
        site_location: editSiteLocationAddress.trim() || null,
      });
      setApiClient(updated);
      setPointOfContact(updated.point_of_contact);
      setContactEmail(updated.contact_email ?? '');
      setContactPhone(updated.contact_phone ?? '');
      setBillingAddress(updated.billing_address ?? '');
      setSiteLocationAddress(updated.site_location ?? '');
      setEditPointOfContact(updated.point_of_contact);
      setEditContactEmail(updated.contact_email ?? '');
      setEditContactPhone(updated.contact_phone ?? '');
      setEditBillingAddress(updated.billing_address ?? '');
      setEditSiteLocationAddress(updated.site_location ?? '');
      setIsContactInfoModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update contact info.');
    } finally {
      setSaving(false);
    }
  };

  const handleContactInfoCancel = () => {
    setEditPointOfContact(pointOfContact);
    setEditContactEmail(contactEmail);
    setEditContactPhone(contactPhone);
    setEditBillingAddress(billingAddress);
    setEditSiteLocationAddress(siteLocationAddress);
    setIsContactInfoModalOpen(false);
  };

  if (loading && !clientData) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <h2 className="page-title">Client Details</h2>
              <p className="page-subtitle">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (notFound || !clientData) {
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
                          <td>
                            <Link to={`/orders/${orderNumber}`} className="client-order-link">{orderNumber}</Link>
                          </td>
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

            {/* Orders Section */}
            {ordersList.length > 0 && (
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
                      {ordersList.map((order) => {
                        const orderNumber = 'order_number' in order ? order.order_number : (order as { orderNumber: string }).orderNumber;
                        const category = 'category' in order ? order.category : (order as { category: string }).category;
                        const status = 'status' in order ? order.status : (order as { status: string }).status;
                        const emp = 'employee_name' in order ? (order as OrderRow).employee_name : (order as { employee?: string }).employee;
                        return (
                          <tr key={order.id}>
                            <td>
                              <Link to={`/orders/${orderNumber}`} className="client-order-link">{orderNumber}</Link>
                            </td>
                            <td>{category}</td>
                            <td>
                              <span className={`status-badge status-${String(status).toLowerCase().replace(/\s+/g, '-')}`}>
                                {status}
                              </span>
                            </td>
                            <td>{emp || 'unassigned'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Contracts Section */}
            {clientContracts.length > 0 && (
              <div className="form-section">
                <h3 className="section-title">Contracts</h3>
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order Number</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Generated</th>
                        <th>Signed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientContracts.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <Link to={`/orders/${c.order_number}`} className="client-order-link">{c.order_number}</Link>
                          </td>
                          <td>{c.contract_type ?? '—'}</td>
                          <td>
                            <span className={`status-badge status-${String(c.status).toLowerCase().replace(/\s+/g, '-')}`}>
                              {c.status}
                            </span>
                          </td>
                          <td>{c.generated_at ? new Date(c.generated_at).toLocaleDateString() : '—'}</td>
                          <td>{c.signed_at ? new Date(c.signed_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invoices Section */}
            {clientInvoices.length > 0 && (
              <div className="form-section">
                <h3 className="section-title">Invoices</h3>
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order Number</th>
                        <th>Invoice Number</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td>
                            <Link to={`/orders/${inv.order_number}`} className="client-order-link">{inv.order_number}</Link>
                          </td>
                          <td>{inv.invoice_number ?? '—'}</td>
                          <td>
                            <span className={`status-badge status-${String(inv.status).toLowerCase().replace(/\s+/g, '-')}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}</td>
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
              {saveError && <p className="create-order-error" style={{ marginBottom: '1rem' }} role="alert">{saveError}</p>}
              <button type="button" className="cancel-button" onClick={() => navigate('/client')}>
                Cancel
              </button>
              <button
                type="button"
                className="update-button"
                disabled={saving || useFallback || !clientIdNum}
                onClick={async () => {
                  if (useFallback || !clientIdNum) { navigate('/client'); return; }
                  setSaveError('');
                  setSaving(true);
                  try {
                    await updateClient(clientIdNum, {
                      employee_name: employee.trim() || null,
                      start_date: startDate.trim() || null,
                      point_of_contact: pointOfContact.trim(),
                      contact_email: contactEmail.trim() || null,
                      contact_phone: contactPhone.trim() || null,
                      billing_address: billingAddress.trim() || null,
                      site_location: siteLocationAddress.trim() || null,
                      notes: notes.trim() || null,
                    });
                    navigate('/client');
                  } catch (err) {
                    setSaveError(err instanceof Error ? err.message : 'Failed to update client.');
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? 'Saving…' : 'Update'}
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
                  options={verifiedUsers.map((u) => u.username)}
                  value={editEmployee}
                  onChange={(value) => {
                    setEditEmployee(value);
                    const u = verifiedUsers.find((x) => x.username === value);
                    setEditSelectedUserId(u ? u.id : null);
                  }}
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

              {saveError && <p className="create-order-error" role="alert">{saveError}</p>}
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={handleClientInfoCancel} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="update-button" onClick={handleClientInfoSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
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

              {saveError && <p className="create-order-error" role="alert">{saveError}</p>}
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={handleContactInfoCancel} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="update-button" onClick={handleContactInfoSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
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
