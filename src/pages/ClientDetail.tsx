import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import SearchableDropdown from '../components/SearchableDropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { fetchClientById, fetchClientOrders, fetchClientContracts, fetchClientInvoices, fetchClientNotes, fetchClientTasks, createClientNote, updateClientNote, deleteClientNote, updateClient, deleteClient, type ClientRow, type OrderRow, type ContractRow, type InvoiceRow, type ClientNoteRow, type ClientTaskOption } from '../api/clients';
import { fetchVerifiedUsers, type VerifiedUser } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { INDUSTRIES } from '../constants/industries';
import './Page.css';
import './ClientDetail.css';
import './Orders.css';

const ClientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clientId } = useParams<{ clientId: string }>();
  const clientIdNum = clientId ? parseInt(clientId, 10) : null;

  const [apiClient, setApiClient] = useState<ClientRow | null>(null);
  const [clientOrders, setClientOrders] = useState<OrderRow[]>([]);
  const [clientContracts, setClientContracts] = useState<ContractRow[]>([]);
  const [clientInvoices, setClientInvoices] = useState<InvoiceRow[]>([]);
  const [clientNotes, setClientNotes] = useState<ClientNoteRow[]>([]);
  const [clientTasks, setClientTasks] = useState<ClientTaskOption[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    products: false,
    orders: false,
    contracts: false,
    invoices: false,
    notes: false,
  });
  const toggleSection = (key: string) =>
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteTaskId, setNewNoteTaskId] = useState<number | ''>('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteTaskId, setEditNoteTaskId] = useState<number | ''>('');
  const [noteEditError, setNoteEditError] = useState('');
  const [noteUpdating, setNoteUpdating] = useState(false);
  const [isDeleteNoteModalOpen, setIsDeleteNoteModalOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [noteDeleting, setNoteDeleting] = useState(false);
  const [noteDeleteError, setNoteDeleteError] = useState('');

  const clientData = apiClient;

  const [company, setCompany] = useState('');
  const [employee, setEmployee] = useState('');
  const [pointOfContact, setPointOfContact] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [siteLocationAddress, setSiteLocationAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [industry, setIndustry] = useState('');

  // Edit modal state (combined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState('');
  const [editSelectedUserId, setEditSelectedUserId] = useState<number | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editPointOfContact, setEditPointOfContact] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [clientMessage, setClientMessage] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editBillingAddress, setEditBillingAddress] = useState('');
  const [editSiteLocationAddress, setEditSiteLocationAddress] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDeleteClient = async () => {
    if (!clientIdNum) return;
    setDeleting(true);
    try {
      await deleteClient(clientIdNum);
      navigate('/client');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete client.');
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const ordersList = clientOrders;

  // Order line items (products) are not exposed by the API for client orders; show empty for now
  const clientProducts: Array<{ product: { id: number; productName: string; serialNumber?: string; status?: string }; orderNumber: string }> = useMemo(() => [], []);

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
        const settled = await Promise.allSettled([
          fetchClientOrders(clientIdNum),
          fetchClientContracts(clientIdNum),
          fetchClientInvoices(clientIdNum),
          fetchClientNotes(clientIdNum),
          fetchClientTasks(clientIdNum),
        ]);
        if (!cancelled) {
          setClientOrders(settled[0].status === 'fulfilled' ? settled[0].value : []);
          setClientContracts(settled[1].status === 'fulfilled' ? settled[1].value : []);
          setClientInvoices(settled[2].status === 'fulfilled' ? settled[2].value : []);
          setClientNotes(settled[3].status === 'fulfilled' ? settled[3].value : []);
          setClientTasks(settled[4].status === 'fulfilled' ? settled[4].value : []);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setApiClient(null);
          setClientOrders([]);
          setClientContracts([]);
          setClientInvoices([]);
          setClientNotes([]);
          setClientTasks([]);
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
      const industryVal = 'industry' in clientData ? (clientData as ClientRow).industry ?? '' : '';

      setCompany(companyVal);
      setEmployee(employeeVal ?? '');
      setPointOfContact(pocVal);
      setContactEmail(emailVal ?? '');
      setContactPhone(phoneVal ?? '');
      setNotes(notesVal);
      setStartDate(startVal ?? '');
      setBillingAddress(billingVal);
      setSiteLocationAddress(siteVal);
      setIndustry(industryVal);

      setEditEmployee(employeeVal ?? '');
      setEditStartDate(startVal ?? '');
      setEditIndustry(industryVal);
      setEditPointOfContact(pocVal);
      setEditContactEmail(emailVal ?? '');
      setEditContactPhone(phoneVal ?? '');
      setEditBillingAddress(billingVal);
      setEditSiteLocationAddress(siteVal);
    }
  }, [clientData]);

  useEffect(() => {
    if (!clientData || verifiedUsers.length === 0) return;
    const employeeName = 'employee_name' in clientData ? (clientData as ClientRow).employee_name : (clientData as { employee?: string }).employee;
    const name = employeeName ?? '';
    const u = verifiedUsers.find((x) => x.username === name);
    setEditSelectedUserId(u ? u.id : null);
  }, [clientData, verifiedUsers]);

  const [editNotes, setEditNotes] = useState('');

  const handleEditClick = () => {
    setSaveError('');
    setEditIndustry(industry);
    setEditNotes(notes);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    setSaveError('');
    if (!clientIdNum) {
      setEmployee(editEmployee);
      setStartDate(editStartDate);
      setPointOfContact(editPointOfContact);
      setContactEmail(editContactEmail);
      setContactPhone(editContactPhone);
      setBillingAddress(editBillingAddress);
      setSiteLocationAddress(editSiteLocationAddress);
      setIsEditModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      const payload: Parameters<typeof updateClient>[1] = {
        start_date: editStartDate.trim() || null,
        industry: editIndustry.trim() || null,
        point_of_contact: editPointOfContact.trim(),
        contact_email: editContactEmail.trim() || null,
        contact_phone: editContactPhone.trim() || null,
        billing_address: editBillingAddress.trim() || null,
        site_location: editSiteLocationAddress.trim() || null,
        notes: editNotes.trim() || null,
      };
      if (editSelectedUserId != null) payload.user_id = editSelectedUserId;
      else if (editEmployee.trim()) payload.employee_name = editEmployee.trim();
      else payload.employee_name = null;
      const updated = await updateClient(clientIdNum, payload);
      setApiClient(updated);
      setEmployee(updated.employee_name ?? '');
      setStartDate(updated.start_date ?? '');
      setIndustry(updated.industry ?? '');
      setPointOfContact(updated.point_of_contact);
      setContactEmail(updated.contact_email ?? '');
      setContactPhone(updated.contact_phone ?? '');
      setBillingAddress(updated.billing_address ?? '');
      setSiteLocationAddress(updated.site_location ?? '');
      setEditEmployee(updated.employee_name ?? '');
      setEditStartDate(updated.start_date ?? '');
      setEditIndustry(updated.industry ?? '');
      setEditPointOfContact(updated.point_of_contact);
      setEditContactEmail(updated.contact_email ?? '');
      setEditContactPhone(updated.contact_phone ?? '');
      setEditBillingAddress(updated.billing_address ?? '');
      setEditSiteLocationAddress(updated.site_location ?? '');
      setNotes(updated.notes ?? '');
      setEditNotes(updated.notes ?? '');
      setIsEditModalOpen(false);
      setClientMessage('Client updated successfully.');
      setTimeout(() => setClientMessage(''), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update client.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditEmployee(employee);
    setEditStartDate(startDate);
    setEditIndustry(industry);
    setEditPointOfContact(pointOfContact);
    setEditContactEmail(contactEmail);
    setEditContactPhone(contactPhone);
    setEditBillingAddress(billingAddress);
    setEditSiteLocationAddress(siteLocationAddress);
    setEditNotes(notes);
    setSaveError('');
    setIsEditModalOpen(false);
  };

  if (loading && !clientData) {
    return (
      <div className="page-container">
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
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <PageHeader
            title={company || 'Client Details'}
            subtitle="View and update client information"
            onBack={() => navigate('/client')}
            backLabel="Back"
          />
          <div className="page-content">
            {/* Combined Client Information Card */}
            <div className="client-info-card">
              <div className="client-info-header">
                <h3 className="section-title">Client Information</h3>
                <div className="client-action-buttons">
                  <button
                    type="button"
                    className="client-action-btn client-action-btn--edit"
                    data-tooltip="Edit client"
                    onClick={handleEditClick}
                    aria-label="Edit client"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  <button
                    type="button"
                    className="client-action-btn client-action-btn--delete"
                    data-tooltip="Delete client"
                    onClick={() => setDeleteModalOpen(true)}
                    aria-label="Delete client"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
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
                <div className="client-info-item">
                  <label className="client-info-label">Industry</label>
                  <div className="client-info-value">{industry || '—'}</div>
                </div>
              </div>

              <hr className="client-info-divider" />

              <h4 className="client-info-subsection-title">Point of Contact</h4>
              <div className="client-info-grid">
                <div className="client-info-item">
                  <label className="client-info-label">Name</label>
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

              {notes && (
                <>
                  <hr className="client-info-divider" />
                  <h4 className="client-info-subsection-title">Notes</h4>
                  <p className="client-info-value" style={{ whiteSpace: 'pre-wrap' }}>{notes}</p>
                </>
              )}
            </div>

            {clientMessage && (
              <p
                className="update-message-banner settings-success"
                role="alert"
                style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}
              >
                {clientMessage}
              </p>
            )}

            {/* Products Section */}
            {clientProducts.length > 0 && (
              <div className="order-detail-table-section">
                <div className="collapsible-header" onClick={() => toggleSection('products')}>
                  <h3 className="section-title">Products</h3>
                  <span className={`collapse-arrow${!collapsedSections.products ? ' collapse-arrow--open' : ''}`}>▶</span>
                </div>
                {!collapsedSections.products && <div className="orders-table-wrapper">
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
                          <td data-label="Order Number">
                            <Link to={`/orders/${orderNumber}`} className="client-order-link">{orderNumber}</Link>
                          </td>
                          <td data-label="Product">{product.productName}</td>
                          <td data-label="Serial Number">{product.serialNumber || 'N/A'}</td>
                          <td data-label="Status">
                            <span className={`status-badge status-${(product.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                              {product.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>}
              </div>
            )}

            {/* Orders Section */}
            {ordersList.length > 0 && (
              <div className="order-detail-table-section">
                <div className="collapsible-header" onClick={() => toggleSection('orders')}>
                  <h3 className="section-title">Orders</h3>
                  <span className={`collapse-arrow${!collapsedSections.orders ? ' collapse-arrow--open' : ''}`}>▶</span>
                </div>
                {!collapsedSections.orders && (
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
                            <td data-label="Order Number">
                              <Link to={`/orders/${orderNumber}`} className="client-order-link">{orderNumber}</Link>
                            </td>
                            <td data-label="Stage">{category}</td>
                            <td data-label="Status">
                              <span className={`status-badge status-${String(status).toLowerCase().replace(/\s+/g, '-')}`}>
                                {status}
                              </span>
                            </td>
                            <td data-label="Employee">{emp || 'unassigned'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}

            {/* Contracts Section */}
            {clientContracts.length > 0 && (
              <div className="order-detail-table-section">
                <div className="collapsible-header" onClick={() => toggleSection('contracts')}>
                  <h3 className="section-title">Contracts</h3>
                  <span className={`collapse-arrow${!collapsedSections.contracts ? ' collapse-arrow--open' : ''}`}>▶</span>
                </div>
                {!collapsedSections.contracts && (
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
                          <td data-label="Order Number">
                            <Link to={`/orders/${c.order_number}`} className="client-order-link">{c.order_number}</Link>
                          </td>
                          <td data-label="Type">{c.contract_type ?? '—'}</td>
                          <td data-label="Status">
                            <span className={`status-badge status-${String(c.status).toLowerCase().replace(/\s+/g, '-')}`}>
                              {c.status}
                            </span>
                          </td>
                          <td data-label="Generated">{c.generated_at ? new Date(c.generated_at).toLocaleDateString() : '—'}</td>
                          <td data-label="Signed">{c.signed_at ? new Date(c.signed_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}

            {/* Invoices Section */}
            {clientInvoices.length > 0 && (
              <div className="order-detail-table-section">
                <div className="collapsible-header" onClick={() => toggleSection('invoices')}>
                  <h3 className="section-title">Invoices</h3>
                  <span className={`collapse-arrow${!collapsedSections.invoices ? ' collapse-arrow--open' : ''}`}>▶</span>
                </div>
                {!collapsedSections.invoices && (
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
                          <td data-label="Order Number">
                            <Link to={`/orders/${inv.order_number}`} className="client-order-link">{inv.order_number}</Link>
                          </td>
                          <td data-label="Invoice Number">{inv.invoice_number ?? '—'}</td>
                          <td data-label="Status">
                            <span className={`status-badge status-${String(inv.status).toLowerCase().replace(/\s+/g, '-')}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td data-label="Date">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}

            {/* Notes Section */}
            <div className="order-detail-table-section">
              <div className="collapsible-header">
                <div className="collapsible-header-left" onClick={() => toggleSection('notes')}>
                  <h3 className="section-title">Notes</h3>
                  <span className={`collapse-arrow${!collapsedSections.notes ? ' collapse-arrow--open' : ''}`}>▶</span>
                </div>
                <button
                  type="button"
                  className="section-header-btn"
                  onClick={() => setIsAddNoteModalOpen(true)}
                >
                  + Add Note
                </button>
              </div>
              {!collapsedSections.notes && (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Date &amp; Time</th>
                        <th>Task</th>
                        <th>Note</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientNotes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="client-notes-empty">No notes yet.</td>
                        </tr>
                      ) : (
                        clientNotes.map((n) => (
                          <tr key={n.id}>
                            <td>{n.submitted_by ?? '—'}</td>
                            <td>{n.created_at ? new Date(n.created_at).toLocaleString() : '—'}</td>
                            <td>{n.task_id && n.task_name ? <Link to={`/tasks/${n.task_id}`}>{n.task_name}</Link> : '—'}</td>
                            <td className="client-notes-note-cell">{n.note}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                {user && n.user_id === user.id ? (
                                  <button
                                    type="button"
                                    className="client-action-btn client-action-btn--edit"
                                    data-tooltip="Edit note"
                                    aria-label="Edit note"
                                    onClick={() => {
                                      setEditingNoteId(n.id);
                                      setEditNoteText(n.note);
                                      setEditNoteTaskId(n.task_id ?? '');
                                      setNoteEditError('');
                                      setIsEditNoteModalOpen(true);
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                  </button>
                                ) : null}
                                {user && n.user_id === user.id ? (
                                  <button
                                    type="button"
                                    className="client-action-btn client-action-btn--delete"
                                    data-tooltip="Delete note"
                                    aria-label="Delete note"
                                    onClick={() => {
                                      setDeletingNoteId(n.id);
                                      setNoteDeleteError('');
                                      setIsDeleteNoteModalOpen(true);
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Client" narrow>
        <div className="modal-body">
          <p style={{ marginBottom: '1rem' }}>
            Are you sure you want to delete <strong>{company}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="client-delete-confirm-btn"
            disabled={deleting}
            onClick={handleDeleteClient}
          >
            {deleting ? 'Deleting…' : 'Delete Client'}
          </button>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={isAddNoteModalOpen}
        onClose={() => { setIsAddNoteModalOpen(false); setNewNote(''); setNewNoteTaskId(''); setNoteError(''); }}
        title="Add Note"
        narrow
      >
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="new-note" className="form-label">Note</label>
            <textarea
              id="new-note"
              className="form-textarea"
              value={newNote}
              onChange={(e) => { setNewNote(e.target.value); setNoteError(''); }}
              rows={4}
              placeholder="Enter a note..."
              disabled={noteSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-note-task" className="form-label">Attach to task (optional)</label>
            <select
              id="new-note-task"
              className="form-select"
              value={newNoteTaskId}
              onChange={(e) => setNewNoteTaskId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={noteSubmitting}
            >
              <option value="">None</option>
              {clientTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
              ))}
            </select>
            {clientTasks.length === 0 && (
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--text-muted, #666)' }}>
                No tasks linked to this client yet.
              </p>
            )}
          </div>
          {noteError && <p className="create-order-error" role="alert">{noteError}</p>}
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="cancel-button"
            disabled={noteSubmitting}
            onClick={() => { setIsAddNoteModalOpen(false); setNewNote(''); setNewNoteTaskId(''); setNoteError(''); }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="update-button"
            disabled={noteSubmitting || !newNote.trim() || !user}
            onClick={async () => {
              if (!clientIdNum || !user) return;
              setNoteError('');
              setNoteSubmitting(true);
              try {
                const taskId = newNoteTaskId === '' ? undefined : newNoteTaskId;
                const created = await createClientNote(clientIdNum, newNote.trim(), user.id, taskId);
                setClientNotes((prev) => [created, ...prev]);
                setNewNote('');
                setNewNoteTaskId('');
                setIsAddNoteModalOpen(false);
              } catch (err) {
                setNoteError(err instanceof Error ? err.message : 'Failed to add note.');
              } finally {
                setNoteSubmitting(false);
              }
            }}
          >
            {noteSubmitting ? 'Submitting…' : 'Submit Note'}
          </button>
        </div>
      </Modal>

      {/* Edit Note Modal */}
      <Modal
        isOpen={isEditNoteModalOpen}
        onClose={() => { setIsEditNoteModalOpen(false); setEditingNoteId(null); setEditNoteText(''); setEditNoteTaskId(''); setNoteEditError(''); }}
        title="Edit Note"
        narrow
      >
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="edit-note-text" className="form-label">Note</label>
            <textarea
              id="edit-note-text"
              className="form-textarea"
              value={editNoteText}
              onChange={(e) => { setEditNoteText(e.target.value); setNoteEditError(''); }}
              rows={4}
              placeholder="Enter note..."
              disabled={noteUpdating}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-note-task" className="form-label">Attach to task (optional)</label>
            <select
              id="edit-note-task"
              className="form-select"
              value={editNoteTaskId}
              onChange={(e) => setEditNoteTaskId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={noteUpdating}
            >
              <option value="">None</option>
              {clientTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
              ))}
            </select>
          </div>
          {noteEditError && <p className="create-order-error" role="alert">{noteEditError}</p>}
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="cancel-button"
            disabled={noteUpdating}
            onClick={() => { setIsEditNoteModalOpen(false); setEditingNoteId(null); setEditNoteText(''); setEditNoteTaskId(''); setNoteEditError(''); }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="update-button"
            disabled={noteUpdating || !editNoteText.trim() || !user}
            onClick={async () => {
              if (!clientIdNum || !user || !editingNoteId) return;
              setNoteEditError('');
              setNoteUpdating(true);
              try {
                const taskId = editNoteTaskId === '' ? undefined : editNoteTaskId;
                const updated = await updateClientNote(clientIdNum, editingNoteId, editNoteText.trim(), user.id, taskId);
                setClientNotes((prev) => prev.map((note) => (note.id === editingNoteId ? updated : note)));
                setIsEditNoteModalOpen(false);
                setEditingNoteId(null);
                setEditNoteText('');
                setEditNoteTaskId('');
              } catch (err) {
                setNoteEditError(err instanceof Error ? err.message : 'Failed to update note.');
              } finally {
                setNoteUpdating(false);
              }
            }}
          >
            {noteUpdating ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Delete Note Confirmation Modal */}
      <Modal
        isOpen={isDeleteNoteModalOpen}
        onClose={() => { setIsDeleteNoteModalOpen(false); setDeletingNoteId(null); setNoteDeleteError(''); }}
        title="Delete Note"
        narrow
      >
        <div className="modal-body">
          <p style={{ marginBottom: '1rem' }}>Are you sure you want to delete this note? This action cannot be undone.</p>
          {noteDeleteError && <p className="create-order-error" role="alert">{noteDeleteError}</p>}
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="cancel-button"
            disabled={noteDeleting}
            onClick={() => { setIsDeleteNoteModalOpen(false); setDeletingNoteId(null); setNoteDeleteError(''); }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="client-delete-confirm-btn"
            disabled={noteDeleting}
            onClick={async () => {
              if (!clientIdNum || !user || !deletingNoteId) return;
              setNoteDeleting(true);
              setNoteDeleteError('');
              try {
                await deleteClientNote(clientIdNum, deletingNoteId, user.id);
                setClientNotes((prev) => prev.filter((n) => n.id !== deletingNoteId));
                setIsDeleteNoteModalOpen(false);
                setDeletingNoteId(null);
              } catch (err) {
                setNoteDeleteError(err instanceof Error ? err.message : 'Failed to delete note.');
              } finally {
                setNoteDeleting(false);
              }
            }}
          >
            {noteDeleting ? 'Deleting…' : 'Delete Note'}
          </button>
        </div>
      </Modal>

      {/* Combined Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleEditCancel} title="Edit Client Information">
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="edit-company" className="form-label">Company</label>
            <input type="text" id="edit-company" className="form-input" value={company} disabled readOnly />
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
          <div className="form-group">
            <label htmlFor="edit-industry" className="form-label">Industry</label>
            <SearchableDropdown
              options={INDUSTRIES}
              value={editIndustry}
              onChange={setEditIndustry}
              placeholder="Type to search or enter industry..."
            />
          </div>

          <hr style={{ margin: '1.25rem 0', borderColor: '#e5e7eb' }} />

          <div className="form-group">
            <label htmlFor="edit-point-of-contact" className="form-label">Point of Contact</label>
            <input
              type="text"
              id="edit-point-of-contact"
              className="form-input"
              value={editPointOfContact}
              onChange={(e) => setEditPointOfContact(e.target.value)}
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

          <hr style={{ margin: '1.25rem 0', borderColor: '#e5e7eb' }} />

          <div className="form-group">
            <label htmlFor="edit-notes" className="form-label">Notes</label>
            <textarea
              id="edit-notes"
              className="form-textarea"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={4}
              placeholder="Additional notes about this client..."
            />
          </div>

          {saveError && <p className="create-order-error" role="alert" style={{ marginTop: '0.5rem' }}>{saveError}</p>}
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={handleEditCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="update-button" onClick={handleEditSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ClientDetail;
