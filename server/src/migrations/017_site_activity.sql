-- Site-wide activity log for dashboard (orders, tasks, etc.).
-- Migration: 017_site_activity.sql

CREATE TABLE IF NOT EXISTS site_activity (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  "user" VARCHAR(255) NOT NULL DEFAULT 'System',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_activity_created_at ON site_activity(created_at DESC);
