-- =============================================================================
-- Phase-wise Registration
-- Auto-enabled for events with capacity > 100 (creator's choice)
-- Limits registrations to 100/day to stay within Resend free tier
-- =============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS phase_registration BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS daily_reg_limit INTEGER DEFAULT 100;
