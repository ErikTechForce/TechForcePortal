export interface Order {
  id: number;
  companyName: string;
  orderNumber: string;
  status: string;
  employee: string | null;
  category: 'Contract' | 'Inventory' | 'Installation';
  lastContactDate?: string; // For Contract stage
  trackingNumber?: string; // For Delivery stage
  estimatedDeliveryDate?: string; // For Delivery stage
  shippingAddress?: string; // For Delivery stage
  deliverTo?: string; // For Delivery stage
  installationAppointmentTime?: string; // For Installation stage
  installationEmployee?: string; // For Installation stage
  siteLocation?: string; // For Installation stage
}

// Data from Pending component - Contracts
export const contractsOrders: Order[] = [
  { id: 1, companyName: 'Acme Corporation', orderNumber: 'ORD-001', status: 'Pending', employee: 'John Smith', category: 'Contract', lastContactDate: '2024-01-15 10:30 AM' },
  { id: 2, companyName: 'TechSolutions Inc.', orderNumber: 'ORD-002', status: 'In Progress', employee: 'Michael Chen', category: 'Contract', lastContactDate: '2024-01-16 02:15 PM' },
  { id: 3, companyName: 'Global Industries Ltd.', orderNumber: 'ORD-003', status: 'Pending', employee: 'Emily Davis', category: 'Contract', lastContactDate: '2024-01-14 09:00 AM' },
  { id: 4, companyName: 'Innovation Dynamics', orderNumber: 'ORD-004', status: 'Approved', employee: 'David Wilson', category: 'Contract', lastContactDate: '2024-01-17 11:45 AM' },
  { id: 5, companyName: 'Advanced Systems Co.', orderNumber: 'ORD-005', status: 'Pending', employee: 'Lisa Anderson', category: 'Contract', lastContactDate: '2024-01-13 03:20 PM' }
];

// Data from Pending component - Inventory
export const inventoryOrders: Order[] = [
  { id: 6, companyName: 'FutureTech Solutions', orderNumber: 'ORD-006', status: 'In Shipment', employee: 'Sarah Johnson', category: 'Inventory', trackingNumber: 'TRK-123456789', estimatedDeliveryDate: '2024-01-25' },
  { id: 7, companyName: 'Digital Innovations', orderNumber: 'ORD-007', status: 'Pending', employee: null, category: 'Inventory', trackingNumber: 'TRK-987654321', estimatedDeliveryDate: '2024-01-28' },
  { id: 8, companyName: 'Smart Systems LLC', orderNumber: 'ORD-008', status: 'Delivered', employee: 'Emily Davis', category: 'Inventory', trackingNumber: 'TRK-456789123', estimatedDeliveryDate: '2024-01-20' },
  { id: 9, companyName: 'NextGen Robotics', orderNumber: 'ORD-009', status: 'Pending', employee: null, category: 'Inventory', trackingNumber: 'TRK-789123456', estimatedDeliveryDate: '2024-01-30' },
  { id: 10, companyName: 'Automation Pro', orderNumber: 'ORD-010', status: 'In Shipment', employee: 'Lisa Anderson', category: 'Inventory', trackingNumber: 'TRK-321654987', estimatedDeliveryDate: '2024-01-27' },
  { id: 11, companyName: 'RoboTech Industries', orderNumber: 'ORD-011', status: 'Delivered', employee: null, category: 'Inventory', trackingNumber: 'TRK-654987321', estimatedDeliveryDate: '2024-01-22' }
];

// Data from Pending component - Installation
export const installationOrders: Order[] = [
  { id: 12, companyName: 'Acme Corporation', orderNumber: 'ORD-012', status: 'Scheduled', employee: 'John Smith', category: 'Installation', installationAppointmentTime: '2024-01-20 09:00 AM' },
  { id: 13, companyName: 'TechSolutions Inc.', orderNumber: 'ORD-013', status: 'Pending', employee: 'Michael Chen', category: 'Installation', installationAppointmentTime: '2024-01-22 02:00 PM' },
  { id: 14, companyName: 'Global Industries Ltd.', orderNumber: 'ORD-014', status: 'In Progress', employee: 'Emily Davis', category: 'Installation', installationAppointmentTime: '2024-01-18 10:30 AM' },
  { id: 15, companyName: 'Innovation Dynamics', orderNumber: 'ORD-015', status: 'Completed', employee: 'David Wilson', category: 'Installation', installationAppointmentTime: '2024-01-15 01:00 PM' }
];

// All orders combined
export const allOrders: Order[] = [
  ...contractsOrders,
  ...inventoryOrders,
  ...installationOrders
];

// Get orders by company name
export const getOrdersByCompanyName = (companyName: string): Order[] => {
  return allOrders.filter(order => order.companyName === companyName);
};

// Get order by order number
export const getOrderByOrderNumber = (orderNumber: string): Order | undefined => {
  return allOrders.find(order => order.orderNumber === orderNumber);
};

