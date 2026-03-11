import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import SearchableDropdown from '../components/SearchableDropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { fetchClientById, updateClient, deleteClient } from '../api/clients';
import { products } from '../data/tasks';
import './Page.css';
import './ClientDetail.css';
import './LeadDetail.css';

const LeadDetail: React.FC = () => {
  const navigate = useNavigate();
  const { leadId } = useParams<{ leadId: string }>();
  const leadIdNum = leadId ? parseInt(leadId, 10) : null;

  const [apiLead, setApiLead] = useState<Awaited<ReturnType<typeof fetchClientById>>>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const leadData = apiLead?.type === 'lead' ? apiLead : null;

  // Display state
  const [companyName, setCompanyName] = useState('');
  const [pointOfContact, setPointOfContact] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [source, setSource] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [productInterested, setProductInterested] = useState('');
  const [notes, setNotes] = useState('');

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState('');
  const [editPointOfContact, setEditPointOfContact] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editProduct, setEditProduct] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Update message
  const [leadMessage, setLeadMessage] = useState('');

  useEffect(() => {
    if (!leadIdNum) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const c = await fetchClientById(leadIdNum);
        if (cancelled) return;
        if (!c || c.type !== 'lead') {
          setNotFound(true);
          setApiLead(null);
        } else {
          setApiLead(c);
        }
      } catch {
        if (!cancelled) { setNotFound(true); setApiLead(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [leadIdNum]);

  useEffect(() => {
    if (!leadData) return;
    setCompanyName(leadData.company);
    setPointOfContact(leadData.point_of_contact);
    setContactEmail(leadData.contact_email ?? '');
    setSource(leadData.source ?? '');
    setPhoneNumber(leadData.contact_phone ?? '');
    setProductInterested(leadData.product ?? '');
    setNotes(leadData.notes ?? '');
  }, [leadData]);

  const [editNotes, setEditNotes] = useState('');

  const handleEditClick = () => {
    setSaveError('');
    setEditCompany(companyName);
    setEditPointOfContact(pointOfContact);
    setEditContactEmail(contactEmail);
    setEditPhone(phoneNumber);
    setEditSource(source);
    setEditProduct(productInterested);
    setEditNotes(notes);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!leadIdNum) return;
    setSaveError('');
    setSaving(true);
    try {
      const updated = await updateClient(leadIdNum, {
        point_of_contact: editPointOfContact.trim(),
        contact_email: editContactEmail.trim() || null,
        contact_phone: editPhone.trim() || null,
        source: editSource.trim() || null,
        product: editProduct.trim() || null,
        notes: editNotes.trim() || null,
      });
      setApiLead(updated);
      setCompanyName(updated.company);
      setPointOfContact(updated.point_of_contact);
      setContactEmail(updated.contact_email ?? '');
      setPhoneNumber(updated.contact_phone ?? '');
      setSource(updated.source ?? '');
      setProductInterested(updated.product ?? '');
      setNotes(updated.notes ?? '');
      setEditNotes(updated.notes ?? '');
      setIsEditModalOpen(false);
      setLeadMessage('Lead updated successfully.');
      setTimeout(() => setLeadMessage(''), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update lead.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    setSaveError('');
    setEditNotes(notes);
    setIsEditModalOpen(false);
  };

  const handleDeleteLead = async () => {
    if (!leadIdNum) return;
    setDeleting(true);
    try {
      await deleteClient(leadIdNum);
      navigate('/client');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete lead.');
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };


  if (loading && !leadData) {
    return (
      <div className="page-container">
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <h2 className="page-title">Lead Details</h2>
              <p className="page-subtitle">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (notFound || !leadData) {
    return (
      <div className="page-container">
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <h2 className="page-title">Lead Not Found</h2>
              <button className="back-button" onClick={() => navigate('/client')}>Back to Clients</button>
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
            title={companyName || 'Lead Details'}
            subtitle="View and update lead information"
            onBack={() => navigate('/client')}
            backLabel="Back"
          />
          <div className="page-content">
            {/* Lead info card */}
            <div className="lead-info-card">
              <div className="client-info-header">
                <h3 className="section-title">Lead Information</h3>
                <div className="client-action-buttons">
                  <button
                    type="button"
                    className="client-action-btn client-action-btn--edit"
                    data-tooltip="Edit lead"
                    onClick={handleEditClick}
                    aria-label="Edit lead"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  <button
                    type="button"
                    className="client-action-btn client-action-btn--delete"
                    data-tooltip="Delete lead"
                    onClick={() => setDeleteModalOpen(true)}
                    aria-label="Delete lead"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              <div className="client-info-grid">
                <div className="client-info-item">
                  <label className="client-info-label">Company</label>
                  <div className="client-info-value">{companyName}</div>
                </div>
                <div className="client-info-item">
                  <label className="client-info-label">Source</label>
                  <div className="client-info-value">{source || '—'}</div>
                </div>
                <div className="client-info-item">
                  <label className="client-info-label">Product Interested</label>
                  <div className="client-info-value">{productInterested || '—'}</div>
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
                  <div className="client-info-value">{phoneNumber || 'Not set'}</div>
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

            {leadMessage && (
              <p className="update-message-banner settings-success" role="alert" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                {leadMessage}
              </p>
            )}


          </div>
        </main>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleEditCancel} title="Edit Lead Information">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Company</label>
            <input type="text" className="form-input" value={editCompany} disabled readOnly />
          </div>
          <div className="form-group">
            <label htmlFor="lead-edit-source" className="form-label">Source</label>
            <input
              id="lead-edit-source" type="text" className="form-input"
              value={editSource} onChange={(e) => setEditSource(e.target.value)}
              placeholder="e.g. LinkedIn, Referral"
            />
          </div>
          <div className="form-group">
            <label htmlFor="lead-edit-product" className="form-label">Product Interested</label>
            <SearchableDropdown
              options={products}
              value={editProduct}
              onChange={setEditProduct}
              placeholder="Select or type product name..."
              required={false}
            />
          </div>

          <hr style={{ margin: '1.25rem 0', borderColor: '#e5e7eb' }} />

          <div className="form-group">
            <label htmlFor="lead-edit-poc" className="form-label">Point of Contact</label>
            <input
              id="lead-edit-poc" type="text" className="form-input"
              value={editPointOfContact} onChange={(e) => setEditPointOfContact(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="lead-edit-email" className="form-label">Email</label>
            <input
              id="lead-edit-email" type="email" className="form-input"
              value={editContactEmail} onChange={(e) => setEditContactEmail(e.target.value)}
              placeholder="contact@company.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="lead-edit-phone" className="form-label">Phone</label>
            <input
              id="lead-edit-phone" type="tel" className="form-input"
              value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <hr style={{ margin: '1.25rem 0', borderColor: '#e5e7eb' }} />

          <div className="form-group">
            <label htmlFor="lead-edit-notes" className="form-label">Notes</label>
            <textarea
              id="lead-edit-notes"
              className="form-textarea"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={4}
              placeholder="Additional notes about this lead..."
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Lead" narrow>
        <div className="modal-body">
          <p style={{ marginBottom: '1rem' }}>
            Are you sure you want to delete <strong>{companyName}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </button>
          <button type="button" className="client-delete-confirm-btn" disabled={deleting} onClick={handleDeleteLead}>
            {deleting ? 'Deleting…' : 'Delete Lead'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LeadDetail;
