-- Use a sequence for new order numbers so every create gets a unique new number (no reuse).
-- Migration: 015_order_number_sequence.sql
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Set sequence to max existing ORD-N number + 1 so we don't reuse numbers
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(order_number, '^ORD-0*', '') AS INTEGER)), 0) INTO max_num
  FROM orders WHERE order_number ~ '^ORD-[0-9]+$';
  PERFORM setval('order_number_seq', GREATEST(max_num, 1));
END $$;
