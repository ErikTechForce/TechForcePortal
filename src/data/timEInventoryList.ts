/**
 * TIM-E Product Inventory List (from Jan 30 2026 spreadsheet).
 * TIM-E list shown on TIM-E Bot product detail page; Operations list on main Inventory page.
 */
export interface TimEInventoryRow {
  product: string;
  available: string;
  fullyAssembled: string;
  notAssembled: string;
  backOrdered: string;
  pendingSales: string;
  replacementCostPerItem: string;
  value: string;
  discardedUnits: string;
  wasteDollars: string;
}

/** Rows for TIM-E Product Inventory List (Bots Gen 1 & Gen 2 moved to product inventory table). */
export const TIM_E_INVENTORY_LIST: TimEInventoryRow[] = [
  { product: 'Plastic Bins', available: '30', fullyAssembled: '0', notAssembled: '30', backOrdered: '0', pendingSales: '', replacementCostPerItem: '$190', value: '$5,700', discardedUnits: '', wasteDollars: '' },
  { product: 'Aluminum Bins', available: '46', fullyAssembled: '25', notAssembled: '25', backOrdered: '0', pendingSales: '', replacementCostPerItem: '$350', value: '$16,100', discardedUnits: '', wasteDollars: '' },
  { product: 'Static Bases- not assembled', available: '25', fullyAssembled: '0', notAssembled: '25', backOrdered: '0', pendingSales: '', replacementCostPerItem: '$265', value: '$6,625', discardedUnits: '', wasteDollars: '' },
  { product: 'Rolling Bases', available: '51', fullyAssembled: '7', notAssembled: '48', backOrdered: '0', pendingSales: '', replacementCostPerItem: '$161', value: '$8,211', discardedUnits: '', wasteDollars: '' },
  { product: 'Lids - ABS', available: '3', fullyAssembled: '3', notAssembled: '0', backOrdered: '0', pendingSales: '', replacementCostPerItem: '$94', value: '$282', discardedUnits: '', wasteDollars: '' },
  { product: 'Lids with hole -ABS', available: '32', fullyAssembled: '32', notAssembled: '0', backOrdered: '0', pendingSales: '', replacementCostPerItem: '$94', value: '$3,008', discardedUnits: '', wasteDollars: '' },
  { product: 'Door Openers', available: '9', fullyAssembled: '', notAssembled: '9', backOrdered: '', pendingSales: '', replacementCostPerItem: '$800', value: '$7,200', discardedUnits: '', wasteDollars: '' },
  { product: 'Elevator Openers', available: '10', fullyAssembled: '', notAssembled: '10', backOrdered: '', pendingSales: '', replacementCostPerItem: '$60', value: '$600', discardedUnits: '', wasteDollars: '' },
  { product: 'PCB', available: '50', fullyAssembled: '', notAssembled: '50', backOrdered: '', pendingSales: '', replacementCostPerItem: '$80', value: '$4,000', discardedUnits: '20', wasteDollars: '$1,600' },
  { product: 'Lids with hole - Steel', available: '15', fullyAssembled: '', notAssembled: '15', backOrdered: '', pendingSales: '', replacementCostPerItem: '$80', value: '$1,200', discardedUnits: '', wasteDollars: '' },
  { product: 'Static Base steel - one piece', available: '8', fullyAssembled: '', notAssembled: '8', backOrdered: '', pendingSales: '', replacementCostPerItem: '$250', value: '$2,000', discardedUnits: '', wasteDollars: '' },
  { product: 'Base Inserts', available: '50', fullyAssembled: '', notAssembled: '50', backOrdered: '', pendingSales: '', replacementCostPerItem: '$55', value: '$2,750', discardedUnits: '', wasteDollars: '' },
  { product: 'UWB Module Decawave DWM1000 | RAK13801', available: '30', fullyAssembled: '10', notAssembled: '20', backOrdered: '', pendingSales: '', replacementCostPerItem: '$50', value: '$1,500', discardedUnits: '10', wasteDollars: '$500' },
  { product: 'Rasberry Pi', available: '12', fullyAssembled: '5', notAssembled: '7', backOrdered: '', pendingSales: '', replacementCostPerItem: '$100', value: '$1,200', discardedUnits: '5', wasteDollars: '$500' },
  { product: 'VL53L1X Time of Flight Distance Sensor', available: '30', fullyAssembled: '20', notAssembled: '10', backOrdered: '', pendingSales: '', replacementCostPerItem: '$15', value: '$450', discardedUnits: '10', wasteDollars: '$150' },
  { product: 'Octagon Bin steel', available: '23', fullyAssembled: '', notAssembled: '23', backOrdered: '', pendingSales: '', replacementCostPerItem: '$90', value: '$2,070', discardedUnits: '', wasteDollars: '' },
];

export const TIM_E_INVENTORY_TOTAL = { value: '$62,896', wasteDollars: '$2,750' };

const STORAGE_TIM_E_PARTS = 'tim_e_parts_inventory';

export function getTimEPartsInventory(): TimEInventoryRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_TIM_E_PARTS);
    if (raw) {
      const parsed = JSON.parse(raw) as TimEInventoryRow[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return TIM_E_INVENTORY_LIST.map((r) => ({ ...r }));
}

export function setTimEPartsInventory(rows: TimEInventoryRow[]): void {
  localStorage.setItem(STORAGE_TIM_E_PARTS, JSON.stringify(rows));
}

/** Operations Inventory: 3d Printers and below. Shown on main Inventory page. */
/** Operations table row (reduced columns; editable, persisted in localStorage). */
export interface OperationsInventoryRow {
  product: string;
  available: string;
  replacementCostPerItem: string;
  value: string;
}

const OPERATIONS_DEFAULT: OperationsInventoryRow[] = [
  { product: '3d Printers', available: '4', replacementCostPerItem: '$2,000', value: '$8,000' },
  { product: 'Servers', available: '4', replacementCostPerItem: '$2,500', value: '$10,000' },
  { product: 'Computers', available: '3', replacementCostPerItem: '$1,500', value: '$4,500' },
  { product: 'TVs', available: '5', replacementCostPerItem: '$350', value: '$1,750' },
  { product: 'Monitors', available: '15', replacementCostPerItem: '$150', value: '$2,250' },
  { product: 'Laptops', available: '9', replacementCostPerItem: '$2,000', value: '$18,000' },
];

const STORAGE_OPERATIONS = 'operations_inventory';

export function getOperationsInventory(): OperationsInventoryRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_OPERATIONS);
    if (raw) {
      const parsed = JSON.parse(raw) as OperationsInventoryRow[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return OPERATIONS_DEFAULT.map((r) => ({ ...r }));
}

export function setOperationsInventory(rows: OperationsInventoryRow[]): void {
  localStorage.setItem(STORAGE_OPERATIONS, JSON.stringify(rows));
}

/** Legacy full list for initial seed only */
export const OPERATIONS_INVENTORY_LIST: TimEInventoryRow[] = [
  { product: '3d Printers', available: '4', fullyAssembled: '', notAssembled: '4', backOrdered: '', pendingSales: '', replacementCostPerItem: '$2,000', value: '$8,000', discardedUnits: '', wasteDollars: '' },
  { product: 'Servers', available: '4', fullyAssembled: '', notAssembled: '4', backOrdered: '', pendingSales: '', replacementCostPerItem: '$2,500', value: '$10,000', discardedUnits: '', wasteDollars: '' },
  { product: 'Computers', available: '3', fullyAssembled: '', notAssembled: '3', backOrdered: '', pendingSales: '', replacementCostPerItem: '$1,500', value: '$4,500', discardedUnits: '', wasteDollars: '' },
  { product: 'TVs', available: '5', fullyAssembled: '', notAssembled: '5', backOrdered: '', pendingSales: '', replacementCostPerItem: '$350', value: '$1,750', discardedUnits: '', wasteDollars: '' },
  { product: 'Monitors', available: '15', fullyAssembled: '', notAssembled: '15', backOrdered: '', pendingSales: '', replacementCostPerItem: '$150', value: '$2,250', discardedUnits: '', wasteDollars: '' },
  { product: 'Laptops', available: '9', fullyAssembled: '', notAssembled: '9', backOrdered: '', pendingSales: '', replacementCostPerItem: '$2,000', value: '$18,000', discardedUnits: '', wasteDollars: '' },
];
