-- =============================================================================
-- Google Drive Integration
-- Stores OAuth tokens so the app can access the creator's Google Drive
-- =============================================================================

ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_token_updated_at TIMESTAMPTZ;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT;
