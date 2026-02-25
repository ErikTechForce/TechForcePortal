-- TechForce Portal – Clients (client/lead) and Invoices
-- Migration: 009_clients_type_source_invoices.sql
-- Description: Add type and source to clients (for Clients vs Leads). Create invoices table.
-- Run after 001 (clients, orders exist).

-- ============================================
-- CLIENTS: add type (client | lead) and source (for leads)
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'client'
  CHECK (type IN ('client', 'lead'));

ALTER TABLE clients ADD COLUMN IF NOT EXISTS source VARCHAR(255);

COMMENT ON COLUMN clients.type IS 'client = existing client, lead = prospect lead';
COMMENT ON COLUMN clients.source IS 'Lead source (e.g. LinkedIn, TechForce, Referral)';

-- ============================================
-- INVOICES TABLE (per order; linked to client via order company_name)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) NOT NULL REFERENCES orders(order_number) ON DELETE CASCADE,
  invoice_number VARCHAR(100),
  amount DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_number ON invoices(order_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- updated_at trigger for invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
