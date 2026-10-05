-- 019: M11 sprint demos + QA test runs (IMPLEMENTATION_PLAN.md §20.5/§20.9 —
-- QNT-003 automated visual sprint demos, QNT-007 QA agent).
-- sprint_demos: a 60-second auto-generated client demo per sprint — timestamped
-- script (jsonb), collected assets (screenshots/figma/charts manifest), assembled
-- timeline + voiceover + render job plan, then a delivered video_url. Status
-- draft → ready (operator previewed) → sent. Distribution to a live client is
-- decision-level human-gated (§8): sent_at is written only after the operator
-- confirms, never automatically. Performance budget §9/§20.5: demo video < 5 min.
--
-- qa_test_runs: one row per PR the QA agent (QNT-007) analyses — diff surface,
-- AC mapping (provenance-checked), generated tests per stack, coverage report
-- against the original PR (85–95% threshold), and the generated test-PR metadata.
-- Generated tests are untrusted until reviewed: the opened test-PR is never
-- auto-merged (QA-lead approval gate). `status` stays 'open' until a human marks it.
--
-- NOTE: plan §20.5 names this "migration 015", but 013–018 are already taken —
-- this is 019 (same deviation pattern as 016/017/018).

CREATE TABLE IF NOT EXISTS sprint_demos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id       uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  sprint_no    int  NOT NULL,
  script       jsonb NOT NULL DEFAULT '[]',       -- DemoScriptSegment[]
  assets       jsonb NOT NULL DEFAULT '[]',       -- collected asset manifest
  timeline     jsonb NOT NULL DEFAULT '[]',       -- assembled scenes (remotion/ffmpeg)
  voiceover    jsonb NOT NULL DEFAULT '[]',       -- per-segment TTS narration
  render_job   jsonb,                              -- stateless render plan (1080p MP4)
  video_url    text,
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'ready', 'sent')),
  sent_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prd_id, sprint_no)
);

CREATE INDEX IF NOT EXISTS idx_sprint_demos_prd ON sprint_demos (prd_id, sprint_no DESC);

ALTER TABLE sprint_demos ENABLE ROW LEVEL SECURITY;
-- Operator-only: demos are created, previewed and (human-gated) sent by
-- operators; RLS stays FK-free and boring (§8 zone map) — there is no
-- client_id column here, so the client-read policy for launch_kits does not
-- transfer. Client delivery is via the distribution channel, not a DB read.
CREATE POLICY sprint_demos_operator ON sprint_demos
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

CREATE TRIGGER sprint_demos_updated_at
  BEFORE UPDATE ON sprint_demos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS qa_test_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id           uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
  source_pr_number int  NOT NULL,
  repo             text NOT NULL,                       -- owner/repo the PR lives in
  base_branch      text NOT NULL DEFAULT 'main',
  diff_surface     jsonb NOT NULL DEFAULT '[]',         -- ChangedFile[]
  ac_mappings      jsonb NOT NULL DEFAULT '[]',         -- provenance-checked diff↔AC map
  generated_tests  jsonb NOT NULL DEFAULT '[]',         -- per-stack GeneratedTestFile[]
  coverage         jsonb,                               -- {coverage_pct, threshold, met, report_md}
  test_pr          jsonb,                               -- {title, branch, files[], auto_merge:false, ...}
  status           text NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open', 'qa_reviewed', 'merged', 'rejected')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (repo, source_pr_number)
);

CREATE INDEX IF NOT EXISTS idx_qa_test_runs_prd ON qa_test_runs (prd_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_test_runs_repo_pr ON qa_test_runs (repo, source_pr_number DESC);

ALTER TABLE qa_test_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_test_runs_operator ON qa_test_runs
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());

CREATE TRIGGER qa_test_runs_updated_at
  BEFORE UPDATE ON qa_test_runs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();