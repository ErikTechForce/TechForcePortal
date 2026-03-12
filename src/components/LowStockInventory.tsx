import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLowStockProducts } from '../data/inventory';
import './LowStockInventory.css';

const LowStockInventory: React.FC = () => {
  const navigate = useNavigate();
  const [lowStock, setLowStock] = useState(() => getLowStockProducts());

  useEffect(() => {
    setLowStock(getLowStockProducts());
    const onStorage = () => setLowStock(getLowStockProducts());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className="dashboard-card low-stock-card">
      <h3 className="card-title" style={{ cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
        Low stock
      </h3>
      <div className="card-content">
        {lowStock.length === 0 ? (
          <p className="low-stock-empty">No low-stock items. Set a buffer on a product to see it here when stock falls below that number.</p>
        ) : (
          <ul className="low-stock-list">
            {lowStock.map(({ product, availability }) => (
              <li
                key={product.id}
                className="low-stock-row low-stock-yellow"
                onClick={() => navigate(`/inventory/product/${product.id}`)}
              >
                <span className="low-stock-name">{product.name}</span>
                <span className="low-stock-count" aria-label={`${availability} units available`}>
                  {availability} units available
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LowStockInventory;
