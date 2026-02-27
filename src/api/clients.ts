/**
 * Client/lead and related data from techforce_portal API.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface ClientRow {
  id: number;
  company: string;
  employee_id: number | null;
  employee_name: string | null;
  point_of_contact: string;
  contact_email: string | null;
  contact_phone: string | null;
  product: string | null;
  notes: string | null;
  start_date: string | null;
  billing_address: string | null;
  site_location: string | null;
  type: 'client' | 'lead';
  source: string | null;
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
}

export interface ContractRow {
  id: number;
  contract_id: string;
  order_number: string;
  contract_type: string | null;
  status: string;
  generated_at: string | null;
  signed_at: string | null;
  created_at: string;
}

export interface InvoiceRow {
  id: number;
  order_number: string;
  invoice_number: string | null;
  amount: string | number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function fetchClients(type?: 'client' | 'lead', assignedToUserId?: number): Promise<ClientRow[]> {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (assignedToUserId != null && assignedToUserId > 0) params.set('assigned_to_user', String(assignedToUserId));
  const url = params.toString() ? `${API_BASE}/api/clients?${params}` : `${API_BASE}/api/clients`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch clients');
  const data = await res.json();
  return data.clients || [];
}

export async function fetchClientById(id: number): Promise<ClientRow | null> {
  const res = await fetch(`${API_BASE}/api/clients/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch client');
  return res.json();
}

export async function fetchClientOrders(clientId: number): Promise<OrderRow[]> {
  const res = await fetch(`${API_BASE}/api/clients/${clientId}/orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.orders || [];
}

export async function fetchClientContracts(clientId: number): Promise<ContractRow[]> {
  const res = await fetch(`${API_BASE}/api/clients/${clientId}/contracts`);
  if (!res.ok) throw new Error('Failed to fetch contracts');
  const data = await res.json();
  return data.contracts || [];
}

export async function fetchClientInvoices(clientId: number): Promise<InvoiceRow[]> {
  const res = await fetch(`${API_BASE}/api/clients/${clientId}/invoices`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  const data = await res.json();
  return data.invoices || [];
}

export interface CreateClientPayload {
  company: string;
  type: 'client' | 'lead';
  point_of_contact: string;
  contact_email?: string;
  contact_phone?: string;
  product?: string;
  notes?: string;
  start_date?: string;
  billing_address?: string;
  site_location?: string;
  source?: string;
  employee_name?: string;
  user_id?: number;
}

export async function createClient(payload: CreateClientPayload): Promise<ClientRow> {
  const res = await fetch(`${API_BASE}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create client');
  return data;
}

export interface UpdateClientPayload {
  user_id?: number | null;
  employee_name?: string | null;
  start_date?: string | null;
  point_of_contact?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  billing_address?: string | null;
  site_location?: string | null;
  notes?: string | null;
}

export async function updateClient(id: number, payload: UpdateClientPayload): Promise<ClientRow> {
  const res = await fetch(`${API_BASE}/api/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update client');
  return data;
}

export async function deleteClient(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/clients/${id}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to delete client');
}
