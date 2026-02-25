-- Migration: 013_tasks_tags_and_client.sql
-- Description: Add task_tags (role tags per task), tasks.client_id, and status 'To-Do'.
--              Each task must have at least one role tag; unassigned tasks visible by role match.
-- Run after 001 (tasks) and 012 (user_roles for role list).

-- ============================================
-- TASKS: add status To-Do and client_id
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;

-- Allow status 'To-Do' (assigned but not started)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('Unassigned', 'To-Do', 'In Progress', 'Completed'));

-- ============================================
-- TASK_TAGS: role tags for tasks (required for visibility of unassigned tasks)
-- ============================================
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

COMMENT ON TABLE task_tags IS 'Role tags for tasks; unassigned tasks visible only to users with matching roles.';
