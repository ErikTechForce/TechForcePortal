import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { getInventoryProducts, setInventoryProducts, getUnitsByProductId, getProductAvailabilityAndInUse, addInventoryUnit, updateInventoryUnit, deleteInventoryUnit, type InventoryUnit, type InventoryUnitStatus, type InventoryUnitCondition, type ProductType } from '../data/inventory';
import {
  getTimEPartsInventory,
  setTimEPartsInventory,
  type TimEInventoryRow,
} from '../data/timEInventoryList';
import {
  getBimEPartsInventory,
  setBimEPartsInventory,
  type BimEInventoryRow,
} from '../data/bimEInventoryList';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import './Page.css';
import './ClientDetail.css';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const products = getInventoryProducts();
  const product = productId ? products.find((p) => p.id === productId) : null;
  const [units, setUnits] = useState(() => (productId ? getUnitsByProductId(productId) : []));
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    inventory: false,
    timeeParts: false,
    bimeParts: false,
  });
  const toggleSection = (key: string) =>
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const [editingUnit, setEditingUnit] = useState<InventoryUnit | null>(null);
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState<InventoryUnitStatus | ''>('');
  const [condition, setCondition] = useState<InventoryUnitCondition | ''>('');
  const [manufacturer, setManufacturer] = useState('');
  const [location, setLocation] = useState('');
  const [business, setBusiness] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [trashBins, setTrashBins] = useState<string>('');
  const [linenBins, setLinenBins] = useState<string>('');
  const [rollingBases, setRollingBases] = useState<string>('');
  const [staticBases, setStaticBases] = useState<string>('');

  const [timEPartsRows, setTimEPartsRows] = useState<TimEInventoryRow[]>(() => getTimEPartsInventory());
  const [bimEPartsRows, setBimEPartsRows] = useState<BimEInventoryRow[]>(() => getBimEPartsInventory());
  const [partsEditType, setPartsEditType] = useState<'tim-e' | 'bim-e' | null>(null);
  const [partsEditIndex, setPartsEditIndex] = useState<number | null>(null);
  const [partsEditProduct, setPartsEditProduct] = useState('');
  const [partsEditAvailable, setPartsEditAvailable] = useState('');
  const [partsEditFullyAssembled, setPartsEditFullyAssembled] = useState('');
  const [partsEditNotAssembled, setPartsEditNotAssembled] = useState('');
  const [partsEditBackOrdered, setPartsEditBackOrdered] = useState('');
  const [partsEditPendingSales, setPartsEditPendingSales] = useState('');
  const [partsEditReplacementCost, setPartsEditReplacementCost] = useState('');
  const [partsEditValue, setPartsEditValue] = useState('');
  const [partsEditDiscardedUnits, setPartsEditDiscardedUnits] = useState('');
  const [partsEditWasteDollars, setPartsEditWasteDollars] = useState('');
  const [partsEditPendingDelivery, setPartsEditPendingDelivery] = useState('');
  const [partsEditLowStockBuffer, setPartsEditLowStockBuffer] = useState('');

  const isFullInventoryProduct = !!product && (product.name === 'TIM-E Bot' || product.name === 'BIM-E');

  // Edit product details modal
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editProductName, setEditProductName] = useState('');
  const [editProductType, setEditProductType] = useState<ProductType>('Robot');
  const [editProductSku, setEditProductSku] = useState('');
  const [editProductLowStockBuffer, setEditProductLowStockBuffer] = useState('');

  const openEditProductModal = () => {
    if (!product) return;
    setEditProductName(product.name);
    setEditProductType(product.type);
    setEditProductSku(product.sku || '');
    setEditProductLowStockBuffer(product.lowStockBuffer != null ? String(product.lowStockBuffer) : '');
    setEditProductOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const bufRaw = editProductLowStockBuffer.trim();
    const lowStockBuffer = bufRaw === '' ? undefined : Math.max(0, Math.floor(Number(bufRaw))) || undefined;
    const all = getInventoryProducts();
    const updated = all.map((p) =>
      p.id === product.id
        ? { ...p, name: editProductName.trim(), type: editProductType, sku: editProductSku.trim(), lowStockBuffer: lowStockBuffer ?? null }
        : p
    );
    setInventoryProducts(updated);
    setEditProductOpen(false);
    // Force re-render by navigating to same page (products are read from localStorage)
    window.location.reload();
  };

  // Delete product confirmation modal
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);

  const handleDeleteProduct = () => {
    if (!product) return;
    const all = getInventoryProducts();
    setInventoryProducts(all.filter((p) => p.id !== product.id));
    navigate('/inventory');
  };

  // Derived availability counts from actual unit statuses
  const { availability: availableCount, inUse: inUseCount } = productId
    ? getProductAvailabilityAndInUse(productId)
    : { availability: 0, inUse: 0 };

  const parsePartsValue = (s: string): number => Number(String(s).replace(/[$,]/g, '').trim()) || 0;
  const formatPartsCurrency = (n: number): string => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

  const refreshUnits = useCallback(() => {
    if (productId) setUnits(getUnitsByProductId(productId));
  }, [productId]);

  useEffect(() => {
    if (productId) setUnits(getUnitsByProductId(productId));
  }, [productId]);

  useEffect(() => {
    setTimEPartsRows(getTimEPartsInventory());
    setBimEPartsRows(getBimEPartsInventory());
  }, [productId]);

  const openTimEPartsEdit = (index: number) => {
    const row = timEPartsRows[index];
    if (!row) return;
    setPartsEditType('tim-e');
    setPartsEditIndex(index);
    setPartsEditProduct(row.product);
    setPartsEditAvailable(row.available);
    setPartsEditFullyAssembled(row.fullyAssembled);
    setPartsEditNotAssembled(row.notAssembled);
    setPartsEditBackOrdered(row.backOrdered);
    setPartsEditPendingSales(row.pendingSales);
    setPartsEditReplacementCost(row.replacementCostPerItem);
    setPartsEditValue(row.value);
    setPartsEditDiscardedUnits(row.discardedUnits);
    setPartsEditWasteDollars(row.wasteDollars);
    setPartsEditPendingDelivery('');
    setPartsEditLowStockBuffer(row.lowStockBuffer != null ? String(row.lowStockBuffer) : '');
  };

  const openBimEPartsEdit = (index: number) => {
    const row = bimEPartsRows[index];
    if (!row) return;
    setPartsEditType('bim-e');
    setPartsEditIndex(index);
    setPartsEditProduct(row.product);
    setPartsEditAvailable(row.available);
    setPartsEditFullyAssembled(row.fullyAssembled);
    setPartsEditNotAssembled(row.notAssembled);
    setPartsEditBackOrdered(row.backOrdered);
    setPartsEditPendingSales(row.pendingSales);
    setPartsEditReplacementCost(row.replacementCostPerItem);
    setPartsEditValue(row.value);
    setPartsEditDiscardedUnits(row.discardedUnits);
    setPartsEditWasteDollars('');
    setPartsEditPendingDelivery(row.pendingDelivery);
    setPartsEditLowStockBuffer(row.lowStockBuffer != null ? String(row.lowStockBuffer) : '');
  };

  const closePartsEdit = () => {
    setPartsEditType(null);
    setPartsEditIndex(null);
  };

  const handleSavePartsEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (partsEditType === 'tim-e' && partsEditIndex !== null) {
      const next = [...timEPartsRows];
      const buf = partsEditLowStockBuffer.trim();
      const lowStockBuffer = buf === '' ? undefined : Math.max(0, Math.floor(Number(buf))) || undefined;
      next[partsEditIndex] = {
        product: partsEditProduct.trim(),
        available: partsEditAvailable.trim(),
        fullyAssembled: partsEditFullyAssembled.trim(),
        notAssembled: partsEditNotAssembled.trim(),
        backOrdered: partsEditBackOrdered.trim(),
        pendingSales: partsEditPendingSales.trim(),
        replacementCostPerItem: partsEditReplacementCost.trim(),
        value: partsEditValue.trim(),
        discardedUnits: partsEditDiscardedUnits.trim(),
        wasteDollars: partsEditWasteDollars.trim(),
        lowStockBuffer: lowStockBuffer ?? null,
      };
      setTimEPartsRows(next);
      setTimEPartsInventory(next);
    } else if (partsEditType === 'bim-e' && partsEditIndex !== null) {
      const next = [...bimEPartsRows];
      const buf = partsEditLowStockBuffer.trim();
      const lowStockBuffer = buf === '' ? undefined : Math.max(0, Math.floor(Number(buf))) || undefined;
      next[partsEditIndex] = {
        product: partsEditProduct.trim(),
        available: partsEditAvailable.trim(),
        fullyAssembled: partsEditFullyAssembled.trim(),
        notAssembled: partsEditNotAssembled.trim(),
        backOrdered: partsEditBackOrdered.trim(),
        pendingSales: partsEditPendingSales.trim(),
        replacementCostPerItem: partsEditReplacementCost.trim(),
        value: partsEditValue.trim(),
        discardedUnits: partsEditDiscardedUnits.trim(),
        pendingDelivery: partsEditPendingDelivery.trim(),
        lowStockBuffer: lowStockBuffer ?? null,
      };
      setBimEPartsRows(next);
      setBimEPartsInventory(next);
    }
    closePartsEdit();
  };

  const openAddModal = () => {
    setEditingUnit(null);
    setCountryOfOrigin('');
    setModel('');
    setSerialNumber('');
    setStatus('');
    setCondition('');
    setManufacturer('');
    setLocation('');
    setBusiness('');
    setInstallationDate('');
    setTrashBins('');
    setLinenBins('');
    setRollingBases('');
    setStaticBases('');
    setAddUnitOpen(true);
  };

  const openEditModal = (u: InventoryUnit) => {
    setEditingUnit(u);
    setCountryOfOrigin(u.countryOfOrigin || '');
    setModel(u.model || '');
    setSerialNumber(u.serialNumber || '');
    setStatus(u.status || '');
    setCondition(u.condition || '');
    setManufacturer(u.manufacturer || '');
    setLocation(u.location || '');
    setBusiness(u.business || '');
    setInstallationDate(u.installationDate || '');
    setTrashBins(u.trashBins !== undefined ? String(u.trashBins) : '');
    setLinenBins(u.linenBins !== undefined ? String(u.linenBins) : '');
    setRollingBases(u.rollingBases !== undefined ? String(u.rollingBases) : '');
    setStaticBases(u.staticBases !== undefined ? String(u.staticBases) : '');
    setAddUnitOpen(true);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSerial = serialNumber.trim();
    const statusVal = status || undefined;
    const conditionVal = condition || undefined;
    const manufacturerVal = manufacturer.trim() || undefined;
    const modelVal = model.trim() || '';
    const locationVal = location.trim() || undefined;
    const businessVal = business.trim() || undefined;
    const installationDateVal = installationDate.trim() || undefined;
    const trashBinsVal = trashBins === '' ? undefined : parseInt(trashBins, 10);
    const linenBinsVal = linenBins === '' ? undefined : parseInt(linenBins, 10);
    const rollingBasesVal = rollingBases === '' ? undefined : parseInt(rollingBases, 10);
    const staticBasesVal = staticBases === '' ? undefined : parseInt(staticBases, 10);
    if (editingUnit) {
      updateInventoryUnit(editingUnit.id, {
        countryOfOrigin: countryOfOrigin.trim(),
        model: modelVal,
        serialNumber: effectiveSerial,
        status: statusVal as InventoryUnitStatus | undefined,
        condition: conditionVal as InventoryUnitCondition | undefined,
        manufacturer: manufacturerVal,
        location: locationVal,
        business: businessVal,
        installationDate: installationDateVal,
        trashBins: trashBinsVal,
        linenBins: linenBinsVal,
        rollingBases: rollingBasesVal,
        staticBases: staticBasesVal,
      });
    } else if (productId) {
      addInventoryUnit(productId, countryOfOrigin.trim(), modelVal, effectiveSerial, {
        status: statusVal as InventoryUnitStatus | undefined,
        condition: conditionVal as InventoryUnitCondition | undefined,
        manufacturer: manufacturerVal,
        location: locationVal,
        business: businessVal,
        installationDate: installationDateVal,
        trashBins: trashBinsVal,
        linenBins: linenBinsVal,
        rollingBases: rollingBasesVal,
        staticBases: staticBasesVal,
      });
    }
    setEditingUnit(null);
    setCountryOfOrigin('');
    setModel('');
    setSerialNumber('');
    setStatus('');
    setCondition('');
    setManufacturer('');
    setLocation('');
    setBusiness('');
    setInstallationDate('');
    setTrashBins('');
    setLinenBins('');
    setRollingBases('');
    setStaticBases('');
    refreshUnits();
    setAddUnitOpen(false);
  };

  const [unitToDelete, setUnitToDelete] = useState<InventoryUnit | null>(null);

  useEffect(() => {
    const anyOpen = addUnitOpen || !!partsEditType || editProductOpen;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [addUnitOpen, partsEditType, editProductOpen]);

  const handleRequestDeleteUnit = (e: React.MouseEvent, u: InventoryUnit) => {
    e.stopPropagation();
    setUnitToDelete(u);
  };

  const handleConfirmDeleteUnit = () => {
    if (!unitToDelete) return;
    deleteInventoryUnit(unitToDelete.id);
    refreshUnits();
    setUnitToDelete(null);
    // If the edit modal was open for this unit, close it too
    if (editingUnit?.id === unitToDelete.id) {
      setAddUnitOpen(false);
      setEditingUnit(null);
    }
  };

  if (!productId || !product) {
    return (
      <div className="page-container">
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <p className="page-subtitle">Product not found.</p>
              <button type="button" className="back-button" onClick={() => navigate('/inventory')}>
                Back to Inventory
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const displayName = product.name;

  return (
    <div className="page-container">
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <PageHeader
            title={displayName}
            subtitle={`${product.type} — Product inventory`}
            onBack={() => navigate('/inventory')}
            backLabel="Back"
          />
          <div className="page-content">
            {/* Product info card */}
            <div className="product-info-card">
              <div className="product-info-header">
                <h3 className="section-title">Product Details</h3>
                <div className="client-action-buttons">
                  <button
                    type="button"
                    className="client-action-btn client-action-btn--edit"
                    data-tooltip="Edit product"
                    onClick={openEditProductModal}
                    aria-label="Edit product"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  <button
                    type="button"
                    className="client-action-btn client-action-btn--delete"
                    data-tooltip="Delete product"
                    onClick={() => setDeleteProductOpen(true)}
                    aria-label="Delete product"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              <div className="product-info-grid">
                <div className="product-info-item">
                  <label className="product-info-label">Product Name</label>
                  <p className="product-info-value">{product.name}</p>
                </div>
                <div className="product-info-item">
                  <label className="product-info-label">Type</label>
                  <p className="product-info-value">{product.type}</p>
                </div>
                <div className="product-info-item">
                  <label className="product-info-label">SKU</label>
                  <p className="product-info-value">{product.sku || '—'}</p>
                </div>
              </div>

              <hr className="client-info-divider" />

              <h4 className="client-info-subsection-title">Unit Counts</h4>
              <div className="product-info-grid">
                <div className="product-info-item">
                  <label className="product-info-label">Total in Inventory</label>
                  <p className="product-info-value">{units.length}</p>
                </div>
                <div className="product-info-item">
                  <label className="product-info-label">In Use</label>
                  <p className="product-info-value">{inUseCount}</p>
                </div>
                <div className="product-info-item">
                  <label className="product-info-label">Available</label>
                  <p className="product-info-value">{availableCount}</p>
                </div>
                <div className="product-info-item">
                  <label className="product-info-label">Low stock buffer</label>
                  <p className="product-info-value">{product.lowStockBuffer != null && product.lowStockBuffer > 0 ? product.lowStockBuffer : '—'}</p>
                </div>
                <div className="product-info-item">
                  <label className="product-info-label">Items need to be produced</label>
                  <p className="product-info-value">
                    {product.lowStockBuffer != null && product.lowStockBuffer > 0 && product.lowStockBuffer > availableCount
                      ? product.lowStockBuffer - availableCount
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="product-table-section">
              <div className="collapsible-header">
                <div className="collapsible-header-left" onClick={() => toggleSection('inventory')}>
                  <h3 className="product-table-title">Inventory For This Product</h3>
                  <span className={`collapse-arrow${!collapsedSections.inventory ? ' collapse-arrow--open' : ''}`}>▶</span>
                </div>
                <button type="button" className="product-add-btn" onClick={openAddModal}>
                  + Add Inventory
                </button>
              </div>
              {!collapsedSections.inventory && (units.length === 0 ? (
                <p className="table-empty">No inventory units yet.</p>
              ) : <div className="product-table-wrapper">
                  <table className="product-table">
                    <thead>
                      <tr>
                        {isFullInventoryProduct ? (
                          <>
                            <th>City</th>
                            <th>Business</th>
                            <th>Serial number</th>
                            <th>Status</th>
                            <th>Condition</th>
                          </>
                        ) : (
                          <>
                            <th>Manufacturer</th>
                            <th>Country of origin</th>
                          </>
                        )}
                        <th className="product-table-actions-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((u) => (
                        <tr
                          key={u.id}
                          className="product-inventory-row-clickable"
                          onClick={() => openEditModal(u)}
                        >
                          {isFullInventoryProduct ? (
                            <>
                              <td>{u.location || '—'}</td>
                              <td>{u.business || '—'}</td>
                              <td>{u.serialNumber || '—'}</td>
                              <td>{u.status || '—'}</td>
                              <td>{u.condition || '—'}</td>
                            </>
                          ) : (
                            <>
                              <td>{u.manufacturer || '—'}</td>
                              <td>{u.countryOfOrigin || '—'}</td>
                            </>
                          )}
                          <td className="product-table-actions-cell" onClick={(e) => e.stopPropagation()}>
                            <div className="product-row-actions">
                              <>
                                <button
                                  type="button"
                                  className="product-row-btn product-row-btn--edit"
                                  data-tooltip="Edit"
                                  onClick={() => openEditModal(u)}
                                  aria-label="Edit"
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} />
                                </button>
                                <button
                                  type="button"
                                  className="product-row-btn product-row-btn--delete"
                                  data-tooltip="Delete"
                                  onClick={(e) => handleRequestDeleteUnit(e, u)}
                                  aria-label="Delete"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {product.name === 'TIM-E Bot' && (
              <div className="product-table-section">
                <div className="collapsible-header" onClick={() => toggleSection('timeeParts')}>
                  <h3 className="product-table-title">TIM-E Parts Inventory</h3>
                  <span className={`collapse-arrow${!collapsedSections.timeeParts ? ' collapse-arrow--open' : ''}`}>▶</span>
                </div>
                {!collapsedSections.timeeParts && <div className="product-table-wrapper product-inventory-list-table-wrapper">
                  <table className="product-table product-inventory-list-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Available</th>
                        <th>Fully assembled</th>
                        <th>Not assembled</th>
                        <th>Back Ordered</th>
                        <th>Pending sales</th>
                        <th>Replacement Cost per item</th>
                        <th>Value</th>
                        <th>Discarded Units</th>
                        <th>Waste $</th>
                        <th>Buffer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timEPartsRows.map((row, index) => (
                        <tr
                          key={index}
                          className="product-inventory-row-clickable"
                          onClick={() => openTimEPartsEdit(index)}
                        >
                          <td>{row.product}</td>
                          <td>{row.available || '—'}</td>
                          <td>{row.fullyAssembled || '—'}</td>
                          <td>{row.notAssembled || '—'}</td>
                          <td>{row.backOrdered || '—'}</td>
                          <td>{row.pendingSales || '—'}</td>
                          <td>{row.replacementCostPerItem || '—'}</td>
                          <td>{row.value || '—'}</td>
                          <td>{row.discardedUnits || '—'}</td>
                          <td>{row.wasteDollars || '—'}</td>
                          <td>{row.lowStockBuffer != null && row.lowStockBuffer > 0 ? row.lowStockBuffer : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="product-inventory-total-row">
                        <td colSpan={7}>Total</td>
                        <td>{formatPartsCurrency(timEPartsRows.reduce((sum, r) => sum + parsePartsValue(r.value), 0))}</td>
                        <td></td>
                        <td>{formatPartsCurrency(timEPartsRows.reduce((sum, r) => sum + parsePartsValue(r.wasteDollars), 0))}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>}
              </div>
            )}

            {product.name === 'BIM-E' && (
              <div className="product-table-section">
                <div className="collapsible-header" onClick={() => toggleSection('bimeParts')}>
                  <h3 className="product-table-title">BIM-E Parts Inventory</h3>
                  <span className={`collapse-arrow${!collapsedSections.bimeParts ? ' collapse-arrow--open' : ''}`}>▶</span>
                </div>
                {!collapsedSections.bimeParts && <div className="product-table-wrapper product-inventory-list-table-wrapper">
                  <table className="product-table product-inventory-list-table">
                    <thead>
                      <tr>
                        <th>Parts</th>
                        <th>Available</th>
                        <th>Fully assembled</th>
                        <th>Not assembled</th>
                        <th>Back Ordered</th>
                        <th>Pending sales</th>
                        <th>Replacement Cost per item</th>
                        <th>Value</th>
                        <th>Discarded Units</th>
                        <th>Pending Delivery</th>
                        <th>Buffer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bimEPartsRows.map((row, index) => (
                        <tr
                          key={index}
                          className="product-inventory-row-clickable"
                          onClick={() => openBimEPartsEdit(index)}
                        >
                          <td>{row.product}</td>
                          <td>{row.available || '—'}</td>
                          <td>{row.fullyAssembled || '—'}</td>
                          <td>{row.notAssembled || '—'}</td>
                          <td>{row.backOrdered || '—'}</td>
                          <td>{row.pendingSales || '—'}</td>
                          <td>{row.replacementCostPerItem || '—'}</td>
                          <td>{row.value || '—'}</td>
                          <td>{row.discardedUnits || '—'}</td>
                          <td>{row.pendingDelivery || '—'}</td>
                          <td>{row.lowStockBuffer != null && row.lowStockBuffer > 0 ? row.lowStockBuffer : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="product-inventory-total-row">
                        <td colSpan={9}>Total</td>
                        <td>{formatPartsCurrency(bimEPartsRows.reduce((sum, r) => sum + parsePartsValue(r.value), 0))}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>}
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={!!unitToDelete}
        onClose={() => setUnitToDelete(null)}
        title="Delete inventory unit"
        narrow
      >
        <div className="modal-body">
          <p style={{ margin: '0 0 0.5rem', color: '#374151', fontSize: '0.9375rem' }}>
            Are you sure you want to delete this inventory unit
            {unitToDelete?.serialNumber ? <> (serial <strong>{unitToDelete.serialNumber}</strong>)</> : ''}?
          </p>
          <p style={{ margin: '0', color: '#8A8F93', fontSize: '0.875rem' }}>
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={() => setUnitToDelete(null)}>
            Cancel
          </button>
          <button type="button" className="client-delete-confirm-btn" onClick={handleConfirmDeleteUnit}>
            Delete
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={deleteProductOpen}
        onClose={() => setDeleteProductOpen(false)}
        title="Delete product"
        narrow
      >
        <div className="modal-body">
          <p style={{ margin: '0 0 0.5rem', color: '#374151', fontSize: '0.9375rem' }}>
            Are you sure you want to delete <strong>{product?.name}</strong> from inventory?
          </p>
          <p style={{ margin: '0', color: '#8A8F93', fontSize: '0.875rem' }}>
            This will permanently remove the product and cannot be undone.
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={() => setDeleteProductOpen(false)}>
            Cancel
          </button>
          <button type="button" className="client-delete-confirm-btn" onClick={handleDeleteProduct}>
            Delete
          </button>
        </div>
      </Modal>

      {editProductOpen && (
        <div className="modal-overlay" onClick={() => setEditProductOpen(false)}>
          <div className="modal-content modal-content--narrow" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit product details</h3>
              <button type="button" className="modal-close-button" onClick={() => setEditProductOpen(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={editProductType}
                    onChange={(e) => setEditProductType(e.target.value as ProductType)}
                  >
                    <option value="Robot">Robot</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editProductSku}
                    onChange={(e) => setEditProductSku(e.target.value)}
                    placeholder="e.g. TIM-E-001"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Low stock buffer</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="form-input"
                    value={editProductLowStockBuffer}
                    onChange={(e) => setEditProductLowStockBuffer(e.target.value)}
                    placeholder="Default: 25"
                    aria-label="Low stock buffer — show on dashboard when below this number"
                  />
                  <span className="form-hint">When stock falls below this number, the item appears on the dashboard low-stock card (highlighted yellow). Leave blank to hide from the low-stock card.</span>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setEditProductOpen(false)}>Cancel</button>
                <button type="submit" className="save-button">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addUnitOpen && (
        <div className="modal-overlay">
          <div className="modal-content add-inventory-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingUnit ? `Edit inventory — ${displayName}` : `Add inventory — ${displayName}`}</h3>
              <button type="button" className="modal-close-button" onClick={() => { setAddUnitOpen(false); setEditingUnit(null); }} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSaveUnit} className="inventory-edit-form">
              <div className="modal-body">
              {isFullInventoryProduct ? (
                <>
                  <div className="inventory-modal-card">
                    <h4 className="inventory-modal-card-title">Location &amp; status</h4>
                    <div className="inventory-modal-card-fields">
                      <div className="form-group">
                        <label className="form-label">Location</label>
                        <input
                          type="text"
                          className="form-input"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City / location"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Business</label>
                        <input
                          type="text"
                          className="form-input"
                          value={business}
                          onChange={(e) => setBusiness(e.target.value)}
                          placeholder="Business"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Installation Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={installationDate}
                          onChange={(e) => setInstallationDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                          className="form-input"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as InventoryUnitStatus | '')}
                        >
                          <option value="">—</option>
                          <option value="Deployed">Deployed</option>
                          <option value="In Storage">In Storage</option>
                          <option value="Repair">Repair</option>
                          <option value="Out of Order">Out of Order</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Condition</label>
                        <select
                          className="form-input"
                          value={condition}
                          onChange={(e) => setCondition(e.target.value as InventoryUnitCondition | '')}
                        >
                          <option value="">—</option>
                          <option value="Working">Working</option>
                          <option value="Broken">Broken</option>
                          <option value="Storage">Storage</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="inventory-modal-card">
                    <h4 className="inventory-modal-card-title">Equipment counts</h4>
                    <div className="inventory-modal-card-fields inventory-modal-card-grid">
                      <div className="form-group">
                        <label className="form-label">Trash bins</label>
                        <input
                          type="number"
                          min={0}
                          className="form-input"
                          value={trashBins}
                          onChange={(e) => setTrashBins(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Linen bins</label>
                        <input
                          type="number"
                          min={0}
                          className="form-input"
                          value={linenBins}
                          onChange={(e) => setLinenBins(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Rolling bases</label>
                        <input
                          type="number"
                          min={0}
                          className="form-input"
                          value={rollingBases}
                          onChange={(e) => setRollingBases(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Static bases</label>
                        <input
                          type="number"
                          min={0}
                          className="form-input"
                          value={staticBases}
                          onChange={(e) => setStaticBases(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="inventory-modal-card">
                    <h4 className="inventory-modal-card-title">Product details</h4>
                    <div className="inventory-modal-card-fields">
                      <div className="form-group">
                        <label className="form-label">Manufacturer</label>
                        <input
                          type="text"
                          className="form-input"
                          value={manufacturer}
                          onChange={(e) => setManufacturer(e.target.value)}
                          placeholder="Manufacturer"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Country of origin</label>
                        <input
                          type="text"
                          className="form-input"
                          value={countryOfOrigin}
                          onChange={(e) => setCountryOfOrigin(e.target.value)}
                          placeholder="e.g. United States"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Model</label>
                        <input
                          type="text"
                          className="form-input"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder="Model"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Serial number</label>
                        <input
                          type="text"
                          className="form-input"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="inventory-modal-card">
                  <h4 className="inventory-modal-card-title">Details</h4>
                  <div className="inventory-modal-card-fields">
                    <div className="form-group">
                      <label className="form-label">Manufacturer</label>
                      <input
                        type="text"
                        className="form-input"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                        placeholder="Manufacturer"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country of origin</label>
                      <input
                        type="text"
                        className="form-input"
                        value={countryOfOrigin}
                        onChange={(e) => setCountryOfOrigin(e.target.value)}
                        placeholder="e.g. United States"
                      />
                    </div>
                  </div>
                </div>
              )}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => { setAddUnitOpen(false); setEditingUnit(null); }}>Cancel</button>
                <button type="submit" className="save-button">{editingUnit ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {partsEditType && (
        <div className="modal-overlay">
          <div className="modal-content add-inventory-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit parts row — {partsEditType === 'tim-e' ? 'TIM-E' : 'BIM-E'}</h3>
              <button type="button" className="modal-close-button" onClick={closePartsEdit} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSavePartsEdit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Product / Parts</label>
                <input type="text" className="form-input" value={partsEditProduct} onChange={(e) => setPartsEditProduct(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Available</label>
                <input type="text" className="form-input" value={partsEditAvailable} onChange={(e) => setPartsEditAvailable(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fully assembled</label>
                <input type="text" className="form-input" value={partsEditFullyAssembled} onChange={(e) => setPartsEditFullyAssembled(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Not assembled</label>
                <input type="text" className="form-input" value={partsEditNotAssembled} onChange={(e) => setPartsEditNotAssembled(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Back Ordered</label>
                <input type="text" className="form-input" value={partsEditBackOrdered} onChange={(e) => setPartsEditBackOrdered(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Pending sales</label>
                <input type="text" className="form-input" value={partsEditPendingSales} onChange={(e) => setPartsEditPendingSales(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Replacement Cost per item</label>
                <input type="text" className="form-input" value={partsEditReplacementCost} onChange={(e) => setPartsEditReplacementCost(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Value</label>
                <input type="text" className="form-input" value={partsEditValue} onChange={(e) => setPartsEditValue(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Discarded Units</label>
                <input type="text" className="form-input" value={partsEditDiscardedUnits} onChange={(e) => setPartsEditDiscardedUnits(e.target.value)} />
              </div>
              {partsEditType === 'tim-e' && (
                <div className="form-group">
                  <label className="form-label">Waste $</label>
                  <input type="text" className="form-input" value={partsEditWasteDollars} onChange={(e) => setPartsEditWasteDollars(e.target.value)} />
                </div>
              )}
              {partsEditType === 'bim-e' && (
                <div className="form-group">
                  <label className="form-label">Pending Delivery</label>
                  <input type="text" className="form-input" value={partsEditPendingDelivery} onChange={(e) => setPartsEditPendingDelivery(e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Low stock buffer</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="form-input"
                  value={partsEditLowStockBuffer}
                  onChange={(e) => setPartsEditLowStockBuffer(e.target.value)}
                  placeholder="Show on dashboard when below this"
                />
                <span className="form-hint">When available falls below this number, this part appears on the dashboard low-stock card. Leave blank to hide.</span>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closePartsEdit}>Cancel</button>
                <button type="submit" className="save-button">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
