-- 1. Fix Registrations INSERT Policy
DROP POLICY IF EXISTS "Anyone can insert registrations" ON registrations;

CREATE POLICY "Anyone can insert pending registrations" 
    ON registrations FOR INSERT 
    WITH CHECK (
        status = 'pending' AND 
        ticket_code IS NULL AND 
        checked_in_at IS NULL AND
        approved_at IS NULL
    );

-- 2. Fix sheet_queue RLS
ALTER TABLE sheet_queue ENABLE ROW LEVEL SECURITY;
-- By enabling RLS and providing no policies, we ensure only the Service Role (backend) can read/write this table.

-- 3. Lock Down Storage Buckets (Backend now uses Service Role for Storage)
DROP POLICY IF EXISTS "Creators can upload event banners" ON storage.objects;
DROP POLICY IF EXISTS "Creators can delete their event banners" ON storage.objects;

DROP POLICY IF EXISTS "Creators can upload UPI QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Creators can delete their UPI QR codes" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Creators can view their event payment screenshots" ON storage.objects;
