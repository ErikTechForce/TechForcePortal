-- Migration: 011_user_roles_and_employee_user_id.sql
-- Description: Add role to users (admin, accounting, sales, marketing, engineers, installation, logistics).
--              Link employees to verified users via user_id for assignment from user list.
-- Run after 002 (users) and 001 (employees).

-- ============================================
-- USERS: add role
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'sales';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
      'admin', 'accounting', 'sales', 'marketing', 'engineers', 'installation', 'logistics'
    ));
  END IF;
END $$;

-- ============================================
-- EMPLOYEES: link to user (verified user)
-- ============================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id) WHERE user_id IS NOT NULL;

COMMENT ON COLUMN users.role IS 'User role: admin, accounting, sales, marketing, engineers, installation, logistics';
COMMENT ON COLUMN employees.user_id IS 'Links to users.id when this employee row represents a verified user';
