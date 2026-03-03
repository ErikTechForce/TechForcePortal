import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import {
  getInventoryProducts,
  getProductAvailabilityAndInUse,
  addProduct,
  addInventoryUnit,
  type InventoryProduct,
  type ProductType,
} from '../data/inventory';
import {
  getOperationsInventory,
  setOperationsInventory,
  type OperationsInventoryRow,
} from '../data/timEInventoryList';
import './Page.css';
import './Inventory.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function parseValue(s: string): number {
  const cleaned = String(s).replace(/[$,]/g, '').trim();
  return Number(cleaned) || 0;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<InventoryProduct[]>(() => getInventoryProducts());
  const [operationsRows, setOperationsRows] = useState<OperationsInventoryRow[]>(() => getOperationsInventory());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalChoice, setAddModalChoice] = useState<'new-product' | 'add-inventory' | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductType, setNewProductType] = useState<ProductType>('Accessory');
  const [addInvProductId, setAddInvProductId] = useState('');
  const [addInvCountry, setAddInvCountry] = useState('');
  const [addInvModel, setAddInvModel] = useState('');
  const [addInvSerial, setAddInvSerial] = useState('');
  const [operationsEditIndex, setOperationsEditIndex] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState('');
  const [editAvailable, setEditAvailable] = useState('');
  const [editReplacementCost, setEditReplacementCost] = useState('');
  const [editValue, setEditValue] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  type FfeDoc = { id: string; fileName: string; type: 'receipt' | 'warranty'; dataUrl: string };
  /** FF&E documents for the currently open modal (item at operationsEditIndex). Loaded from API. */
  const [ffeDocumentsForEdit, setFfeDocumentsForEdit] = useState<FfeDoc[]>([]);

  useEffect(() => {
    if (operationsEditIndex === null) {
      setFfeDocumentsForEdit([]);
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/api/ffe-documents?item_index=${operationsEditIndex}`)
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Failed to load documents')))
      .then((data: { documents?: FfeDoc[] }) => {
        if (!cancelled && Array.isArray(data?.documents)) setFfeDocumentsForEdit(data.documents);
      })
      .catch(() => {
        if (!cancelled) setFfeDocumentsForEdit([]);
      });
    return () => { cancelled = true; };
  }, [operationsEditIndex]);

  const refreshProducts = useCallback(() => {
    setProducts(getInventoryProducts());
  }, []);

  const handleProductClick = (productId: string) => {
    navigate(`/inventory/product/${productId}`);
  };

  const openAddModal = () => {
    setAddModalOpen(true);
    setAddModalChoice(null);
    setNewProductName('');
    setNewProductType('Accessory');
    setAddInvProductId('');
    setAddInvCountry('');
    setAddInvModel('');
    setAddInvSerial('');
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddModalChoice(null);
  };

  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    addProduct(newProductName.trim(), newProductType);
    refreshProducts();
    closeAddModal();
  };

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInvProductId || !addInvSerial.trim()) return;
    addInventoryUnit(addInvProductId, addInvCountry.trim(), addInvModel.trim(), addInvSerial.trim());
    refreshProducts();
    closeAddModal();
  };

  const openOperationsEdit = (index: number) => {
    const row = operationsRows[index];
    if (!row) return;
    setOperationsEditIndex(index);
    setEditProduct(row.product);
    setEditAvailable(row.available);
    setEditReplacementCost(row.replacementCostPerItem);
    setEditValue(row.value);
  };

  const closeOperationsEdit = () => {
    setOperationsEditIndex(null);
  };

  const handleSaveOperationsEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (operationsEditIndex === null) return;
    const next = [...operationsRows];
    next[operationsEditIndex] = {
      product: editProduct.trim(),
      available: editAvailable.trim(),
      replacementCostPerItem: editReplacementCost.trim(),
      value: editValue.trim(),
    };
    setOperationsRows(next);
    setOperationsInventory(next);
    closeOperationsEdit();
  };

  const handleAddFfeItem = () => {
    const newRow: OperationsInventoryRow = { product: '', available: '', replacementCostPerItem: '', value: '' };
    const next = [...operationsRows, newRow];
    setOperationsRows(next);
    setOperationsInventory(next);
    setOperationsEditIndex(next.length - 1);
    setEditProduct('');
    setEditAvailable('');
    setEditReplacementCost('');
    setEditValue('');
  };

  const ffeDocUploadTypeRef = React.useRef<'receipt' | 'warranty'>('receipt');
  const ffeDocInputRef = React.useRef<HTMLInputElement>(null);
  const MAX_FFE_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleFfeDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || operationsEditIndex === null) return;
    if (file.size > MAX_FFE_FILE_SIZE) {
      alert('File is too large. Maximum size is 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch(`${API_BASE}/api/ffe-documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_index: operationsEditIndex,
            file_name: file.name,
            type: ffeDocUploadTypeRef.current,
            file_data: dataUrl,
          }),
        });
        if (!res.ok) throw new Error(await res.json().then((d: { error?: string }) => d.error).catch(() => 'Upload failed'));
        const doc: FfeDoc = await res.json();
        setFfeDocumentsForEdit((prev) => [...prev, doc]);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to upload document.');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFfeDoc = async (docId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/ffe-documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setFfeDocumentsForEdit((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      alert('Failed to remove document.');
    }
  };

  const openFfeDocUpload = (type: 'receipt' | 'warranty') => {
    ffeDocUploadTypeRef.current = type;
    ffeDocInputRef.current?.click();
  };

  const operationsTotalValue = operationsRows.reduce((sum, r) => sum + parseValue(r.value), 0);

  const inventorySearchLower = inventorySearchQuery.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!inventorySearchLower) return products;
    return products.filter((p) => {
      return [p.name, p.type, p.sku ?? ''].some((v) => v.toLowerCase().includes(inventorySearchLower));
    });
  }, [products, inventorySearchLower]);

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <div className="inventory-header-row">
              <div>
                <h2 className="page-title">Inventory</h2>
                <p className="page-subtitle">Track and manage inventory items</p>
              </div>
              <button type="button" className="inventory-add-product-button" onClick={openAddModal}>
                Add Product
              </button>
            </div>

            <div className="inventory-search-row">
              <input
                type="text"
                className="inventory-search-bar"
                placeholder="Search inventory..."
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                aria-label="Search inventory"
              />
            </div>

            <div className="inventory-table-section">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>SKU Number</th>
                    <th>Availability</th>
                    <th>In-Use</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((item) => {
                    const { availability, inUse } = getProductAvailabilityAndInUse(item.id);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleProductClick(item.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td data-label="Product">
                          {(item.name === 'TIM-E Bot' || item.name === 'BIM-E') && (
                            <span className="inventory-product-star" aria-label="Featured">★ </span>
                          )}
                          {item.name}
                        </td>
                        <td data-label="Type">{item.type}</td>
                        <td data-label="SKU">{item.sku || '—'}</td>
                        <td data-label="Availability">{availability}</td>
                        <td data-label="In-Use">{inUse}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProducts.length === 0 && products.length > 0 && (
                <p className="page-subtitle">No inventory items match your search.</p>
              )}
            </div>

            <div className="inventory-table-section">
              <div className="inventory-ffe-header">
                <h3 className="inventory-section-title">Furniture, Fixtures, and Equipment Inventory</h3>
                <button type="button" className="inventory-add-product-button inventory-add-ffe-button" onClick={handleAddFfeItem}>
                  Add FF&E Item
                </button>
              </div>
              <div className="inventory-table-wrapper inventory-list-table-wrapper">
                <table className="inventory-table inventory-list-table inventory-table-fit">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Available</th>
                      <th>Replacement Cost per item</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationsRows.map((row, index) => (
                      <tr
                        key={index}
                        className="inventory-list-data-row"
                        onClick={() => openOperationsEdit(index)}
                      >
                        <td data-label="Product">{row.product}</td>
                        <td data-label="Available">{row.available || '—'}</td>
                        <td data-label="Replacement Cost">{row.replacementCostPerItem || '—'}</td>
                        <td data-label="Value">{row.value || '—'}</td>
                      </tr>
                    ))}
                    <tr className="inventory-list-total-row">
                      <td colSpan={3}>Total</td>
                      <td>{formatCurrency(operationsTotalValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Product / Add Inventory modal */}
      {addModalOpen && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content inventory-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Product</h3>
              <button type="button" className="modal-close-button" onClick={closeAddModal} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              {addModalChoice === null && (
                <div className="inventory-add-choices">
                  <p className="inventory-add-prompt">What would you like to do?</p>
                  <button
                    type="button"
                    className="inventory-add-choice-button"
                    onClick={() => setAddModalChoice('new-product')}
                  >
                    Add a new product
                  </button>
                  <button
                    type="button"
                    className="inventory-add-choice-button"
                    onClick={() => setAddModalChoice('add-inventory')}
                  >
                    Add inventory
                  </button>
                </div>
              )}

              {addModalChoice === 'new-product' && (
                <form onSubmit={handleAddNewProduct} className="inventory-add-form">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Product name"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      className="form-input"
                      value={newProductType}
                      onChange={(e) => setNewProductType(e.target.value as ProductType)}
                    >
                      <option value="Robot">Robot</option>
                      <option value="Accessory">Accessory</option>
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="cancel-button" onClick={closeAddModal}>Cancel</button>
                    <button type="submit" className="save-button">Add Product</button>
                  </div>
                </form>
              )}

              {addModalChoice === 'add-inventory' && (
                <form onSubmit={handleAddInventory} className="inventory-add-form">
                  <div className="form-group">
                    <label className="form-label">Product</label>
                    <select
                      className="form-input"
                      value={addInvProductId}
                      onChange={(e) => setAddInvProductId(e.target.value)}
                      required
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country of origin</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addInvCountry}
                      onChange={(e) => setAddInvCountry(e.target.value)}
                      placeholder="e.g. United States"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addInvModel}
                      onChange={(e) => setAddInvModel(e.target.value)}
                      placeholder="Model"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addInvSerial}
                      onChange={(e) => setAddInvSerial(e.target.value)}
                      placeholder="Serial number"
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="cancel-button" onClick={closeAddModal}>Cancel</button>
                    <button type="submit" className="save-button">Add Inventory</button>
                  </div>
                </form>
              )}
            </div>
            {addModalChoice !== null && (
              <div className="inventory-modal-back">
                <button type="button" className="link-button" onClick={() => setAddModalChoice(null)}>
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {operationsEditIndex !== null && (
        <div className="modal-overlay" onClick={closeOperationsEdit}>
          <div className="modal-content inventory-add-modal inventory-ffe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">FF&E Item — {operationsRows[operationsEditIndex]?.product || 'New item'}</h3>
              <button type="button" className="modal-close-button" onClick={closeOperationsEdit} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSaveOperationsEdit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Product</label>
                <input
                  type="text"
                  className="form-input"
                  value={editProduct}
                  onChange={(e) => setEditProduct(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Available</label>
                <input
                  type="text"
                  className="form-input"
                  value={editAvailable}
                  onChange={(e) => setEditAvailable(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Replacement Cost per item</label>
                <input
                  type="text"
                  className="form-input"
                  value={editReplacementCost}
                  onChange={(e) => setEditReplacementCost(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Value</label>
                <input
                  type="text"
                  className="form-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              </div>

              <div className="ffe-documents-section">
                <h4 className="ffe-documents-title">Receipts &amp; Warranties</h4>
                <p className="ffe-documents-hint">Keep copies of receipts and warranty documents for this item.</p>
                <input
                  ref={ffeDocInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  className="ffe-doc-input-hidden"
                  onChange={handleFfeDocUpload}
                  aria-hidden
                />
                <div className="ffe-doc-actions">
                  <button type="button" className="inventory-add-product-button ffe-upload-btn" onClick={() => openFfeDocUpload('receipt')}>
                    Upload receipt
                  </button>
                  <button type="button" className="inventory-add-product-button ffe-upload-btn" onClick={() => openFfeDocUpload('warranty')}>
                    Upload warranty
                  </button>
                </div>
                <div className="ffe-documents-table-wrapper">
                  <table className="ffe-documents-table">
                    <thead>
                      <tr>
                        <th>File name</th>
                        <th>Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ffeDocumentsForEdit.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="ffe-docs-empty">No documents yet. Use the buttons above to upload.</td>
                        </tr>
                      ) : (
                        ffeDocumentsForEdit.map((doc) => (
                          <tr key={doc.id}>
                            <td data-label="File name">{doc.fileName}</td>
                            <td data-label="Type">{doc.type === 'receipt' ? 'Receipt' : 'Warranty'}</td>
                            <td data-label="Actions">
                              <a href={doc.dataUrl} download={doc.fileName} className="ffe-doc-link">Download</a>
                              {' · '}
                              <button type="button" className="ffe-doc-remove" onClick={() => removeFfeDoc(doc.id)}>Remove</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeOperationsEdit}>Cancel</button>
                <button type="submit" className="save-button">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
