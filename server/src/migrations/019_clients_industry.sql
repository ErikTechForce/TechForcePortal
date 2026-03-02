-- Add industry to clients (free text; app uses a suggestion list for validation/UX).
-- Migration: 019_clients_industry.sql

ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry VARCHAR(255) NULL;
