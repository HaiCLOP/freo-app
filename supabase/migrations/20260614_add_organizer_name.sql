-- Add custom organizer name for individual events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS organizer_name TEXT;
