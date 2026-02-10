-- TechForce Portal Database Schema
-- Migration: 004_add_verification_email_sent_at.sql
-- Description: Adds last_verification_email_sent_at for resend rate limiting (30s).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_verification_email_sent_at TIMESTAMP NULL;
