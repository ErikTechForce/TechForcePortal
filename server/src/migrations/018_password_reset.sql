-- Password reset: token and expiry on users (same pattern as email verification).
-- Migration: 018_password_reset.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS password_reset_token_expires_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token)
  WHERE password_reset_token IS NOT NULL;
