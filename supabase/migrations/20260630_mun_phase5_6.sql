-- ═══════════════════════════════════════════════════════════════════════
-- FREO MUN — PHASE 5 & 6 SCHEMA UPDATES
-- Adds Banner support, Custom Forms, and Live Session tables.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Alter Conferences Table
ALTER TABLE mun_conferences
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS custom_form_schema jsonb DEFAULT '[]';

-- 2. Live Sessions Table (Phase 6)
CREATE TABLE IF NOT EXISTS mun_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id    uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  active_mode     mun_session_mode NOT NULL DEFAULT 'ROLL_CALL',
  current_topic   text,
  timer_ends_at   timestamptz,
  timer_duration  integer, -- in seconds
  is_timer_paused boolean NOT NULL DEFAULT false,
  timer_paused_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active session" ON mun_sessions FOR SELECT
  USING (true);
CREATE POLICY "Chairs can manage session" ON mun_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_sessions.committee_id AND eb.user_id = auth.uid()));

-- 3. Speakers List Table (Phase 6)
CREATE TABLE IF NOT EXISTS mun_speakers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES mun_sessions(id) ON DELETE CASCADE,
  portfolio_id    uuid NOT NULL REFERENCES mun_portfolios(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'WAITING', -- WAITING, SPEAKING, DONE
  added_at        timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  ended_at        timestamptz
);

ALTER TABLE mun_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view speakers" ON mun_speakers FOR SELECT
  USING (true);
CREATE POLICY "Delegates can add themselves" ON mun_speakers FOR INSERT
  WITH CHECK (true); -- We will restrict this in the RLS later or app logic
CREATE POLICY "Chairs can manage speakers" ON mun_speakers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM mun_sessions s 
    JOIN mun_eb_members eb ON eb.committee_id = s.committee_id 
    WHERE s.id = mun_speakers.session_id AND eb.user_id = auth.uid()
  ));
