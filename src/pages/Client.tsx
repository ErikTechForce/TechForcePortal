import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { fetchClients, createClient, type ClientRow } from '../api/clients';
import { fetchVerifiedUsers, type VerifiedUser } from '../api/users';
import { clients as staticClients, type Client as StaticClient } from '../data/clients';
import { leads as staticLeads, type Lead } from '../data/leads';
import { getInventoryProducts } from '../data/inventory';
import './Page.css';
import './Client.css';
import './ClientDetail.css';

const Client: React.FC = () => {
  const navigate = useNavigate();
  const [apiClients, setApiClients] = useState<ClientRow[]>([]);
  const [apiLeads, setApiLeads] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formType, setFormType] = useState<'client' | 'lead'>('client');
  const [formCompany, setFormCompany] = useState('');
  const [formPointOfContact, setFormPointOfContact] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formBillingAddress, setFormBillingAddress] = useState('');
  const [formSiteLocation, setFormSiteLocation] = useState('');
  const [formSource, setFormSource] = useState('');
  const [formEmployeeName, setFormEmployeeName] = useState('');
  const [formSelectedUserId, setFormSelectedUserId] = useState<number | null>(null);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const loadLists = async () => {
    try {
      const [clientsRes, leadsRes] = await Promise.all([
        fetchClients('client'),
        fetchClients('lead'),
      ]);
      setApiClients(clientsRes);
      setApiLeads(leadsRes);
      setUseFallback(false);
    } catch {
      setUseFallback(true);
      setApiClients([]);
      setApiLeads([]);
    }
  };

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
    let cancelled = false;
    (async () => {
      await loadLists();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const clientsList = useFallback ? staticClients : apiClients;
  const leadsList = useFallback ? staticLeads : apiLeads;

  const searchLower = clientSearchQuery.trim().toLowerCase();
  const filteredClients = useMemo(() => {
    if (!searchLower) return clientsList;
    const list = clientsList as (StaticClient | ClientRow)[];
    return list.filter((c: StaticClient | ClientRow) => {
      const company = useFallback ? (c as StaticClient).company : (c as ClientRow).company;
      const employee = useFallback ? (c as StaticClient).employee : (c as ClientRow).employee_name;
      const poc = useFallback ? (c as StaticClient).pointOfContact : (c as ClientRow).point_of_contact;
      const product = useFallback ? (c as StaticClient).product : (c as ClientRow).product;
      return [company, employee, poc, product].some((v) => (v ?? '').toLowerCase().includes(searchLower));
    });
  }, [clientsList, searchLower, useFallback]);
  const filteredLeads = useMemo(() => {
    if (!searchLower) return leadsList;
    const list = leadsList as (Lead | ClientRow)[];
    return list.filter((l: Lead | ClientRow) => {
      const company = useFallback ? (l as Lead).companyName : (l as ClientRow).company;
      const poc = useFallback ? (l as Lead).pointOfContact : (l as ClientRow).point_of_contact;
      const email = (l as ClientRow).contact_email;
      const phone = (l as ClientRow).contact_phone;
      const contactInfo = useFallback ? (l as Lead).contactInformation : '';
      const source = useFallback ? (l as Lead).source : (l as ClientRow).source;
      return [company, poc, email, phone, contactInfo, source].some((v) => (v ?? '').toLowerCase().includes(searchLower));
    });
  }, [leadsList, searchLower, useFallback]);

  const inventoryProductNames = useMemo(
    () => Array.from(new Set(getInventoryProducts().map((p) => p.name))),
    []
  );

  const handleClientClick = (clientId: number) => {
    navigate(`/client/${clientId}`);
  };

  const handleLeadClick = (leadId: number) => {
    navigate(`/lead/${leadId}`);
  };

  const openAddModal = () => {
    setFormType('client');
    setFormCompany('');
    setFormPointOfContact('');
    setFormContactEmail('');
    setFormContactPhone('');
    setFormProduct('');
    setFormNotes('');
    setFormStartDate('');
    setFormBillingAddress('');
    setFormSiteLocation('');
    setFormSource('');
    setFormEmployeeName('');
    setSubmitError('');
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setSubmitError('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const company = formCompany.trim();
    const pointOfContact = formPointOfContact.trim();
    if (!company) {
      setSubmitError('Company is required.');
      return;
    }
    if (!pointOfContact) {
      setSubmitError('Point of contact is required.');
      return;
    }
    if (formType === 'lead' && !formSource.trim()) {
      setSubmitError('Source is required for leads.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createClient({
        company,
        type: formType,
        point_of_contact: pointOfContact,
        contact_email: formContactEmail.trim() || undefined,
        contact_phone: formContactPhone.trim() || undefined,
        product: formProduct.trim() || undefined,
        notes: formNotes.trim() || undefined,
        start_date: formStartDate.trim() || undefined,
        billing_address: formBillingAddress.trim() || undefined,
        site_location: formSiteLocation.trim() || undefined,
        source: formType === 'lead' ? formSource.trim() || undefined : undefined,
        ...(formType === 'client' && formSelectedUserId != null
          ? { user_id: formSelectedUserId }
          : formType === 'client'
            ? { employee_name: formEmployeeName.trim() || undefined }
            : {}),
      });
      if (formType === 'client') {
        setApiClients((prev) => [...prev, created]);
      } else {
        setApiLeads((prev) => [...prev, created]);
      }
      closeAddModal();
      if (!useFallback) {
        await loadLists();
      }
      navigate(formType === 'client' ? `/client/${created.id}` : `/lead/${created.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add. Try again.');
    } finally {
      setSubmitting(false);
    }
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
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                aria-label="Search clients and leads"
              />
            </div>

            <div className="client-button-row client-button-row--top">
              <button type="button" className="add-client-button" onClick={openAddModal}>
                + Add Client
              </button>
            </div>

            {loading ? (
              <p className="page-subtitle">Loading clients...</p>
            ) : (
              <>
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
                      {filteredClients.map((client) => (
                        <tr
                          key={client.id}
                          onClick={() => handleClientClick(client.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{useFallback ? client.company : (client as ClientRow).company}</td>
                          <td>
                            {useFallback
                              ? (client as { employee?: string | null }).employee || 'unassigned'
                              : (client as ClientRow).employee_name || 'unassigned'}
                          </td>
                          <td>{useFallback ? (client as { pointOfContact: string }).pointOfContact : (client as ClientRow).point_of_contact}</td>
                          <td>{useFallback ? (client as { product: string }).product : (client as ClientRow).product ?? ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredClients.length === 0 && (
                    <p className="page-subtitle">{clientsList.length === 0 ? 'No clients yet.' : 'No clients match your search.'}</p>
                  )}
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
                      {filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => handleLeadClick(lead.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{useFallback ? (lead as { companyName: string }).companyName : (lead as ClientRow).company}</td>
                          <td>{useFallback ? (lead as { pointOfContact: string }).pointOfContact : (lead as ClientRow).point_of_contact}</td>
                          <td>
                            {useFallback
                              ? (lead as { contactInformation: string }).contactInformation
                              : [(lead as ClientRow).contact_email, (lead as ClientRow).contact_phone]
                                  .filter(Boolean)
                                  .join(' | ') || '—'}
                          </td>
                          <td>{useFallback ? (lead as { source: string }).source : (lead as ClientRow).source ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLeads.length === 0 && (
                    <p className="page-subtitle">{leadsList.length === 0 ? 'No leads yet.' : 'No leads match your search.'}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {addModalOpen && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Client or Lead</h3>
              <button type="button" className="modal-close-button" onClick={closeAddModal} aria-label="Close">
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleAddSubmit}>
              <div className="form-group">
                <span className="form-label">Add as</span>
                <div className="add-client-type-row">
                  <label className="add-client-radio-label">
                    <input
                      type="radio"
                      name="formType"
                      checked={formType === 'client'}
                      onChange={() => setFormType('client')}
                    />
                    Client
                  </label>
                  <label className="add-client-radio-label">
                    <input
                      type="radio"
                      name="formType"
                      checked={formType === 'lead'}
                      onChange={() => setFormType('lead')}
                    />
                    Lead
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="add-company" className="form-label">Company *</label>
                <input
                  id="add-company"
                  type="text"
                  className="form-input"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  required
                  placeholder="Company name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="add-poc" className="form-label">Point of Contact *</label>
                <input
                  id="add-poc"
                  type="text"
                  className="form-input"
                  value={formPointOfContact}
                  onChange={(e) => setFormPointOfContact(e.target.value)}
                  required
                  placeholder="Full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="add-email" className="form-label">Email</label>
                <input
                  id="add-email"
                  type="email"
                  className="form-input"
                  value={formContactEmail}
                  onChange={(e) => setFormContactEmail(e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="add-phone" className="form-label">Phone</label>
                <input
                  id="add-phone"
                  type="tel"
                  className="form-input"
                  value={formContactPhone}
                  onChange={(e) => setFormContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {formType === 'lead' && (
                <div className="form-group">
                  <label htmlFor="add-source" className="form-label">Source *</label>
                  <input
                    id="add-source"
                    type="text"
                    className="form-input"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    required={formType === 'lead'}
                    placeholder="e.g. LinkedIn, Referral"
                  />
                </div>
              )}

              {formType === 'client' && (
                <>
                  <div className="form-group">
                    <label htmlFor="add-employee" className="form-label">Assigned Employee</label>
                    <SearchableDropdown
                      options={verifiedUsers.map((u) => u.username)}
                      value={formEmployeeName}
                      onChange={(display) => {
                        setFormEmployeeName(display);
                        const u = verifiedUsers.find((x) => x.username === display);
                        setFormSelectedUserId(u ? u.id : null);
                      }}
                      placeholder="Select employee..."
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-product" className="form-label">Product</label>
                    <SearchableDropdown
                      options={inventoryProductNames}
                      value={formProduct}
                      onChange={setFormProduct}
                      placeholder="Select product..."
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-start-date" className="form-label">Start Date</label>
                    <input
                      id="add-start-date"
                      type="date"
                      className="form-input"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-billing" className="form-label">Billing Address</label>
                    <textarea
                      id="add-billing"
                      className="form-textarea"
                      value={formBillingAddress}
                      onChange={(e) => setFormBillingAddress(e.target.value)}
                      rows={2}
                      placeholder="Street, City, State, ZIP"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-site" className="form-label">Site Location</label>
                    <textarea
                      id="add-site"
                      className="form-textarea"
                      value={formSiteLocation}
                      onChange={(e) => setFormSiteLocation(e.target.value)}
                      rows={2}
                      placeholder="Installation or service address"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="add-notes" className="form-label">Notes</label>
                <textarea
                  id="add-notes"
                  className="form-textarea"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              {submitError && (
                <p className="add-client-error" role="alert">{submitError}</p>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeAddModal}>
                  Cancel
                </button>
                <button type="submit" className="update-button" disabled={submitting}>
                  {submitting ? 'Adding…' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Client;


