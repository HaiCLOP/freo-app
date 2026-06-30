-- ═══════════════════════════════════════════════════════════════════════
-- FREO MUN — DATABASE SCHEMA
-- All tables prefixed with mun_ to avoid collisions with core Freo.
-- RLS enabled on every table. Policies enforce tenant isolation.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Custom Types ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE mun_committee_type AS ENUM ('UN_GENERAL','UN_SPECIALIZED','UN_SECURITY','INDIAN_PARLIAMENT','INDIAN_CABINET','INDIAN_SPECIALIZED','PRESS_CORP','FICTIONAL','CRISIS','JOINT_CRISIS','CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mun_portfolio_type AS ENUM ('COUNTRY','PERSON','ROLE','TEAM','CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mun_session_format AS ENUM ('STANDARD','CRISIS','CONTINUOUS_CRISIS','HYBRID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mun_registration_status AS ENUM ('PENDING','UNDER_REVIEW','APPROVED','REJECTED','WAITLISTED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mun_paper_status AS ENUM ('PENDING','ACCEPTED','REVISION_REQUESTED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mun_award_type AS ENUM ('BEST_DELEGATE','OUTSTANDING','HIGH_COMMENDATION','VERBAL_MENTION','SPECIAL_MENTION','BEST_POSITION_PAPER','PARTICIPATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mun_session_mode AS ENUM ('ROLL_CALL','GSL','MODERATED_CAUCUS','UNMODERATED_CAUCUS','VOTING','CRISIS_UPDATE','ADJOURNMENT','SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mun_directive_status AS ENUM ('PENDING','ACCEPTED','MODIFIED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mun_eb_role_type AS ENUM ('SEC_GEN','USG','DIRECTOR','CHAIR','VICE_CHAIR','RAPPORTEUR','CRISIS_DIRECTOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mun_experience_level AS ENUM ('NONE','BEGINNER','INTERMEDIATE','ADVANCED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- 1. CONFERENCES
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_conferences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  org_name        text NOT NULL,
  logo_url        text,
  date_start      timestamptz NOT NULL,
  date_end        timestamptz NOT NULL,
  registration_open  timestamptz NOT NULL,
  registration_close timestamptz NOT NULL,
  delegate_fee    numeric(10,2) NOT NULL DEFAULT 0,
  max_delegates   integer NOT NULL DEFAULT 100,
  city            text NOT NULL,
  venue           text NOT NULL,
  description     text,
  social_links    jsonb DEFAULT '{}',
  is_published    boolean NOT NULL DEFAULT false,
  is_archived     boolean NOT NULL DEFAULT false,
  google_sheet_id text,
  razorpay_link   text,
  refund_policy   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_conferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published conferences" ON mun_conferences FOR SELECT USING (is_published = true);
CREATE POLICY "Creator can do anything with own conferences" ON mun_conferences FOR ALL USING (auth.uid() = creator_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. COMMITTEES
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_committees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   uuid NOT NULL REFERENCES mun_conferences(id) ON DELETE CASCADE,
  name            text NOT NULL,
  short_name      text NOT NULL,
  type            mun_committee_type NOT NULL DEFAULT 'CUSTOM',
  theme           text,
  agenda_items    text[] NOT NULL DEFAULT '{}',
  portfolio_type  mun_portfolio_type NOT NULL DEFAULT 'COUNTRY',
  max_delegates   integer NOT NULL DEFAULT 30,
  session_format  mun_session_format NOT NULL DEFAULT 'STANDARD',
  allow_observer  boolean NOT NULL DEFAULT false,
  allow_press     boolean NOT NULL DEFAULT false,
  bg_guide_url    text,
  study_guide_url text,
  is_public       boolean NOT NULL DEFAULT true,
  jcc_partner_id  uuid REFERENCES mun_committees(id),
  display_order   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_committees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public committees of published conferences" ON mun_committees FOR SELECT
  USING (is_public = true AND EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.is_published = true));
CREATE POLICY "Conference creator CRUD" ON mun_committees FOR ALL
  USING (EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 3. PORTFOLIOS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_portfolios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id    uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  name            text NOT NULL,
  display_name    text,
  image_url       text,
  description     text,
  special_attrs   jsonb DEFAULT '{}',
  capacity        integer NOT NULL DEFAULT 1,
  is_featured     boolean NOT NULL DEFAULT false,
  display_order   integer NOT NULL DEFAULT 0
);

ALTER TABLE mun_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view portfolios of public committees" ON mun_portfolios FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mun_committees cm JOIN mun_conferences c ON c.id = cm.conference_id
    WHERE cm.id = committee_id AND cm.is_public = true AND c.is_published = true
  ));
CREATE POLICY "Conference creator CRUD portfolios" ON mun_portfolios FOR ALL
  USING (EXISTS (
    SELECT 1 FROM mun_committees cm JOIN mun_conferences c ON c.id = cm.conference_id
    WHERE cm.id = committee_id AND c.creator_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 4. EB ROLES (configuration)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_eb_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id    uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  title           text NOT NULL,
  role_type       mun_eb_role_type NOT NULL,
  permissions     text[] NOT NULL DEFAULT '{}',
  max_count       integer NOT NULL DEFAULT 1,
  is_internal     boolean NOT NULL DEFAULT true
);

ALTER TABLE mun_eb_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view EB roles" ON mun_eb_roles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mun_committees cm JOIN mun_conferences c ON c.id = cm.conference_id
    WHERE cm.id = committee_id AND c.is_published = true
  ));
CREATE POLICY "Conference creator CRUD EB roles" ON mun_eb_roles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM mun_committees cm JOIN mun_conferences c ON c.id = cm.conference_id
    WHERE cm.id = committee_id AND c.creator_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 5. EB MEMBERS (assignments)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_eb_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   uuid NOT NULL REFERENCES mun_conferences(id) ON DELETE CASCADE,
  committee_id    uuid REFERENCES mun_committees(id) ON DELETE SET NULL,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id         uuid NOT NULL REFERENCES mun_eb_roles(id) ON DELETE CASCADE,
  role_type       mun_eb_role_type NOT NULL,
  name            text NOT NULL,
  email           text NOT NULL,
  invited_at      timestamptz NOT NULL DEFAULT now(),
  accepted_at     timestamptz,
  invite_token    text UNIQUE,
  invite_expires_at timestamptz,
  UNIQUE(conference_id, user_id, role_id)
);

ALTER TABLE mun_eb_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EB members can view their own conference EB" ON mun_eb_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid())
  );
CREATE POLICY "Conference creator manages EB" ON mun_eb_members FOR ALL
  USING (EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 6. REGISTRATIONS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_registrations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id         uuid NOT NULL REFERENCES mun_conferences(id) ON DELETE CASCADE,
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  delegate_name         text NOT NULL,
  delegate_email        text NOT NULL,
  delegate_phone        text NOT NULL,
  delegate_school       text NOT NULL,
  delegate_grade        text,
  experience_level      mun_experience_level NOT NULL DEFAULT 'NONE',
  status                mun_registration_status NOT NULL DEFAULT 'PENDING',
  committee_pref_1      uuid REFERENCES mun_committees(id),
  committee_pref_2      uuid REFERENCES mun_committees(id),
  committee_pref_3      uuid REFERENCES mun_committees(id),
  portfolio_allotted    uuid REFERENCES mun_portfolios(id),
  payment_screenshot_url text,
  payment_utr           text,
  payment_verified      boolean NOT NULL DEFAULT false,
  payment_amount        numeric(10,2) NOT NULL DEFAULT 0,
  custom_form_data      jsonb DEFAULT '{}',
  qr_ticket_url         text,
  qr_token              text UNIQUE,
  checked_in            boolean NOT NULL DEFAULT false,
  checked_in_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_registrations ENABLE ROW LEVEL SECURITY;

-- Delegates see only their own registration
CREATE POLICY "Delegates see own registration" ON mun_registrations FOR SELECT
  USING (auth.uid() = user_id);
-- Conference creator sees all
CREATE POLICY "Conference creator sees all registrations" ON mun_registrations FOR SELECT
  USING (EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));
-- EB members see registrations in their conference
CREATE POLICY "EB members see conference registrations" ON mun_registrations FOR SELECT
  USING (EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.conference_id = mun_registrations.conference_id AND eb.user_id = auth.uid()));
-- Creator manages registrations
CREATE POLICY "Creator manages registrations" ON mun_registrations FOR ALL
  USING (EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 7. POSITION PAPERS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_position_papers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES mun_registrations(id) ON DELETE CASCADE,
  committee_id    uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  version         integer NOT NULL DEFAULT 1,
  file_url        text NOT NULL,
  status          mun_paper_status NOT NULL DEFAULT 'PENDING',
  eb_comments     text,
  score           integer CHECK (score IS NULL OR (score >= 1 AND score <= 10)),
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_by     uuid REFERENCES mun_eb_members(id),
  reviewed_at     timestamptz
);

ALTER TABLE mun_position_papers ENABLE ROW LEVEL SECURITY;

-- Delegate sees own papers
CREATE POLICY "Delegate sees own papers" ON mun_position_papers FOR SELECT
  USING (EXISTS (SELECT 1 FROM mun_registrations r WHERE r.id = registration_id AND r.user_id = auth.uid()));
-- EB sees committee papers
CREATE POLICY "EB sees committee papers" ON mun_position_papers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_position_papers.committee_id AND eb.user_id = auth.uid()
  ));
-- Conference creator sees all
CREATE POLICY "Creator sees all papers" ON mun_position_papers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mun_committees cm JOIN mun_conferences c ON c.id = cm.conference_id
    WHERE cm.id = committee_id AND c.creator_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 8. AWARDS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_awards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   uuid NOT NULL REFERENCES mun_conferences(id) ON DELETE CASCADE,
  committee_id    uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES mun_registrations(id) ON DELETE CASCADE,
  type            mun_award_type NOT NULL,
  nominated_by    uuid REFERENCES mun_eb_members(id),
  approved_by     uuid REFERENCES mun_eb_members(id),
  certificate_url text,
  emailed_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conference_id, committee_id, registration_id, type)
);

ALTER TABLE mun_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delegate sees own awards" ON mun_awards FOR SELECT
  USING (EXISTS (SELECT 1 FROM mun_registrations r WHERE r.id = registration_id AND r.user_id = auth.uid()));
CREATE POLICY "Creator manages awards" ON mun_awards FOR ALL
  USING (EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));
CREATE POLICY "EB sees committee awards" ON mun_awards FOR SELECT
  USING (EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_awards.committee_id AND eb.user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 9. SESSIONS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id          uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  mode                  mun_session_mode NOT NULL DEFAULT 'ROLL_CALL',
  is_active             boolean NOT NULL DEFAULT false,
  current_speaker_id    uuid REFERENCES mun_registrations(id),
  speaker_time_seconds  integer NOT NULL DEFAULT 60,
  total_time_seconds    integer NOT NULL DEFAULT 600,
  timer_started_at      timestamptz,
  timer_paused_remaining integer,
  speakers_queue        uuid[] NOT NULL DEFAULT '{}',
  session_number        integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_sessions ENABLE ROW LEVEL SECURITY;

-- Participants in the committee can view session
CREATE POLICY "Committee participants view session" ON mun_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mun_registrations r
    JOIN mun_committees cm ON cm.id = mun_sessions.committee_id
    WHERE r.conference_id = cm.conference_id AND r.user_id = auth.uid() AND r.status = 'APPROVED'
  ) OR EXISTS (
    SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_sessions.committee_id AND eb.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM mun_committees cm JOIN mun_conferences c ON c.id = cm.conference_id
    WHERE cm.id = committee_id AND c.creator_id = auth.uid()
  ));
CREATE POLICY "EB manages session" ON mun_sessions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_sessions.committee_id AND eb.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM mun_committees cm JOIN mun_conferences c ON c.id = cm.conference_id
    WHERE cm.id = committee_id AND c.creator_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 10. SESSION LOGS (immutable)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_session_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES mun_sessions(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  event_data  jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id)
);

ALTER TABLE mun_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants view logs" ON mun_session_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mun_sessions s
    JOIN mun_committees cm ON cm.id = s.committee_id
    JOIN mun_conferences c ON c.id = cm.conference_id
    WHERE s.id = session_id AND (c.creator_id = auth.uid()
      OR EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.conference_id = c.id AND eb.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM mun_registrations r WHERE r.conference_id = c.id AND r.user_id = auth.uid() AND r.status = 'APPROVED')
    )
  ));

-- ═══════════════════════════════════════════════════════════════════════
-- 11. DIRECTIVES
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_directives (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES mun_sessions(id) ON DELETE CASCADE,
  committee_id  uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  submitted_by  uuid NOT NULL REFERENCES mun_registrations(id),
  content       text NOT NULL,
  status        mun_directive_status NOT NULL DEFAULT 'PENDING',
  response      text,
  reviewed_by   uuid REFERENCES mun_eb_members(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_directives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delegate sees own directives" ON mun_directives FOR SELECT
  USING (EXISTS (SELECT 1 FROM mun_registrations r WHERE r.id = submitted_by AND r.user_id = auth.uid()));
CREATE POLICY "EB manages directives" ON mun_directives FOR ALL
  USING (EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_directives.committee_id AND eb.user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 12. WORKING PAPERS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_working_papers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id            uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  session_id              uuid NOT NULL REFERENCES mun_sessions(id) ON DELETE CASCADE,
  title                   text NOT NULL,
  content                 text NOT NULL DEFAULT '',
  authors                 uuid[] NOT NULL DEFAULT '{}',
  is_published            boolean NOT NULL DEFAULT false,
  promoted_to_resolution  boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_working_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published papers visible to committee" ON mun_working_papers FOR SELECT
  USING (is_published = true AND EXISTS (
    SELECT 1 FROM mun_committees cm JOIN mun_conferences c ON c.id = cm.conference_id
    WHERE cm.id = committee_id AND (c.creator_id = auth.uid()
      OR EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.conference_id = c.id AND eb.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM mun_registrations r WHERE r.conference_id = c.id AND r.user_id = auth.uid() AND r.status = 'APPROVED')
    )
  ));
CREATE POLICY "EB manages working papers" ON mun_working_papers FOR ALL
  USING (EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_working_papers.committee_id AND eb.user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES (query performance + allotment optimization)
-- ═══════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_mun_conf_creator ON mun_conferences(creator_id);
CREATE INDEX IF NOT EXISTS idx_mun_conf_slug ON mun_conferences(slug);
CREATE INDEX IF NOT EXISTS idx_mun_comm_conf ON mun_committees(conference_id);
CREATE INDEX IF NOT EXISTS idx_mun_port_comm ON mun_portfolios(committee_id);
CREATE INDEX IF NOT EXISTS idx_mun_eb_roles_comm ON mun_eb_roles(committee_id);
CREATE INDEX IF NOT EXISTS idx_mun_eb_members_conf ON mun_eb_members(conference_id);
CREATE INDEX IF NOT EXISTS idx_mun_eb_members_user ON mun_eb_members(user_id);
CREATE INDEX IF NOT EXISTS idx_mun_reg_conf ON mun_registrations(conference_id);
CREATE INDEX IF NOT EXISTS idx_mun_reg_status ON mun_registrations(conference_id, status);
CREATE INDEX IF NOT EXISTS idx_mun_reg_school ON mun_registrations(conference_id, delegate_school);
CREATE INDEX IF NOT EXISTS idx_mun_reg_user ON mun_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_mun_reg_qr ON mun_registrations(qr_token);
CREATE INDEX IF NOT EXISTS idx_mun_papers_reg ON mun_position_papers(registration_id);
CREATE INDEX IF NOT EXISTS idx_mun_papers_comm ON mun_position_papers(committee_id);
CREATE INDEX IF NOT EXISTS idx_mun_awards_conf ON mun_awards(conference_id);
CREATE INDEX IF NOT EXISTS idx_mun_sessions_comm ON mun_sessions(committee_id);
CREATE INDEX IF NOT EXISTS idx_mun_logs_session ON mun_session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_mun_directives_session ON mun_directives(session_id);
CREATE INDEX IF NOT EXISTS idx_mun_wp_comm ON mun_working_papers(committee_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Enable Realtime for live sessions
-- ═══════════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE mun_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE mun_session_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE mun_directives;

-- ═══════════════════════════════════════════════════════════════════════
-- 13. FACULTY ADVISORS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_faculty_advisors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   uuid NOT NULL REFERENCES mun_conferences(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name            text NOT NULL,
  email           text NOT NULL,
  phone           text NOT NULL,
  school_name     text NOT NULL,
  is_verified     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_faculty_advisors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Faculty see themselves" ON mun_faculty_advisors FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Creator manages faculty" ON mun_faculty_advisors FOR ALL USING (EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 14. CONFERENCE RATINGS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_conference_ratings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   uuid NOT NULL REFERENCES mun_conferences(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES mun_registrations(id) ON DELETE CASCADE,
  rating          integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conference_id, registration_id)
);

ALTER TABLE mun_conference_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creator views ratings" ON mun_conference_ratings FOR SELECT USING (EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));
CREATE POLICY "Delegate inserts rating" ON mun_conference_ratings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM mun_registrations r WHERE r.id = registration_id AND r.user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 15. PRESS ARTICLES
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_press_articles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id    uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES mun_registrations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  content         text NOT NULL,
  status          text NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED')),
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_press_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sees published articles" ON mun_press_articles FOR SELECT USING (status = 'PUBLISHED');
CREATE POLICY "Author sees own articles" ON mun_press_articles FOR ALL USING (EXISTS (SELECT 1 FROM mun_registrations r WHERE r.id = author_id AND r.user_id = auth.uid()));
CREATE POLICY "EB manages articles" ON mun_press_articles FOR ALL USING (EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_press_articles.committee_id AND eb.user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 16. EB CHECKLISTS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_eb_checklists (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   uuid NOT NULL REFERENCES mun_conferences(id) ON DELETE CASCADE,
  committee_id    uuid NOT NULL REFERENCES mun_committees(id) ON DELETE CASCADE,
  task_name       text NOT NULL,
  is_completed    boolean NOT NULL DEFAULT false,
  completed_by    uuid REFERENCES mun_eb_members(id) ON DELETE SET NULL,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mun_eb_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "EB views checklist" ON mun_eb_checklists FOR SELECT USING (EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_eb_checklists.committee_id AND eb.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));
CREATE POLICY "EB updates checklist" ON mun_eb_checklists FOR UPDATE USING (EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.committee_id = mun_eb_checklists.committee_id AND eb.user_id = auth.uid()));
CREATE POLICY "Creator manages checklist" ON mun_eb_checklists FOR ALL USING (EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- 17. PERMISSION OVERRIDES
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mun_permission_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   uuid NOT NULL REFERENCES mun_conferences(id) ON DELETE CASCADE,
  role_type       mun_eb_role_type NOT NULL,
  permission      text NOT NULL,
  is_granted      boolean NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conference_id, role_type, permission)
);

ALTER TABLE mun_permission_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "EB views overrides" ON mun_permission_overrides FOR SELECT USING (EXISTS (SELECT 1 FROM mun_eb_members eb WHERE eb.conference_id = mun_permission_overrides.conference_id AND eb.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));
CREATE POLICY "Creator manages overrides" ON mun_permission_overrides FOR ALL USING (EXISTS (SELECT 1 FROM mun_conferences c WHERE c.id = conference_id AND c.creator_id = auth.uid()));

