-- Migration: 010_simplify_order_numbers.sql
-- Description: Replace order numbers with ORD-00001, ORD-00002, ... (5-digit zero-padded).
-- Run after 001 (and 009 if invoices exist). Updates orders and all tables that reference order_number.

BEGIN;

-- 1. Create mapping: order id -> new order number (ORD-00001, ORD-00002, ... by id)
CREATE TEMP TABLE order_number_mapping AS
SELECT id, order_number AS old_number, 'ORD-' || LPAD(ROW_NUMBER() OVER (ORDER BY id)::text, 5, '0') AS new_number
FROM orders;

-- 2. Drop foreign keys that reference orders(order_number)
ALTER TABLE order_products DROP CONSTRAINT IF EXISTS order_products_order_number_fkey;
ALTER TABLE robots DROP CONSTRAINT IF EXISTS robots_order_number_fkey;
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_order_number_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_order_number_fkey;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_order_number_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_order_number_fkey;

-- 3. Update orders table first (so new numbers exist before we point children to them)
UPDATE orders o SET order_number = m.new_number
FROM order_number_mapping m WHERE o.id = m.id;

-- 4. Update child tables to use new order numbers
UPDATE order_products op SET order_number = m.new_number
FROM order_number_mapping m WHERE op.order_number = m.old_number;

UPDATE robots r SET order_number = m.new_number
FROM order_number_mapping m WHERE r.order_number = m.old_number;

UPDATE activity_logs al SET order_number = m.new_number
FROM order_number_mapping m WHERE al.order_number = m.old_number;

UPDATE chat_messages cm SET order_number = m.new_number
FROM order_number_mapping m WHERE cm.order_number = m.old_number;

UPDATE contracts c SET order_number = m.new_number
FROM order_number_mapping m WHERE c.order_number = m.old_number;

UPDATE invoices i SET order_number = m.new_number
FROM order_number_mapping m WHERE i.order_number = m.old_number;

-- 5. Re-add foreign keys
ALTER TABLE order_products ADD CONSTRAINT order_products_order_number_fkey
  FOREIGN KEY (order_number) REFERENCES orders(order_number) ON DELETE CASCADE;
ALTER TABLE robots ADD CONSTRAINT robots_order_number_fkey
  FOREIGN KEY (order_number) REFERENCES orders(order_number) ON DELETE SET NULL;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_order_number_fkey
  FOREIGN KEY (order_number) REFERENCES orders(order_number) ON DELETE CASCADE;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_order_number_fkey
  FOREIGN KEY (order_number) REFERENCES orders(order_number) ON DELETE CASCADE;
ALTER TABLE contracts ADD CONSTRAINT contracts_order_number_fkey
  FOREIGN KEY (order_number) REFERENCES orders(order_number) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_order_number_fkey
  FOREIGN KEY (order_number) REFERENCES orders(order_number) ON DELETE CASCADE;

COMMIT;
