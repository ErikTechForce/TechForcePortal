/**
 * BIM-E Inventory List (from Jan 30 2026 spreadsheet).
 * Shown on BIM-E product detail page under "Inventory for this product".
 */
export interface BimEInventoryRow {
  product: string;
  available: string;
  fullyAssembled: string;
  notAssembled: string;
  backOrdered: string;
  pendingSales: string;
  replacementCostPerItem: string;
  value: string;
  discardedUnits: string;
  pendingDelivery: string;
}

export const BIM_E_INVENTORY_LIST: BimEInventoryRow[] = [
  { product: 'PLC Controller CPU', available: '12', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$110.00', value: '$1,320.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'PLC Input Card', available: '12', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$53.00', value: '$636.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'PLC Relay OUTPUT Card', available: '12', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$66.00', value: '$792.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Alluminum Frame Assembly Cut', available: '20', fullyAssembled: '20', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$63.00', value: '$1,260.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Hood Assembly Frame Cover', available: '3', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$200.00', value: '$600.00', discardedUnits: '', pendingDelivery: '0' },
  { product: 'Drip Tray', available: '2', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$200.00', value: '$400.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Stepper Motor', available: '22', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$35.00', value: '$770.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Toggle Buttons', available: '24', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$18.00', value: '$432.00', discardedUnits: '', pendingDelivery: '0' },
  { product: 'Latching Power Button', available: '12', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$1.60', value: '$19.20', discardedUnits: '', pendingDelivery: '20' },
  { product: 'Cup Drop Unit', available: '25', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$14.00', value: '$350.00', discardedUnits: '', pendingDelivery: '10' },
  { product: 'Laptop', available: '1', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$75.00', value: '$75.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Co2 Tank 20lb', available: '1', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$1,500.00', value: '$1,500.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Nitro Tank 5Lb', available: '1', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$200.00', value: '$200.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Co2 Tank 2.5Lb', available: '1', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$150.00', value: '$150.00', discardedUnits: '', pendingDelivery: '' },
  { product: '2 Door BarBack Fridge', available: '0', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$70.00', value: '$0.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Aluminum Shaft for Dup Drop Assembly', available: '4', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$1,500.00', value: '$6,000.00', discardedUnits: '', pendingDelivery: '1' },
  { product: 'Spinner Blade Stainless Steel', available: '22', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$4.00', value: '$88.00', discardedUnits: '', pendingDelivery: '' },
  { product: '20x60 Aluminum extriuosn cut 112mm', available: '20', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$28.95', value: '$579.00', discardedUnits: '', pendingDelivery: '' },
  { product: '3D Printed Spinner Body', available: '2', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$6.00', value: '$12.00', discardedUnits: '', pendingDelivery: '0' },
  { product: '3D Printed Shaft Mount', available: '5', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$7.00', value: '$35.00', discardedUnits: '', pendingDelivery: '0' },
  { product: '3D Printed Spinner Gear', available: '5', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$4.00', value: '$20.00', discardedUnits: '', pendingDelivery: '0' },
  { product: '3D Printed Spinner Main Gear', available: '20', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$0.50', value: '$10.00', discardedUnits: '', pendingDelivery: '0' },
  { product: '3D Printed Cup Drop Mount', available: '5', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$18.00', value: '$90.00', discardedUnits: '', pendingDelivery: '0' },
  { product: '1" Foam Sheet', available: '5', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$7.00', value: '$35.00', discardedUnits: '', pendingDelivery: '0' },
  { product: '3/4" Foam Sheet', available: '10', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$60.00', value: '$600.00', discardedUnits: '', pendingDelivery: '0' },
  { product: 'Cut Foam Top', available: '22', fullyAssembled: '22', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$50.00', value: '$1,100.00', discardedUnits: '', pendingDelivery: '0' },
  { product: 'Cut Foam Sides', available: '44', fullyAssembled: '22', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$0.00', value: '', discardedUnits: '', pendingDelivery: '0' },
  { product: 'Cut Foam Back', available: '22', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '', value: '$0.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Cut Foam Front', available: '22', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '', value: '$0.00', discardedUnits: '', pendingDelivery: '' },
  { product: '8mm Fittings Through Conneciton', available: '40', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '', value: '$0.00', discardedUnits: '', pendingDelivery: '' },
  { product: '8mm Elbow Fitting', available: '40', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$2.00', value: '$80.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Solenoid Valves 8mm Food Grade V1', available: '24', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$3.00', value: '$72.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Solenoid Valves 8mm Food Grade V2', available: '40', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$20.00', value: '$800.00', discardedUnits: '', pendingDelivery: '160' },
  { product: 'Solenoid Valve v3 Stainless Steel', available: '40', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$30.00', value: '$1,200.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Solenoid valve v4 German Straight', available: '0', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$38.00', value: '$0.00', discardedUnits: '', pendingDelivery: '100' },
  { product: 'Solenoid Valve v4 German 90Deg', available: '0', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$12.00', value: '$0.00', discardedUnits: '', pendingDelivery: '0' },
  { product: 'Titan Beverage Flow Meter', available: '60', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$25.00', value: '$1,500.00', discardedUnits: '', pendingDelivery: '0' },
  { product: 'Homeing Sensor Panasonic', available: '22', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$0.44', value: '$9.68', discardedUnits: '', pendingDelivery: '0' },
  { product: 'PhotoElectric Sensors Cup Detection', available: '40', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '$0.65', value: '$26.00', discardedUnits: '', pendingDelivery: '120' },
  { product: '5mmid x 8mm od Tubing FT', available: '480', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '', value: '$0.00', discardedUnits: '', pendingDelivery: '' },
  { product: 'Gas Tubing ft', available: '0', fullyAssembled: '', notAssembled: '', backOrdered: '', pendingSales: '', replacementCostPerItem: '', value: '$0.00', discardedUnits: '', pendingDelivery: '' },
];

export const BIM_E_INVENTORY_TOTAL = { value: '$20,760.88' };

const STORAGE_BIM_E_PARTS = 'bim_e_parts_inventory';

export function getBimEPartsInventory(): BimEInventoryRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_BIM_E_PARTS);
    if (raw) {
      const parsed = JSON.parse(raw) as BimEInventoryRow[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return BIM_E_INVENTORY_LIST.map((r) => ({ ...r }));
}

export function setBimEPartsInventory(rows: BimEInventoryRow[]): void {
  localStorage.setItem(STORAGE_BIM_E_PARTS, JSON.stringify(rows));
}
