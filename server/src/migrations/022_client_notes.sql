-- Migration: 022_client_notes.sql
-- Description: Client notes table — user, date/time, note per row (replaces single notes field on client pages).

CREATE TABLE IF NOT EXISTS client_notes (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_created_at ON client_notes(created_at DESC);

COMMENT ON TABLE client_notes IS 'Per-client notes with submitter and timestamp for client detail page.';
