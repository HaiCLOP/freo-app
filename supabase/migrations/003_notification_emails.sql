ALTER TABLE creators 
  ADD COLUMN IF NOT EXISTS notification_email TEXT,
  ADD COLUMN IF NOT EXISTS notification_email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_email_token TEXT,
  ADD COLUMN IF NOT EXISTS notification_email_token_expires_at TIMESTAMPTZ;
