import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { fetchClients, createClient, type ClientRow } from '../api/clients';
import { createOrder } from '../api/orderApi';
import { fetchVerifiedUsers, type VerifiedUser } from '../api/users';
import './Page.css';
import './Orders.css';
import './ClientDetail.css';

type CompanySource = 'manual' | 'client_lead';

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [source, setSource] = useState<CompanySource>('manual');
  const [manualCompany, setManualCompany] = useState('');
  const [pointOfContact, setPointOfContact] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [siteStreet, setSiteStreet] = useState('');
  const [siteCity, setSiteCity] = useState('');
  const [siteState, setSiteState] = useState('');
  const [siteZip, setSiteZip] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [clientsAndLeads, setClientsAndLeads] = useState<ClientRow[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    if (source !== 'client_lead') return;
    let cancelled = false;
    setLoadingClients(true);
    (async () => {
      try {
        const [clients, leads] = await Promise.all([
          fetchClients('client'),
          fetchClients('lead'),
        ]);
        if (!cancelled) setClientsAndLeads([...clients, ...leads]);
      } catch {
        if (!cancelled) setClientsAndLeads([]);
      } finally {
        if (!cancelled) setLoadingClients(false);
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  const companyName = source === 'manual' ? manualCompany.trim() : selectedCompany.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!companyName) {
      setError(source === 'manual' ? 'Enter company name.' : 'Select a client or lead.');
      return;
    }
    if (source === 'manual' && !pointOfContact.trim()) {
      setError('Point of contact is required when entering company information.');
      return;
    }
    setSubmitting(true);
    try {
      if (source === 'manual') {
        const siteLocationParts = [siteStreet.trim(), siteCity.trim(), siteState.trim(), siteZip.trim()].filter(Boolean);
        const siteLocation = siteLocationParts.length > 0 ? siteLocationParts.join(', ') : undefined;
        try {
          await createClient({
            company: companyName,
            type: 'client',
            point_of_contact: pointOfContact.trim(),
            contact_email: contactEmail.trim() || undefined,
            contact_phone: contactPhone.trim() || undefined,
            site_location: siteLocation,
            ...(selectedUserId != null ? { user_id: selectedUserId } : { employee_name: employeeName.trim() || undefined }),
          });
        } catch (clientErr: unknown) {
          const msg = clientErr instanceof Error ? clientErr.message : '';
          if (msg.includes('already exists') || msg.includes('409')) {
            // Client with this company exists; proceed to create order
          } else {
            throw clientErr;
          }
        }
      }
      const order = await createOrder({
        company_name: companyName,
        ...(selectedUserId != null ? { user_id: selectedUserId } : { employee_name: employeeName.trim() || undefined }),
      });
      navigate(`/orders/${order.order_number}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order.');
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
            <h2 className="page-title">Create New Order</h2>
            <p className="page-subtitle">Create an order starting at the Contract stage.</p>

            <form onSubmit={handleSubmit} className="client-detail-form" style={{ maxWidth: '560px' }}>
              <div className="form-section">
                <h3 className="section-title">Company</h3>
                <div className="form-group">
                  <span className="form-label">Company source</span>
                  <div className="create-order-source-row">
                    <label className="create-order-radio-label">
                      <input
                        type="radio"
                        name="source"
                        checked={source === 'manual'}
                        onChange={() => setSource('manual')}
                      />
                      Enter company information
                    </label>
                    <label className="create-order-radio-label">
                      <input
                        type="radio"
                        name="source"
                        checked={source === 'client_lead'}
                        onChange={() => setSource('client_lead')}
                      />
                      Select a client or lead
                    </label>
                  </div>
                </div>

                {source === 'manual' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="create-order-company" className="form-label">Company name *</label>
                      <input
                        id="create-order-company"
                        type="text"
                        className="form-input"
                        value={manualCompany}
                        onChange={(e) => setManualCompany(e.target.value)}
                        required
                        placeholder="e.g. Acme Corporation"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="create-order-poc" className="form-label">Point of contact *</label>
                      <input
                        id="create-order-poc"
                        type="text"
                        className="form-input"
                        value={pointOfContact}
                        onChange={(e) => setPointOfContact(e.target.value)}
                        required
                        placeholder="Full name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="create-order-email" className="form-label">Email</label>
                      <input
                        id="create-order-email"
                        type="email"
                        className="form-input"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="create-order-phone" className="form-label">Phone number</label>
                      <input
                        id="create-order-phone"
                        type="tel"
                        className="form-input"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="form-group">
                      <span className="form-label">Site location</span>
                      <div className="create-order-site-grid">
                        <input
                          type="text"
                          className="form-input"
                          value={siteStreet}
                          onChange={(e) => setSiteStreet(e.target.value)}
                          placeholder="Street address"
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={siteCity}
                          onChange={(e) => setSiteCity(e.target.value)}
                          placeholder="City"
                        />
                        <div className="create-order-site-state-zip">
                          <input
                            type="text"
                            className="form-input"
                            value={siteState}
                            onChange={(e) => setSiteState(e.target.value)}
                            placeholder="State"
                          />
                          <input
                            type="text"
                            className="form-input"
                            value={siteZip}
                            onChange={(e) => setSiteZip(e.target.value)}
                            placeholder="ZIP code"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {source === 'client_lead' && (
                  <div className="form-group">
                    <label htmlFor="create-order-client-lead" className="form-label">Client or lead *</label>
                    {loadingClients ? (
                      <p className="page-subtitle">Loading clients and leads...</p>
                    ) : (
                      <SearchableDropdown
                        options={clientsAndLeads.map((c) => `${c.company} (${c.type === 'client' ? 'Client' : 'Lead'})`)}
                        value={
                          selectedCompany
                            ? (() => {
                                const c = clientsAndLeads.find((x) => x.company === selectedCompany);
                                return c ? `${c.company} (${c.type === 'client' ? 'Client' : 'Lead'})` : selectedCompany;
                              })()
                            : ''
                        }
                        onChange={(display) => {
                          const c = clientsAndLeads.find((x) => `${x.company} (${x.type === 'client' ? 'Client' : 'Lead'})` === display);
                          if (c) {
                            setSelectedCompany(c.company);
                            if (c.type === 'client' && c.employee_name) {
                              setEmployeeName(c.employee_name);
                              const u = verifiedUsers.find((x) => x.username === c.employee_name);
                              setSelectedUserId(u ? u.id : null);
                            }
                          } else {
                            setSelectedCompany('');
                          }
                        }}
                        placeholder="Type to search company or client name..."
                        required={source === 'client_lead'}
                        noResultsMessage="No matching company. Use “Enter company information” to add new."
                      />
                    )}
                    {clientsAndLeads.length === 0 && !loadingClients && (
                      <p className="create-order-hint">No clients or leads in the database. Use “Enter company information” instead.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3 className="section-title">Assignment</h3>
                <div className="form-group">
                  <label htmlFor="create-order-employee" className="form-label">Assigned employee</label>
                  <SearchableDropdown
                    options={verifiedUsers.map((u) => u.username)}
                    value={employeeName}
                    onChange={(display) => {
                      setEmployeeName(display);
                      const u = verifiedUsers.find((x) => x.username === display);
                      setSelectedUserId(u ? u.id : null);
                    }}
                    placeholder="Select employee (optional)"
                  />
                </div>
              </div>

              {error && <p className="create-order-error" role="alert">{error}</p>}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => navigate('/orders')}
                >
                  Cancel
                </button>
                <button type="submit" className="update-button" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateOrder;
