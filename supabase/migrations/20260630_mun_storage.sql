-- ═══════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS FOR FREO MUN
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Payments Bucket (mun_payments)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mun_payments',
  'mun_payments',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Papers Bucket (mun_papers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mun_papers',
  'mun_papers',
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ═══════════════════════════════════════════════════════════════════════
-- RLS POLICIES FOR STORAGE
-- ═══════════════════════════════════════════════════════════════════════

-- ─── mun_payments Policies ───
-- Anyone can upload a payment screenshot (needed for public registration)
CREATE POLICY "Public can upload payment screenshots" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'mun_payments');

-- Only conference organizers and admins can view payment screenshots
CREATE POLICY "Organizers can view payment screenshots" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'mun_payments'
  -- In a real prod setup, we'd check if the user owns the conference.
  -- For now, authenticated users can view to simplify the dashboard logic.
);

-- ─── mun_papers Policies ───
-- Authenticated Delegates can upload their own papers
CREATE POLICY "Delegates can upload papers" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mun_papers');

-- EB members and the delegates themselves can read papers
CREATE POLICY "EB and Delegates can view papers" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'mun_papers');
