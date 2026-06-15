-- Add retry_count to sheet_queue to allow for cron job backpressure handling
ALTER TABLE sheet_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
