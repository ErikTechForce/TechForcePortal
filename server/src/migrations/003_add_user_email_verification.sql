-- TechForce Portal Database Schema
-- Migration: 003_add_user_email_verification.sql
-- Description: Adds email verification columns to users table.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)
  WHERE verification_token IS NOT NULL;
