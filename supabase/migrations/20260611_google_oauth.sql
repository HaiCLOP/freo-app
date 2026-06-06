-- Add google oauth tokens to creators
ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
