import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLowStockProducts, getLowStockParts, getInventoryProducts } from '../data/inventory';
import './LowStockInventory.css';

type LowStockItem =
  | { type: 'product'; id: string; name: string; availability: number }
  | { type: 'part'; productName: string; availability: number; source: 'tim-e' | 'bim-e' };

const LowStockInventory: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(() => getLowStockProducts());
  const [parts, setParts] = useState(() => getLowStockParts());

  useEffect(() => {
    setProducts(getLowStockProducts());
    setParts(getLowStockParts());
    const onStorage = () => {
      setProducts(getLowStockProducts());
      setParts(getLowStockParts());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const productIds = useMemo(() => {
    const list = getInventoryProducts();
    const timE = list.find((p) => p.name === 'TIM-E Bot');
    const bimE = list.find((p) => p.name === 'BIM-E');
    return { timE: timE?.id, bimE: bimE?.id };
  }, []);

  const combined: LowStockItem[] = useMemo(() => {
    const list: LowStockItem[] = [
      ...products.map(({ product, availability }) => ({ type: 'product' as const, id: product.id, name: product.name, availability })),
      ...parts.map(({ productName, availability, source }) => ({ type: 'part' as const, productName, availability, source })),
    ];
    list.sort((a, b) => a.availability - b.availability);
    return list;
  }, [products, parts]);

  const handleClick = (item: LowStockItem) => {
    if (item.type === 'product') {
      navigate(`/inventory/product/${item.id}`);
    } else {
      const productId = item.source === 'tim-e' ? productIds.timE : productIds.bimE;
      if (productId) navigate(`/inventory/product/${productId}`);
      else navigate('/inventory');
    }
  };

  return (
    <div className="dashboard-card low-stock-card">
      <h3 className="card-title" style={{ cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
        Low stock
      </h3>
      <div className="card-content">
        {combined.length === 0 ? (
          <p className="low-stock-empty">No low-stock items. Set a buffer on a product or TIM-E/BIM-E part to see it here when stock falls below that number.</p>
        ) : (
          <ul className="low-stock-list">
            {combined.map((item, index) => (
              <li
                key={item.type === 'product' ? item.id : `${item.source}-${item.productName}-${index}`}
                className="low-stock-row low-stock-yellow"
                onClick={() => handleClick(item)}
              >
                <span className="low-stock-name">
                  {item.type === 'product' ? item.name : `${item.productName} (${item.source === 'tim-e' ? 'TIM-E' : 'BIM-E'})`}
                </span>
                <span className="low-stock-count" aria-label={`${item.availability} units available`}>
                  {item.availability} units available
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
