-- TechForce Portal – Inventory tables (schema only)
-- Migration: 008_create_inventory_tables.sql
-- Description: Creates tables for Inventory page and Product inventory (units, TIM-E/BIM-E parts, operations).
-- No seed data; run this on a local machine to set up the table structure.

-- ============================================
-- INVENTORY PRODUCTS (main product list – Inventory page)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_products (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Robot', 'Accessory')),
  sku VARCHAR(255) DEFAULT '',
  availability INTEGER NOT NULL DEFAULT 0,
  in_use INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INVENTORY UNITS (per-product units – Product detail “Inventory for this product”)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_units (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  country_of_origin VARCHAR(255) NOT NULL DEFAULT '',
  model VARCHAR(255) NOT NULL DEFAULT '',
  serial_number VARCHAR(255) NOT NULL DEFAULT '',
  status VARCHAR(50) CHECK (status IN ('Deployed', 'In Storage', 'Repair', 'Out of Order')),
  condition VARCHAR(50) CHECK (condition IN ('Working', 'Broken', 'Storage')),
  manufacturer VARCHAR(255),
  location VARCHAR(255),
  business VARCHAR(255),
  installation_date DATE,
  trash_bins INTEGER,
  linen_bins INTEGER,
  rolling_bases INTEGER,
  static_bases INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TIM-E PARTS INVENTORY (TIM-E Bot product detail – parts table)
-- ============================================
CREATE TABLE IF NOT EXISTS tim_e_parts_inventory (
  id SERIAL PRIMARY KEY,
  product VARCHAR(255) NOT NULL DEFAULT '',
  available VARCHAR(100) DEFAULT '',
  fully_assembled VARCHAR(100) DEFAULT '',
  not_assembled VARCHAR(100) DEFAULT '',
  back_ordered VARCHAR(100) DEFAULT '',
  pending_sales VARCHAR(100) DEFAULT '',
  replacement_cost_per_item VARCHAR(100) DEFAULT '',
  value VARCHAR(100) DEFAULT '',
  discarded_units VARCHAR(100) DEFAULT '',
  waste_dollars VARCHAR(100) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- BIM-E PARTS INVENTORY (BIM-E product detail – parts table)
-- ============================================
CREATE TABLE IF NOT EXISTS bim_e_parts_inventory (
  id SERIAL PRIMARY KEY,
  product VARCHAR(255) NOT NULL DEFAULT '',
  available VARCHAR(100) DEFAULT '',
  fully_assembled VARCHAR(100) DEFAULT '',
  not_assembled VARCHAR(100) DEFAULT '',
  back_ordered VARCHAR(100) DEFAULT '',
  pending_sales VARCHAR(100) DEFAULT '',
  replacement_cost_per_item VARCHAR(100) DEFAULT '',
  value VARCHAR(100) DEFAULT '',
  discarded_units VARCHAR(100) DEFAULT '',
  pending_delivery VARCHAR(100) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- OPERATIONS INVENTORY (main Inventory page – operations table)
-- ============================================
CREATE TABLE IF NOT EXISTS operations_inventory (
  id SERIAL PRIMARY KEY,
  product VARCHAR(255) NOT NULL DEFAULT '',
  available VARCHAR(100) DEFAULT '',
  replacement_cost_per_item VARCHAR(100) DEFAULT '',
  value VARCHAR(100) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_products_type ON inventory_products(type);
CREATE INDEX IF NOT EXISTS idx_inventory_units_product_id ON inventory_units(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_units_status ON inventory_units(status);
CREATE INDEX IF NOT EXISTS idx_tim_e_parts_inventory_product ON tim_e_parts_inventory(product);
CREATE INDEX IF NOT EXISTS idx_bim_e_parts_inventory_product ON bim_e_parts_inventory(product);
CREATE INDEX IF NOT EXISTS idx_operations_inventory_product ON operations_inventory(product);

-- ============================================
-- UPDATED_AT TRIGGERS (reuse existing function from 001)
-- ============================================
DROP TRIGGER IF EXISTS update_inventory_products_updated_at ON inventory_products;
CREATE TRIGGER update_inventory_products_updated_at BEFORE UPDATE ON inventory_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_units_updated_at ON inventory_units;
CREATE TRIGGER update_inventory_units_updated_at BEFORE UPDATE ON inventory_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tim_e_parts_inventory_updated_at ON tim_e_parts_inventory;
CREATE TRIGGER update_tim_e_parts_inventory_updated_at BEFORE UPDATE ON tim_e_parts_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bim_e_parts_inventory_updated_at ON bim_e_parts_inventory;
CREATE TRIGGER update_bim_e_parts_inventory_updated_at BEFORE UPDATE ON bim_e_parts_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_operations_inventory_updated_at ON operations_inventory;
CREATE TRIGGER update_operations_inventory_updated_at BEFORE UPDATE ON operations_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
