-- Robot location history: when each robot was first seen at each location.
-- Keyed by serial_number + product_id so we track per-robot, per-product.
-- Migration: 021_robot_location_history.sql

CREATE TABLE IF NOT EXISTS robot_location_history (
  id SERIAL PRIMARY KEY,
  serial_number VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (serial_number, product_id, location)
);

CREATE INDEX IF NOT EXISTS idx_robot_location_history_robot ON robot_location_history (serial_number, product_id);
CREATE INDEX IF NOT EXISTS idx_robot_location_history_first_seen ON robot_location_history (first_seen_at);
