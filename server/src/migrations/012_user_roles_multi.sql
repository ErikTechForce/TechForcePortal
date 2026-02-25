-- Migration: 012_user_roles_multi.sql
-- Description: Replace single users.role with user_roles table for multiple roles per user.
--              Adds new roles: corporate, r_d, support, customer_service, it, operations, finances, manufacturing, hr.
-- Run after 011.

-- ============================================
-- USER_ROLES: many roles per user
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, role),
  CONSTRAINT user_roles_role_check CHECK (role IN (
    'admin', 'accounting', 'sales', 'marketing', 'engineers', 'installation', 'logistics',
    'corporate', 'r_d', 'support', 'customer_service', 'it', 'operations', 'finances', 'manufacturing', 'hr'
  ))
);

-- Migrate existing single role into user_roles (only if users.role exists)
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

COMMENT ON TABLE user_roles IS 'Multiple roles per user; admin can only be set by existing admin.';
