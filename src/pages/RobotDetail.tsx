import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import {
  getInventoryProducts,
  getUnitsByProductId,
  updateInventoryUnit,
  deleteInventoryUnit,
  type InventoryUnit,
  type InventoryUnitStatus,
  type InventoryUnitCondition,
} from '../data/inventory';
import './Page.css';
import './RobotDetail.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface LocationHistoryEntry {
  location: string;
  firstSeenAt: string;
}

const RobotDetail: React.FC = () => {
  const navigate = useNavigate();
  const { productId, serialNumber: serialNumberFromUrl } = useParams<{ productId: string; serialNumber: string }>();
  const product = productId ? getInventoryProducts().find((p) => p.id === productId) : null;
  const decodedProductName = product?.name ?? (productId ? 'Product' : 'Product');
  const decodedSerialNumber = serialNumberFromUrl ? decodeURIComponent(serialNumberFromUrl) : '';

  const [unit, setUnit] = useState<InventoryUnit | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistoryEntry[]>([]);
  const [location, setLocation] = useState('');
  const [business, setBusiness] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [status, setStatus] = useState<InventoryUnitStatus | ''>('');
  const [condition, setCondition] = useState<InventoryUnitCondition | ''>('');
  const [trashBins, setTrashBins] = useState('');
  const [linenBins, setLinenBins] = useState('');
  const [rollingBases, setRollingBases] = useState('');
  const [staticBases, setStaticBases] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  const loadUnit = useCallback(() => {
    if (!productId) return null;
    const units = getUnitsByProductId(productId);
    const u = units.find(
      (x) =>
        (x.serialNumber || '').trim() === decodedSerialNumber.trim() || x.id === decodedSerialNumber
    );
    return u ?? null;
  }, [productId, decodedSerialNumber]);

  useEffect(() => {
    const u = loadUnit();
    setUnit(u);
    if (u) {
      setLocation(u.location || '');
      setBusiness(u.business || '');
      setInstallationDate(u.installationDate || '');
      setStatus(u.status || '');
      setCondition(u.condition || '');
      setTrashBins(u.trashBins !== undefined ? String(u.trashBins) : '');
      setLinenBins(u.linenBins !== undefined ? String(u.linenBins) : '');
      setRollingBases(u.rollingBases !== undefined ? String(u.rollingBases) : '');
      setStaticBases(u.staticBases !== undefined ? String(u.staticBases) : '');
      setManufacturer(u.manufacturer || '');
      setCountryOfOrigin(u.countryOfOrigin || '');
      setModel(u.model || '');
      // Only show user-submitted serial; hide auto-generated unit id
      const userSerial = (u.serialNumber || '').trim();
      setSerialNumber(userSerial && userSerial !== u.id ? userSerial : '');
    }
  }, [loadUnit]);

  useEffect(() => {
    if (!productId || !decodedSerialNumber) {
      setLocationHistory([]);
      return;
    }
    let cancelled = false;
    const robotKey = unit ? ((unit.serialNumber || '').trim() || unit.id) : decodedSerialNumber;
    fetch(
      `${API_BASE}/api/robot-location-history?productId=${encodeURIComponent(productId)}&serialNumber=${encodeURIComponent(robotKey)}`
    )
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { history?: LocationHistoryEntry[] }) => {
        if (!cancelled && Array.isArray(data?.history)) setLocationHistory(data.history);
      })
      .catch(() => {
        if (!cancelled) setLocationHistory([]);
      });
    return () => { cancelled = true; };
  }, [productId, decodedSerialNumber, unit?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    const locationVal = location.trim() || undefined;
    const previousLocation = unit.location?.trim() || undefined;
    const serialTrimmed = serialNumber.trim();
    updateInventoryUnit(unit.id, {
      serialNumber: serialTrimmed || '',
      location: locationVal,
      business: business.trim() || undefined,
      installationDate: installationDate.trim() || undefined,
      status: (status || undefined) as InventoryUnitStatus | undefined,
      condition: (condition || undefined) as InventoryUnitCondition | undefined,
      trashBins: trashBins === '' ? undefined : parseInt(trashBins, 10),
      linenBins: linenBins === '' ? undefined : parseInt(linenBins, 10),
      rollingBases: rollingBases === '' ? undefined : parseInt(rollingBases, 10),
      staticBases: staticBases === '' ? undefined : parseInt(staticBases, 10),
      manufacturer: manufacturer.trim() || undefined,
      countryOfOrigin: countryOfOrigin.trim(),
      model: model.trim(),
    });
    if (locationVal && locationVal !== previousLocation) {
      try {
        const robotKey = serialTrimmed || unit.id;
        await fetch(`${API_BASE}/api/robot-location-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            serialNumber: robotKey,
            location: locationVal,
          }),
        });
        setLocationHistory((prev) => {
          const already = prev.some((h) => h.location === locationVal);
          if (already) return prev;
          return [...prev, { location: locationVal, firstSeenAt: new Date().toISOString() }];
        });
      } catch {
        // ignore
      }
    }
    const updated = loadUnit();
    setUnit(updated);
    if (productId) {
      if (serialTrimmed && updated) {
        navigate(`/inventory/product/${productId}/robot/${encodeURIComponent(serialTrimmed)}`);
      } else {
        navigate(`/inventory/product/${productId}`);
      }
    } else {
      navigate('/inventory');
    }
  };

  const handleDelete = () => {
    if (!unit) return;
    if (!window.confirm(`Delete this robot (serial ${decodedSerialNumber})?`)) return;
    deleteInventoryUnit(unit.id);
    if (productId) navigate(`/inventory/product/${productId}`);
    else navigate('/inventory');
  };

  const handleBack = () => {
    if (productId) navigate(`/inventory/product/${productId}`);
    else navigate('/inventory');
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  if (!productId || !product) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <p>Product not found.</p>
              <button type="button" className="back-button" onClick={() => navigate('/inventory')}>
                ← Back to Inventory
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <div className="robot-detail-header">
                <h2 className="page-title">Robot not found</h2>
                <button type="button" className="back-button" onClick={handleBack}>
                  ← Back to {decodedProductName}
                </button>
              </div>
              <p className="page-subtitle">No unit with this serial number in {decodedProductName} inventory.</p>
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
            <div className="robot-detail-header">
              <h2 className="page-title">Robot — {serialNumber.trim() || 'No serial'}</h2>
              <button type="button" className="back-button" onClick={handleBack}>
                ← Back to {decodedProductName}
              </button>
            </div>
            <p className="page-subtitle">Manage robot information and location history</p>

            <form className="robot-detail-form" onSubmit={handleSave}>
              <div className="form-section">
                <h3 className="section-title">Current location</h3>
                <div className="robot-current-location">
                  {location.trim() || '—'}
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Location &amp; status</h3>
                <div className="form-group">
                  <label htmlFor="robot-location" className="form-label">Location</label>
                  <input
                    type="text"
                    id="robot-location"
                    className="form-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City / location"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="robot-business" className="form-label">Business</label>
                  <input
                    type="text"
                    id="robot-business"
                    className="form-input"
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                    placeholder="Business"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="robot-installation" className="form-label">Installation Date</label>
                  <input
                    type="date"
                    id="robot-installation"
                    className="form-input"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="robot-status" className="form-label">Status</label>
                  <select
                    id="robot-status"
                    className="form-select"
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
                  <label htmlFor="robot-condition" className="form-label">Condition</label>
                  <select
                    id="robot-condition"
                    className="form-select"
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

              <div className="form-section">
                <h3 className="section-title">Equipment counts</h3>
                <div className="robot-detail-grid">
                  <div className="form-group">
                    <label htmlFor="robot-trash" className="form-label">Trash bins</label>
                    <input type="number" min={0} id="robot-trash" className="form-input" value={trashBins} onChange={(e) => setTrashBins(e.target.value)} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="robot-linen" className="form-label">Linen bins</label>
                    <input type="number" min={0} id="robot-linen" className="form-input" value={linenBins} onChange={(e) => setLinenBins(e.target.value)} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="robot-rolling" className="form-label">Rolling bases</label>
                    <input type="number" min={0} id="robot-rolling" className="form-input" value={rollingBases} onChange={(e) => setRollingBases(e.target.value)} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="robot-static" className="form-label">Static bases</label>
                    <input type="number" min={0} id="robot-static" className="form-input" value={staticBases} onChange={(e) => setStaticBases(e.target.value)} placeholder="0" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Product details</h3>
                <div className="form-group">
                  <label htmlFor="robot-serial" className="form-label">Serial number</label>
                  <input
                    type="text"
                    id="robot-serial"
                    className="form-input"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Enter serial number (optional)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="robot-manufacturer" className="form-label">Manufacturer</label>
                  <input type="text" id="robot-manufacturer" className="form-input" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Manufacturer" />
                </div>
                <div className="form-group">
                  <label htmlFor="robot-country" className="form-label">Country of origin</label>
                  <input type="text" id="robot-country" className="form-input" value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} placeholder="e.g. United States" />
                </div>
                <div className="form-group">
                  <label htmlFor="robot-model" className="form-label">Model</label>
                  <input type="text" id="robot-model" className="form-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" />
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Location history</h3>
                <p className="robot-location-history-desc">Date and time the robot was first at each location (saved in database).</p>
                <div className="activity-log-container">
                  <table className="activity-log-table">
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>First seen at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationHistory.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="robot-location-history-empty">No location history yet. Save a location above to record it.</td>
                        </tr>
                      ) : (
                        locationHistory.map((entry, index) => (
                          <tr key={`${entry.location}-${entry.firstSeenAt}-${index}`}>
                            <td>{entry.location}</td>
                            <td>{formatDateTime(entry.firstSeenAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="product-inventory-delete-btn modal-delete-btn" onClick={handleDelete}>
                  Delete robot
                </button>
                <button type="button" className="cancel-button" onClick={handleBack}>
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  Save
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RobotDetail;
