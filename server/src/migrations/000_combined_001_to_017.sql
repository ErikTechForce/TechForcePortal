-- TechForce Portal – Combined schema migration (001 through 017)
-- Run this on a fresh database to create the full schema in one step.
-- Original migrations: 001_create_tables .. 017_site_activity.

-- =============================================================================
-- 001_create_tables
-- =============================================================================

-- EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(255),
  department VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  base_price DECIMAL(10, 2),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  company VARCHAR(255) NOT NULL UNIQUE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  point_of_contact VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  product VARCHAR(255),
  notes TEXT,
  start_date DATE,
  billing_address TEXT,
  site_location TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Contract', 'Inventory', 'Installation')),
  last_contact_date TIMESTAMP,
  tracking_number VARCHAR(255),
  estimated_delivery_date DATE,
  shipping_address TEXT,
  deliver_to VARCHAR(255),
  installation_appointment_time TIMESTAMP,
  installation_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  site_location TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDER_PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS order_products (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) NOT NULL REFERENCES orders(order_number) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2),
  serial_number VARCHAR(255) UNIQUE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Unassigned', 'In Progress', 'Completed')),
  assigned_to_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  start_date DATE,
  due_date DATE,
  notes TEXT,
  priority VARCHAR(50) CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROBOTS TABLE
CREATE TABLE IF NOT EXISTS robots (
  id SERIAL PRIMARY KEY,
  serial_number VARCHAR(255) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'In Use', 'Maintenance', 'Retired')),
  assigned_to_company_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  assigned_to_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  order_number VARCHAR(100) REFERENCES orders(order_number) ON DELETE SET NULL,
  location TEXT,
  notes TEXT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) NOT NULL REFERENCES orders(order_number) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  action TEXT NOT NULL,
  "user" VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) NOT NULL REFERENCES orders(order_number) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  message TEXT NOT NULL,
  "user" VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  contract_id VARCHAR(255) UNIQUE NOT NULL,
  order_number VARCHAR(100) NOT NULL REFERENCES orders(order_number) ON DELETE CASCADE,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  signed_at TIMESTAMP,
  signed_pdf_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (001)
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company);
CREATE INDEX IF NOT EXISTS idx_clients_employee_id ON clients(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_company_name ON orders(company_name);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_category ON orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_employee_id ON orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_order_products_order_number ON order_products(order_number);
CREATE INDEX IF NOT EXISTS idx_order_products_serial_number ON order_products(serial_number);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_robots_serial_number ON robots(serial_number);
CREATE INDEX IF NOT EXISTS idx_robots_product_name ON robots(product_name);
CREATE INDEX IF NOT EXISTS idx_robots_status ON robots(status);
CREATE INDEX IF NOT EXISTS idx_robots_company_id ON robots(assigned_to_company_id);
CREATE INDEX IF NOT EXISTS idx_robots_order_number ON robots(order_number);
CREATE INDEX IF NOT EXISTS idx_activity_logs_order_number ON activity_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_order_number ON chat_messages(order_number);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_id ON contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_order_number ON contracts(order_number);

-- updated_at trigger function and triggers (001)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_robots_updated_at ON robots;
CREATE TRIGGER update_robots_updated_at BEFORE UPDATE ON robots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 002_create_users_table
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 003_add_user_email_verification
-- =============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)
  WHERE verification_token IS NOT NULL;

-- =============================================================================
-- 004_add_verification_email_sent_at
-- =============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_verification_email_sent_at TIMESTAMP NULL;

-- =============================================================================
-- 005_contracts_form_data_and_pdf
-- =============================================================================
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS form_data JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS pdf_generated BYTEA;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS pdf_signed BYTEA;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

UPDATE contracts SET status = 'signed' WHERE signed_at IS NOT NULL AND (status IS NULL OR status = '');
UPDATE contracts SET status = 'pending' WHERE status IS NULL OR status = '';

-- =============================================================================
-- 006_contracts_drop_order_fk
-- =============================================================================
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_order_number_fkey;

-- =============================================================================
-- 007_contracts_form_data_columns
-- =============================================================================
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS service_address TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_contact_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_contact_phone TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_contact_name_phone TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS city_state_zip TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_contact_email TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS authorized_person_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS authorized_person_title TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS authorized_person_email TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS authorized_person_phone TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS effective_date TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS term_start_date TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS implementation_cost TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS shipping_fee TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS monthly_robotic_service_cost TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS additional_accessories_cost TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS total_monthly_cost TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS implementation_cost_due TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS discount_target TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS discount_type TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS discount_value TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_tim_e_bot TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_tim_e_charger TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_base_metal_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_insulated_food_transport_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_wheeled_bin_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_universal_platform_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_door_openers_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_neural_tech_brain_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_elevator_hardware_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_luggage_cart_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_concession_bin_tall TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_stacking_chair_cart TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_cargo_cart TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_housekeeping_cart TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_bime TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_mobile_bime TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_base_metal_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_insulated_food_transport_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_wheeled_bin_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_universal_platform_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_plastic_bags TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_door_opener_hardware_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_handheld_tablet TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tech_force_signature TEXT;

UPDATE contracts
SET
  business_name = form_data->>'businessName',
  service_address = form_data->>'serviceAddress',
  city = form_data->>'city',
  state = form_data->>'state',
  zip = form_data->>'zip',
  location_contact_name = form_data->>'locationContactName',
  location_contact_phone = form_data->>'locationContactPhone',
  location_contact_name_phone = form_data->>'locationContactNamePhone',
  city_state_zip = form_data->>'cityStateZip',
  location_contact_email = form_data->>'locationContactEmail',
  authorized_person_name = form_data->>'authorizedPersonName',
  authorized_person_title = form_data->>'authorizedPersonTitle',
  authorized_person_email = form_data->>'authorizedPersonEmail',
  authorized_person_phone = form_data->>'authorizedPersonPhone',
  effective_date = form_data->>'effectiveDate',
  term_start_date = form_data->>'termStartDate',
  implementation_cost = form_data->>'implementationCost',
  shipping_fee = form_data->>'shippingFee',
  monthly_robotic_service_cost = form_data->>'monthlyRoboticServiceCost',
  additional_accessories_cost = form_data->>'additionalAccessoriesCost',
  total_monthly_cost = form_data->>'totalMonthlyCost',
  implementation_cost_due = form_data->>'implementationCostDue',
  discount_target = form_data->>'discountTarget',
  discount_type = form_data->>'discountType',
  discount_value = form_data->>'discountValue',
  qty_tim_e_bot = form_data->>'qtyTimEBot',
  qty_tim_e_charger = form_data->>'qtyTimECharger',
  qty_base_metal_monthly = form_data->>'qtyBaseMetalMonthly',
  qty_insulated_food_transport_monthly = form_data->>'qtyInsulatedFoodTransportMonthly',
  qty_wheeled_bin_monthly = form_data->>'qtyWheeledBinMonthly',
  qty_universal_platform_monthly = form_data->>'qtyUniversalPlatformMonthly',
  qty_door_openers_monthly = form_data->>'qtyDoorOpenersMonthly',
  qty_neural_tech_brain_monthly = form_data->>'qtyNeuralTechBrainMonthly',
  qty_elevator_hardware_monthly = form_data->>'qtyElevatorHardwareMonthly',
  qty_luggage_cart_monthly = form_data->>'qtyLuggageCartMonthly',
  qty_concession_bin_tall = form_data->>'qtyConcessionBinTall',
  qty_stacking_chair_cart = form_data->>'qtyStackingChairCart',
  qty_cargo_cart = form_data->>'qtyCargoCart',
  qty_housekeeping_cart = form_data->>'qtyHousekeepingCart',
  qty_bime = form_data->>'qtyBIME',
  qty_mobile_bime = form_data->>'qtyMobileBIME',
  qty_base_metal_one_time = form_data->>'qtyBaseMetalOneTime',
  qty_insulated_food_transport_one_time = form_data->>'qtyInsulatedFoodTransportOneTime',
  qty_wheeled_bin_one_time = form_data->>'qtyWheeledBinOneTime',
  qty_universal_platform_one_time = form_data->>'qtyUniversalPlatformOneTime',
  qty_plastic_bags = form_data->>'qtyPlasticBags',
  qty_door_opener_hardware_one_time = form_data->>'qtyDoorOpenerHardwareOneTime',
  qty_handheld_tablet = form_data->>'qtyHandheldTablet',
  tech_force_signature = form_data->>'techForceSignature'
WHERE form_data IS NOT NULL;

-- =============================================================================
-- 008_create_inventory_tables
-- =============================================================================
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

CREATE TABLE IF NOT EXISTS operations_inventory (
  id SERIAL PRIMARY KEY,
  product VARCHAR(255) NOT NULL DEFAULT '',
  available VARCHAR(100) DEFAULT '',
  replacement_cost_per_item VARCHAR(100) DEFAULT '',
  value VARCHAR(100) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_products_type ON inventory_products(type);
CREATE INDEX IF NOT EXISTS idx_inventory_units_product_id ON inventory_units(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_units_status ON inventory_units(status);
CREATE INDEX IF NOT EXISTS idx_tim_e_parts_inventory_product ON tim_e_parts_inventory(product);
CREATE INDEX IF NOT EXISTS idx_bim_e_parts_inventory_product ON bim_e_parts_inventory(product);
CREATE INDEX IF NOT EXISTS idx_operations_inventory_product ON operations_inventory(product);

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

-- =============================================================================
-- 009_clients_type_source_invoices
-- =============================================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'client'
  CHECK (type IN ('client', 'lead'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source VARCHAR(255);

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

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 010_simplify_order_numbers
-- =============================================================================
BEGIN;

CREATE TEMP TABLE order_number_mapping AS
SELECT id, order_number AS old_number, 'ORD-' || LPAD(ROW_NUMBER() OVER (ORDER BY id)::text, 5, '0') AS new_number
FROM orders;

ALTER TABLE order_products DROP CONSTRAINT IF EXISTS order_products_order_number_fkey;
ALTER TABLE robots DROP CONSTRAINT IF EXISTS robots_order_number_fkey;
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_order_number_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_order_number_fkey;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_order_number_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_order_number_fkey;

UPDATE orders o SET order_number = m.new_number
FROM order_number_mapping m WHERE o.id = m.id;

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

-- =============================================================================
-- 010_invoices_pdf
-- =============================================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_document BYTEA;

-- =============================================================================
-- 011_user_roles_and_employee_user_id
-- =============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'sales';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
      'admin', 'accounting', 'sales', 'marketing', 'engineers', 'installation', 'logistics'
    ));
  END IF;
END $$;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id) WHERE user_id IS NOT NULL;

-- =============================================================================
-- 012_user_roles_multi
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, role),
  CONSTRAINT user_roles_role_check CHECK (role IN (
    'admin', 'accounting', 'sales', 'marketing', 'engineers', 'installation', 'logistics',
    'corporate', 'r_d', 'support', 'customer_service', 'it', 'operations', 'finances', 'manufacturing', 'hr'
  ))
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    INSERT INTO user_roles (user_id, role)
    SELECT id, COALESCE(role, 'sales') FROM users
    ON CONFLICT (user_id, role) DO NOTHING;
    ALTER TABLE users DROP COLUMN role;
  END IF;
END $$;

-- =============================================================================
-- 013_tasks_tags_and_client
-- =============================================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('Unassigned', 'To-Do', 'In Progress', 'Completed'));

CREATE TABLE IF NOT EXISTS task_tags (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (task_id, role),
  CONSTRAINT task_tags_role_check CHECK (role IN (
    'admin', 'accounting', 'sales', 'marketing', 'engineers', 'installation', 'logistics',
    'corporate', 'r_d', 'support', 'customer_service', 'it', 'operations', 'finances', 'manufacturing', 'hr'
  ))
);

CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_role ON task_tags(role);

-- =============================================================================
-- 014_contracts_updated_at
-- =============================================================================
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 015_order_number_sequence
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(order_number, '^ORD-0*', '') AS INTEGER)), 0) INTO max_num
  FROM orders WHERE order_number ~ '^ORD-[0-9]+$';
  PERFORM setval('order_number_seq', GREATEST(max_num, 1));
END $$;

-- =============================================================================
-- 016_orders_category_completed
-- =============================================================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_category_check;
ALTER TABLE orders ADD CONSTRAINT orders_category_check
  CHECK (category IN ('Contract', 'Inventory', 'Installation', 'Completed'));

-- =============================================================================
-- 017_site_activity
-- =============================================================================
CREATE TABLE IF NOT EXISTS site_activity (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  "user" VARCHAR(255) NOT NULL DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_activity_created_at ON site_activity(created_at DESC);
