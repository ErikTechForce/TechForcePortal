-- Migration: 006_contracts_drop_order_fk.sql
-- Drop FK so contracts can be saved for any order_number (e.g. when orders are mock data).

ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_order_number_fkey;
