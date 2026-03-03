-- FF&E (Furniture, Fixtures, and Equipment) documents: receipts and warranties.
-- item_index matches the row index in the client-side FF&E table.
-- Migration: 020_ffe_documents.sql

CREATE TABLE IF NOT EXISTS ffe_documents (
  id SERIAL PRIMARY KEY,
  item_index INTEGER NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'warranty')),
  file_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ffe_documents_item_index ON ffe_documents (item_index);
