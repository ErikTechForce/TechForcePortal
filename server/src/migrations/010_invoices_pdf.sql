-- Add PDF storage to invoices
-- Migration: 010_invoices_pdf.sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_document BYTEA;
COMMENT ON COLUMN invoices.pdf_document IS 'Stored invoice PDF file';
