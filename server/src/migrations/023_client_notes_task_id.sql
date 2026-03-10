-- Migration: 023_client_notes_task_id.sql
-- Description: Optional task attachment on client notes.

ALTER TABLE client_notes
  ADD COLUMN IF NOT EXISTS task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_client_notes_task_id ON client_notes(task_id);

COMMENT ON COLUMN client_notes.task_id IS 'Optional task linked to this note.';
