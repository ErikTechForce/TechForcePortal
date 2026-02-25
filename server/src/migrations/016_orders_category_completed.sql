-- Allow 'Completed' as an order category (new stage).
-- Migration: 016_orders_category_completed.sql

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_category_check;
ALTER TABLE orders ADD CONSTRAINT orders_category_check
  CHECK (category IN ('Contract', 'Inventory', 'Installation', 'Completed'));
