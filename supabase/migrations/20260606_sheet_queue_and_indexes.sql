-- =============================================================================
-- Google Sheets Queue Table
-- Decouples registration flow from Google Sheets API to prevent rate limiting
-- Processed by Vercel Cron at /api/cron/sync-sheets every 5 minutes
-- =============================================================================

CREATE TABLE IF NOT EXISTS sheet_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id TEXT NOT NULL,
  row_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Index for the cron job to quickly find pending items
CREATE INDEX idx_sheet_queue_status ON sheet_queue (status) WHERE status = 'pending';

-- Auto-cleanup: delete processed entries older than 7 days
-- (Run this as a Supabase pg_cron job or manually)
-- SELECT cron.schedule('cleanup-sheet-queue', '0 3 * * *', 
--   $$DELETE FROM sheet_queue WHERE status = 'done' AND processed_at < now() - interval '7 days'$$
-- );

-- =============================================================================
-- Performance indexes for scaling to 10K users
-- =============================================================================

-- Speed up event lookups by slug (public registration pages)
CREATE INDEX IF NOT EXISTS idx_events_slug ON events (slug);

-- Speed up registration queries by event + status
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON registrations (event_id, status);

-- Speed up registration count queries
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations (event_id);
