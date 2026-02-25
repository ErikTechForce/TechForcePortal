/**
 * Orders from techforce_portal API.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface OrderRow {
  id: number;
  order_number: string;
  company_name: string;
  status: string;
  category: string;
  employee_id: number | null;
  employee_name?: string | null;
  tracking_number?: string | null;
  estimated_delivery_date?: string | null;
  shipping_address?: string | null;
  deliver_to?: string | null;
  installation_appointment_time?: string | null;
  site_location?: string | null;
  last_contact_date?: string | null;
  installation_employee_name?: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchOrders(): Promise<OrderRow[]> {
  const res = await fetch(`${API_BASE}/api/orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.orders || [];
}

/** Fetch orders assigned to the given user (for Tasks Board To-Do / In Progress). */
export async function fetchOrdersForUser(userId: number): Promise<OrderRow[]> {
  const res = await fetch(`${API_BASE}/api/orders?assigned_to_user=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.orders || [];
}

export async function fetchOrderByOrderNumber(orderNumber: string): Promise<OrderRow | null> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
}

export interface CreateOrderPayload {
  company_name: string;
  employee_name?: string;
  user_id?: number;
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderRow> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create order');
  return data;
}

export interface UpdateOrderPayload {
  employee_name?: string | null;
  user_id?: number | null;
  category?: string;
  status?: string;
  last_contact_date?: string | null;
  tracking_number?: string | null;
  estimated_delivery_date?: string | null;
  shipping_address?: string | null;
  deliver_to?: string | null;
  installation_appointment_time?: string | null;
  installation_employee_name?: string | null;
  site_location?: string | null;
  /** Used for dashboard activity log (who performed the update) */
  acting_user?: string | null;
}

export async function updateOrder(orderNumber: string, payload: UpdateOrderPayload): Promise<OrderRow> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to update order');
  return data as OrderRow;
}

export async function deleteOrder(orderNumber: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber)}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to delete order');
}

// --- Activity log (one per order, persisted) ---
export interface ActivityLogEntryRow {
  id: number;
  order_number: string;
  timestamp: string;
  action: string;
  user: string;
}

export async function fetchOrderActivityLog(orderNumber: string): Promise<ActivityLogEntryRow[]> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber)}/activity-log`);
  if (!res.ok) throw new Error('Failed to fetch activity log');
  const data = await res.json();
  return data.entries || [];
}

export async function addOrderActivityLog(
  orderNumber: string,
  payload: { action: string; user?: string }
): Promise<ActivityLogEntryRow> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber)}/activity-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: payload.action, user: payload.user ?? 'System' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add activity log entry');
  return data;
}

// --- Invoices for an order ---
export interface OrderInvoiceRow {
  id: number;
  order_number: string;
  invoice_number: string | null;
  amount: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  has_pdf: boolean;
}

export async function fetchOrderInvoices(orderNumber: string): Promise<OrderInvoiceRow[]> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber)}/invoices`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  const data = await res.json();
  return data.invoices || [];
}

export async function createInvoiceWithPdf(
  orderNumber: string,
  payload: { pdfBase64: string; invoice_number?: string; amount?: number }
): Promise<OrderInvoiceRow & { has_pdf: boolean }> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber)}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
  return data;
}

export interface InvoiceConfirmationPayload {
  companyName: string;
  billingEntity?: string;
  billingAddress: string;
  shippingAddress: string;
  products: Array<{ productName: string; serialNumber?: string; quantity?: number }>;
  invoiceDate: string;
  dueDate: string;
  terms: string;
  userEmail?: string;
}

export async function sendInvoiceConfirmation(
  orderNumber: string,
  payload: InvoiceConfirmationPayload
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber)}/invoice-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to send invoice email');
}

/** Sales by product (TIM-E Bot, BIM-E) from completed orders, per period */
export interface SalesProductCountsPeriod {
  productData: { product: string; sales: number }[];
  totalData: { date: string; total: number }[];
}

export type SalesProductCounts = Record<'1month' | '3months' | '6months' | '1year', SalesProductCountsPeriod>;

export async function fetchSalesProductCounts(): Promise<SalesProductCounts> {
  const res = await fetch(`${API_BASE}/api/sales/product-counts`);
  if (!res.ok) throw new Error('Failed to fetch sales by product');
  const data = await res.json();
  return data as SalesProductCounts;
}

/** Site-wide activity log entry (dashboard) */
export interface SiteActivityEntry {
  id: number;
  action: string;
  user: string;
  created_at: string;
}

export async function fetchSiteActivity(limit = 50): Promise<SiteActivityEntry[]> {
  const res = await fetch(`${API_BASE}/api/activity?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch activity');
  const data = await res.json();
  return (data.entries || []) as SiteActivityEntry[];
}
