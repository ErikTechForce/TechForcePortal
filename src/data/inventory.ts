/**
 * Inventory products and units (inventory items per product).
 * Persisted in localStorage so Inventory and ProductDetail stay in sync.
 */

export type ProductType = 'Robot' | 'Accessory';

export interface InventoryProduct {
  id: string;
  name: string;
  type: ProductType;
  sku: string;
  availability: number;
  inUse: number;
}

export type InventoryUnitStatus = 'Deployed' | 'In Storage' | 'Repair' | 'Out of Order';
export type InventoryUnitCondition = 'Working' | 'Broken' | 'Storage';

export interface InventoryUnit {
  id: string;
  productId: string;
  countryOfOrigin: string;
  model: string;
  serialNumber: string;
  status?: InventoryUnitStatus;
  condition?: InventoryUnitCondition;
  manufacturer?: string;
  /** City/location for TIM-E/BIM-E */
  location?: string;
  business?: string;
  installationDate?: string;
  trashBins?: number;
  linenBins?: number;
  rollingBases?: number;
  staticBases?: number;
  /** @deprecated use status/condition instead */
  gen?: string;
}

const STORAGE_PRODUCTS = 'inventory_products';
const STORAGE_UNITS = 'inventory_units';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Initial product list from contract form 2 (no Monthly/One-time labels). Type Robot vs Accessory.
const INITIAL_PRODUCTS: Omit<InventoryProduct, 'id'>[] = [
  { name: 'TIM-E Bot', type: 'Robot', sku: '', availability: 0, inUse: 0 },
  { name: 'TIM-E Charger', type: 'Robot', sku: '', availability: 0, inUse: 0 },
  { name: 'Base - Metal', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Insulated Food Transport', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Wheeled Bin', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Universal Platform', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Door Openers', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'NeuralTech Brain', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Elevator Hardware + Software', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Luggage Cart', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Concession Bin - Tall', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Stacking Chair Cart', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Cargo Cart', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Housekeeping Cart', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'BIM-E', type: 'Robot', sku: '', availability: 0, inUse: 0 },
  { name: 'Mobile BIM-E', type: 'Robot', sku: '', availability: 0, inUse: 0 },
  { name: 'Base - Metal', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Insulated Food Transport', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Wheeled Bin', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Universal Platform', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Plastic Bags', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Door Opener Hardware', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
  { name: 'Handheld Tablet w/ App', type: 'Accessory', sku: '', availability: 0, inUse: 0 },
];

function ensureInitialProducts(): InventoryProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw) as InventoryProduct[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const withIds: InventoryProduct[] = INITIAL_PRODUCTS.map((p) => ({
    ...p,
    id: genId(),
  }));
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(withIds));
  return withIds;
}

export function getInventoryProducts(): InventoryProduct[] {
  return ensureInitialProducts();
}

export function setInventoryProducts(products: InventoryProduct[]): void {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
}

export function getInventoryUnits(): InventoryUnit[] {
  try {
    const raw = localStorage.getItem(STORAGE_UNITS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InventoryUnit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setInventoryUnits(units: InventoryUnit[]): void {
  localStorage.setItem(STORAGE_UNITS, JSON.stringify(units));
}

export function addProduct(name: string, type: ProductType): InventoryProduct {
  const products = getInventoryProducts();
  const newProduct: InventoryProduct = {
    id: genId(),
    name: name.trim(),
    type,
    sku: '',
    availability: 0,
    inUse: 0,
  };
  products.push(newProduct);
  setInventoryProducts(products);
  return newProduct;
}

export type AddInventoryUnitOptions = {
  status?: InventoryUnitStatus;
  condition?: InventoryUnitCondition;
  manufacturer?: string;
  location?: string;
  business?: string;
  installationDate?: string;
  trashBins?: number;
  linenBins?: number;
  rollingBases?: number;
  staticBases?: number;
};

export function addInventoryUnit(
  productId: string,
  countryOfOrigin: string,
  model: string,
  serialNumber: string,
  options?: AddInventoryUnitOptions
): InventoryUnit {
  const units = getInventoryUnits();
  const newUnit: InventoryUnit = {
    id: genId(),
    productId,
    countryOfOrigin: countryOfOrigin.trim(),
    model: model.trim(),
    serialNumber: (serialNumber || '').trim(),
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.condition ? { condition: options.condition } : {}),
    ...(options?.manufacturer?.trim() ? { manufacturer: options.manufacturer.trim() } : {}),
    ...(options?.location?.trim() ? { location: options.location.trim() } : {}),
    ...(options?.business?.trim() ? { business: options.business.trim() } : {}),
    ...(options?.installationDate?.trim() ? { installationDate: options.installationDate.trim() } : {}),
    ...(options?.trashBins !== undefined ? { trashBins: options.trashBins } : {}),
    ...(options?.linenBins !== undefined ? { linenBins: options.linenBins } : {}),
    ...(options?.rollingBases !== undefined ? { rollingBases: options.rollingBases } : {}),
    ...(options?.staticBases !== undefined ? { staticBases: options.staticBases } : {}),
  };
  units.push(newUnit);
  setInventoryUnits(units);
  return newUnit;
}

export function getUnitsByProductId(productId: string): InventoryUnit[] {
  return getInventoryUnits().filter((u) => u.productId === productId);
}

/** Availability = units with status "In Storage"; In-use = all other units for this product. */
export function getProductAvailabilityAndInUse(productId: string): { availability: number; inUse: number } {
  const units = getUnitsByProductId(productId);
  const availability = units.filter((u) => u.status === 'In Storage').length;
  const inUse = units.length - availability;
  return { availability, inUse };
}

/** Robot fleet stats from TIM-E and BIM-E bot units in inventory (for Dashboard and Robots page). Excludes TIM-E Charger. */
export function getRobotFleetStats(): { deployed: number; inStorage: number; needsMaintenance: number } {
  const products = getInventoryProducts().filter((p) => p.type === 'Robot' && p.name !== 'TIM-E Charger');
  let deployed = 0;
  let inStorage = 0;
  let needsMaintenance = 0;
  for (const product of products) {
    const units = getUnitsByProductId(product.id);
    for (const u of units) {
      const status = u.status;
      if (status === 'Deployed') deployed += 1;
      else if (status === 'Repair' || status === 'Out of Order') needsMaintenance += 1;
      else inStorage += 1; // 'In Storage' or undefined
    }
  }
  return { deployed, inStorage, needsMaintenance };
}

export type UpdateInventoryUnitUpdates = {
  countryOfOrigin?: string;
  model?: string;
  serialNumber?: string;
  status?: InventoryUnitStatus;
  condition?: InventoryUnitCondition;
  manufacturer?: string;
  location?: string;
  business?: string;
  installationDate?: string;
  trashBins?: number;
  linenBins?: number;
  rollingBases?: number;
  staticBases?: number;
};

export function updateInventoryUnit(unitId: string, updates: UpdateInventoryUnitUpdates): InventoryUnit | null {
  const units = getInventoryUnits();
  const index = units.findIndex((u) => u.id === unitId);
  if (index === -1) return null;
  const next = { ...units[index], ...updates };
  if (updates.countryOfOrigin !== undefined) next.countryOfOrigin = updates.countryOfOrigin.trim();
  if (updates.model !== undefined) next.model = updates.model.trim();
  if (updates.serialNumber !== undefined) next.serialNumber = updates.serialNumber.trim();
  if (updates.manufacturer !== undefined) next.manufacturer = updates.manufacturer.trim() || undefined;
  if (updates.location !== undefined) next.location = updates.location.trim() || undefined;
  if (updates.business !== undefined) next.business = updates.business.trim() || undefined;
  if (updates.installationDate !== undefined) next.installationDate = updates.installationDate.trim() || undefined;
  units[index] = next;
  setInventoryUnits(units);
  return next;
}

export function deleteInventoryUnit(unitId: string): boolean {
  const units = getInventoryUnits().filter((u) => u.id !== unitId);
  if (units.length === getInventoryUnits().length) return false;
  setInventoryUnits(units);
  return true;
}
