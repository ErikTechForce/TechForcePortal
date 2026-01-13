export interface OrderProduct {
  id: number;
  orderNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serialNumber?: string;
  status?: string;
}

// Product data tied to order numbers
export const orderProducts: OrderProduct[] = [
  // Orders for Acme Corporation
  { id: 1, orderNumber: 'ORD-001', productName: 'Robot A', quantity: 2, unitPrice: 50000, total: 100000 },
  { id: 2, orderNumber: 'ORD-001', productName: 'Robot B', quantity: 1, unitPrice: 75000, total: 75000 },
  { id: 3, orderNumber: 'ORD-012', productName: 'Robot A', quantity: 3, unitPrice: 50000, total: 150000 },
  
  // Orders for TechSolutions Inc.
  { id: 4, orderNumber: 'ORD-002', productName: 'Robot B', quantity: 2, unitPrice: 75000, total: 150000 },
  { id: 5, orderNumber: 'ORD-013', productName: 'Robot C', quantity: 1, unitPrice: 60000, total: 60000 },
  
  // Orders for Global Industries Ltd.
  { id: 6, orderNumber: 'ORD-003', productName: 'Robot C', quantity: 4, unitPrice: 60000, total: 240000 },
  { id: 7, orderNumber: 'ORD-014', productName: 'Robot D', quantity: 2, unitPrice: 80000, total: 160000 },
  
  // Orders for Innovation Dynamics
  { id: 8, orderNumber: 'ORD-004', productName: 'Robot D', quantity: 1, unitPrice: 80000, total: 80000 },
  { id: 9, orderNumber: 'ORD-015', productName: 'Robot E', quantity: 2, unitPrice: 90000, total: 180000 },
  
  // Orders for Advanced Systems Co.
  { id: 10, orderNumber: 'ORD-005', productName: 'Robot E', quantity: 3, unitPrice: 90000, total: 270000 },
  
  // Orders for FutureTech Solutions
  { id: 11, orderNumber: 'ORD-006', productName: 'Robot A', quantity: 1, unitPrice: 50000, total: 50000 },
  { id: 12, orderNumber: 'ORD-006', productName: 'Robot B', quantity: 1, unitPrice: 75000, total: 75000 },
  
  // Orders for Digital Innovations
  { id: 13, orderNumber: 'ORD-007', productName: 'Robot C', quantity: 2, unitPrice: 60000, total: 120000 },
  
  // Orders for Smart Systems LLC
  { id: 14, orderNumber: 'ORD-008', productName: 'Robot D', quantity: 1, unitPrice: 80000, total: 80000 },
  
  // Orders for NextGen Robotics
  { id: 15, orderNumber: 'ORD-009', productName: 'Robot E', quantity: 1, unitPrice: 90000, total: 90000 },
  
  // Orders for Automation Pro
  { id: 16, orderNumber: 'ORD-010', productName: 'Robot A', quantity: 2, unitPrice: 50000, total: 100000 },
  
  // Orders for RoboTech Industries
  { id: 17, orderNumber: 'ORD-011', productName: 'Robot B', quantity: 1, unitPrice: 75000, total: 75000 },
  { id: 18, orderNumber: 'ORD-011', productName: 'Robot C', quantity: 1, unitPrice: 60000, total: 60000 }
];

// Get products by order number and expand based on quantity
export const getProductsByOrderNumber = (orderNumber: string): OrderProduct[] => {
  const filteredProducts = orderProducts.filter(product => product.orderNumber === orderNumber);
  const expandedProducts: OrderProduct[] = [];
  
  filteredProducts.forEach((product, index) => {
    for (let i = 0; i < product.quantity; i++) {
      expandedProducts.push({
        ...product,
        id: product.id * 1000 + i, // Generate unique ID for each expanded item
        serialNumber: `${product.productName.replace(/\s+/g, '')}-${String(i + 1).padStart(3, '0')}`,
        status: i === 0 ? 'Pending' : (i === product.quantity - 1 ? 'Ready' : 'In Progress'), // Mock status logic
        quantity: 1 // Each expanded item has quantity 1
      });
    }
  });
  
  return expandedProducts;
};


