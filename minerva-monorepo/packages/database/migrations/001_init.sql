-- =====================================================================
-- Minerva migration 001 — Initial schema (IMPLEMENTATION_PLAN.md §4.1)
-- Includes: relational tables, pgvector columns (768-dim), HNSW indexes,
--           match_talent RPC, RLS policies, role bridge (profiles).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Roles & tenancy bridge (auth.users -> app roles)
-- ---------------------------------------------------------------------
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name  text,
  role       text NOT NULL DEFAULT 'client'
             CHECK (role IN ('client', 'operator', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------
CREATE TABLE clients (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL,
  contact_email     text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Briefs & scoping
-- ---------------------------------------------------------------------
CREATE TABLE briefs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text NOT NULL CHECK (source IN ('web_form', 'pdf', 'audio', 'api')),
  raw_content text NOT NULL,
  media_url   text,
  status      text NOT NULL DEFAULT 'received'
              CHECK (status IN ('received', 'parsing', 'scoping', 'awaiting_approval', 'approved', 'rejected')),
  client_id   uuid REFERENCES clients (id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE brief_revisions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id    uuid NOT NULL REFERENCES briefs (id) ON DELETE CASCADE,
  revision_no int NOT NULL,
  patch       jsonb NOT NULL,
  raw_content text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brief_id, revision_no)
);

CREATE TABLE clarifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id   uuid NOT NULL REFERENCES briefs (id) ON DELETE CASCADE,
  round_no   int NOT NULL,
  questions  jsonb NOT NULL,
  answers    jsonb,
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'answered', 'timed_out')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brief_id, round_no)
);

CREATE TABLE research_artifacts (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id  uuid NOT NULL REFERENCES briefs (id) ON DELETE CASCADE,
  kind      text NOT NULL
            CHECK (kind IN ('call_transcript', 'user_testing', 'interview', 'feedback', 'survey', 'report_pdf')),
  media_url text,
  raw_text  text NOT NULL,
  status    text NOT NULL DEFAULT 'received'
            CHECK (status IN ('received', 'analyzing', 'analyzed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prds (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id         uuid NOT NULL REFERENCES briefs (id) ON DELETE CASCADE,
  title            text NOT NULL,
  summary          text NOT NULL,
  goals            jsonb NOT NULL DEFAULT '[]',
  scope            jsonb NOT NULL DEFAULT '{}',
  deliverables     jsonb NOT NULL DEFAULT '[]',
  assumptions      jsonb NOT NULL DEFAULT '[]',
  risks            jsonb NOT NULL DEFAULT '[]',
  confidence_score numeric(4, 3) NOT NULL,
  raw_output       jsonb NOT NULL,
  approved_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_stories (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id             uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  story              text NOT NULL,
  role               text NOT NULL,
  feature            text NOT NULL,
  benefit            text NOT NULL,
  acceptance_criteria jsonb NOT NULL DEFAULT '[]',
  priority           text NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  source_ref         text NOT NULL,
  source_offset      int,
  embedding          vector(768)
);
CREATE INDEX idx_user_stories_embedding ON user_stories USING hnsw (embedding vector_cosine_ops);

CREATE TABLE personas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id           uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  name             text NOT NULL,
  summary          text NOT NULL,
  needs            jsonb NOT NULL DEFAULT '[]',
  pains            jsonb NOT NULL DEFAULT '[]',
  source_artifacts jsonb NOT NULL DEFAULT '[]',
  embedding        vector(768)
);
CREATE INDEX idx_personas_embedding ON personas USING hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------
-- Talent
-- ---------------------------------------------------------------------
CREATE TABLE talents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  email            text UNIQUE NOT NULL,
  role             text NOT NULL CHECK (role IN ('designer', 'developer', 'pm', 'qa')),
  seniority        text NOT NULL CHECK (seniority IN ('junior', 'mid', 'senior', 'lead')),
  skills           text[] NOT NULL DEFAULT '{}',
  bio              text,
  years_experience smallint,
  hourly_rate_usd  numeric(8, 2),
  availability     text NOT NULL DEFAULT 'available'
                   CHECK (availability IN ('available', 'busy', 'unavailable')),
  embedding        vector(768)
);
CREATE INDEX idx_talents_embedding ON talents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_talents_role_skills ON talents USING gin (skills);

CREATE TABLE project_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id    uuid NOT NULL REFERENCES talents (id) ON DELETE CASCADE,
  project_title text NOT NULL,
  description  text NOT NULL,
  stack        text[] NOT NULL DEFAULT '{}',
  outcomes     jsonb NOT NULL DEFAULT '{}',
  embedding    vector(768),
  completed_at date
);

CREATE TABLE project_assignments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id           uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  talent_id        uuid NOT NULL REFERENCES talents (id) ON DELETE CASCADE,
  role_on_project  text NOT NULL,
  match_score      numeric(4, 3) NOT NULL,
  match_explanation text NOT NULL,
  rank             smallint NOT NULL,
  accepted         boolean,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prd_id, talent_id, role_on_project)
);

CREATE TABLE project_outcomes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid NOT NULL REFERENCES project_assignments (id) ON DELETE CASCADE,
  rating          smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  revision_count  smallint NOT NULL DEFAULT 0,
  review_notes    text,
  embedding_delta vector(768),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Learning & evaluation
-- ---------------------------------------------------------------------
CREATE TABLE correction_deltas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id         uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  field          text NOT NULL,
  gpt_value      jsonb NOT NULL,
  human_value    jsonb NOT NULL,
  prompt_version text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE eval_cases (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  brief        text NOT NULL,
  expected_prd jsonb,
  tags         text[] NOT NULL DEFAULT '{}',
  fixture_only boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Context bridge (Phase 3)
-- ---------------------------------------------------------------------
CREATE TABLE design_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id        uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  figma_file_key text,
  source        text NOT NULL CHECK (source IN ('figma', 'manual')),
  tokens        jsonb NOT NULL,
  version       int NOT NULL DEFAULT 1,
  embedding     vector(768),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project_contexts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id         uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  workspace_type text NOT NULL CHECK (workspace_type IN ('figma', 'opencode', 'cursor', 'claude_code', 'generic')),
  payload        jsonb NOT NULL,
  delivered_at   timestamptz,
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'delivered', 'failed', 'paused')),
  retry_count    smallint NOT NULL DEFAULT 0,
  paused         boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE context_verifications (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_context_id uuid NOT NULL REFERENCES project_contexts (id) ON DELETE CASCADE,
  question_bank      jsonb NOT NULL,
  pass_rate          numeric(4, 3) NOT NULL,
  failures           jsonb NOT NULL DEFAULT '[]',
  model              text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE incidents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  kind        text NOT NULL,
  control_gap text,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Ops
-- ---------------------------------------------------------------------
CREATE TABLE pipeline_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline      text NOT NULL,
  entity_id     uuid NOT NULL,
  model         text NOT NULL,
  input_tokens  int,
  output_tokens int,
  latency_ms    int,
  cost_usd      numeric(12, 6),
  success       boolean NOT NULL,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER briefs_updated_at
  BEFORE UPDATE ON briefs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Vector matching RPC (IMPLEMENTATION_PLAN.md §5.3)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_talent(query_embedding vector(768), match_limit int)
RETURNS TABLE (id uuid, full_name text, role text, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT talents.id, talents.name, talents.role,
         1 - (talents.embedding <=> query_embedding) AS similarity
  FROM talents
  WHERE talents.embedding IS NOT NULL
  ORDER BY talents.embedding <=> query_embedding ASC
  LIMIT match_limit;
END;
$$;

-- ---------------------------------------------------------------------
-- RLS: role helpers + policies (IMPLEMENTATION_PLAN.md §8)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_operator()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('operator', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_client_owner(client_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_uuid
      AND clients.contact_email = auth.jwt() ->> 'email'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE brief_revisions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_artifacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE prds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE talents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_outcomes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_deltas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_cases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contexts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs       ENABLE ROW LEVEL SECURITY;

-- profiles: users manage their own; admins manage all
CREATE POLICY profiles_self ON profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_admin ON profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- clients: owners read their own org; operators/admin all
CREATE POLICY clients_owner ON clients
  FOR SELECT USING (contact_email = auth.jwt() ->> 'email');
CREATE POLICY clients_operator ON clients
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- briefs: client owner + operator/admin
CREATE POLICY briefs_owner ON briefs
  FOR ALL USING (is_client_owner(client_id)) WITH CHECK (is_client_owner(client_id));
CREATE POLICY briefs_operator ON briefs
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- brief_revisions: via brief
CREATE POLICY brief_revisions_owner ON brief_revisions
  FOR ALL USING (is_client_owner((SELECT briefs.client_id FROM briefs WHERE briefs.id = brief_id)))
  WITH CHECK (is_client_owner((SELECT briefs.client_id FROM briefs WHERE briefs.id = brief_id)));
CREATE POLICY brief_revisions_operator ON brief_revisions
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- clarifications: client answers own rounds
CREATE POLICY clarifications_owner ON clarifications
  FOR ALL USING (is_client_owner((SELECT briefs.client_id FROM briefs WHERE briefs.id = brief_id)))
  WITH CHECK (is_client_owner((SELECT briefs.client_id FROM briefs WHERE briefs.id = brief_id)));
CREATE POLICY clarifications_operator ON clarifications
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- research_artifacts: sensitive — client owner + operator/admin
CREATE POLICY research_owner ON research_artifacts
  FOR ALL USING (is_client_owner((SELECT briefs.client_id FROM briefs WHERE briefs.id = brief_id)))
  WITH CHECK (is_client_owner((SELECT briefs.client_id FROM briefs WHERE briefs.id = brief_id)));
CREATE POLICY research_operator ON research_artifacts
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- prds / user_stories / personas / design_tokens: via brief -> client
CREATE POLICY prds_owner ON prds
  FOR ALL USING (is_client_owner((SELECT briefs.client_id FROM briefs WHERE briefs.id = brief_id)))
  WITH CHECK (is_client_owner((SELECT briefs.client_id FROM briefs WHERE briefs.id = brief_id)));
CREATE POLICY prds_operator ON prds
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

CREATE POLICY stories_owner ON user_stories
  FOR ALL USING (is_client_owner((SELECT briefs.client_id FROM briefs JOIN prds ON prds.id = prd_id WHERE briefs.id = prds.brief_id)))
  WITH CHECK (is_client_owner((SELECT briefs.client_id FROM briefs JOIN prds ON prds.id = prd_id WHERE briefs.id = prds.brief_id)));
CREATE POLICY stories_operator ON user_stories
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

CREATE POLICY personas_owner ON personas
  FOR ALL USING (is_client_owner((SELECT briefs.client_id FROM briefs JOIN prds ON prds.id = prd_id WHERE briefs.id = prds.brief_id)))
  WITH CHECK (is_client_owner((SELECT briefs.client_id FROM briefs JOIN prds ON prds.id = prd_id WHERE briefs.id = prds.brief_id)));
CREATE POLICY personas_operator ON personas
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

CREATE POLICY tokens_owner ON design_tokens
  FOR ALL USING (is_client_owner((SELECT briefs.client_id FROM briefs JOIN prds ON prds.id = prd_id WHERE briefs.id = prds.brief_id)))
  WITH CHECK (is_client_owner((SELECT briefs.client_id FROM briefs JOIN prds ON prds.id = prd_id WHERE briefs.id = prds.brief_id)));
CREATE POLICY tokens_operator ON design_tokens
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- project_contexts + context_verifications: operator/admin (+ team later via assignments)
CREATE POLICY contexts_operator ON project_contexts
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY verifications_operator ON context_verifications
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- talent domain: operator/admin only (internal)
CREATE POLICY talents_operator ON talents
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY history_operator ON project_history
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY assignments_operator ON project_assignments
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY outcomes_operator ON project_outcomes
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY deltas_operator ON correction_deltas
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY evals_operator ON eval_cases
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY incidents_operator ON incidents
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());
CREATE POLICY runs_operator ON pipeline_runs
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

-- =====================================================================
-- End of migration 001
-- =====================================================================
