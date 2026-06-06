-- 1. Remove Anonymous direct INSERT policy completely
-- The app now uses the atomic register_for_event RPC, so public insert is no longer needed.
DROP POLICY IF EXISTS "Anyone can insert registrations" ON registrations;
DROP POLICY IF EXISTS "Anyone can insert pending registrations" ON registrations;

-- 2. Fix sheet_queue missing columns and constraints
ALTER TABLE sheet_queue ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES creators(id);
ALTER TABLE sheet_queue DROP CONSTRAINT IF EXISTS sheet_queue_status_check;
ALTER TABLE sheet_queue ADD CONSTRAINT sheet_queue_status_check CHECK (status IN ('pending', 'processing', 'done', 'failed'));
