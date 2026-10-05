// Minerva shared domain types (IMPLEMENTATION_PLAN.md §4, §5).
// Single source of truth for the whole monorepo: apps and ai-core import from here.

export type BriefSource =
  | "web_form"
  | "pdf"
  | "audio"
  | "api"
  | "whatsapp"
  | "slack"
  | "meeting"
  | "docs"
  | "figma"
  | "github"
  | "discord"
  | "teams"
  | "gitlab"
  | "jira"
  | "zeplin"
  | "loom";
export type BriefStatus =
  | "received"
  | "parsing"
  | "scoping"
  | "awaiting_approval"
  | "approved"
  | "rejected";

export type TalentRole = "designer" | "developer" | "pm" | "qa";
export type Seniority = "junior" | "mid" | "senior" | "lead";
export type Availability = "available" | "busy" | "unavailable";
export type StoryPriority = "P0" | "P1" | "P2" | "P3";

export type ProfileRole = "client" | "operator" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  role: ProfileRole;
  acquisition_source: string | null;
  acquisition_detail: string | null;
  onboarded_at: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  organization_name: string;
  contact_email: string;
  whatsapp_phone: string | null;
  agency_id: string;
  created_at: string;
}

export interface Brief {
  id: string;
  source: BriefSource;
  raw_content: string;
  media_url: string | null;
  status: BriefStatus;
  client_id: string | null;
  agency_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BriefRevision {
  id: string;
  brief_id: string;
  revision_no: number;
  patch: Record<string, unknown>;
  raw_content: string;
  source_channel: StreamChannel | null;
  created_at: string;
}

export type ClarificationStatus = "pending" | "answered" | "timed_out";

export interface ClarificationQuestion {
  q: string;
  reason?: string;
  suggested_options?: string[];
}

export interface Clarification {
  id: string;
  brief_id: string;
  round_no: number;
  questions: ClarificationQuestion[];
  answers: { q_ref: string; answer: string }[] | null;
  status: ClarificationStatus;
  created_at: string;
}

export type ResearchKind =
  | "call_transcript"
  | "user_testing"
  | "interview"
  | "feedback"
  | "survey"
  | "report_pdf";

export interface ResearchArtifact {
  id: string;
  brief_id: string;
  kind: ResearchKind;
  media_url: string | null;
  raw_text: string;
  status: "received" | "analyzing" | "analyzed" | "failed";
  source_channel: StreamChannel | null;
  created_at: string;
}

export interface PersonaNeed {
  need: string;
  source_ref: string;
}

export interface PersonaPain {
  pain: string;
  source_ref: string;
}

export interface Persona {
  id: string;
  prd_id: string;
  name: string;
  summary: string;
  needs: PersonaNeed[];
  pains: PersonaPain[];
  source_artifacts: string[];
  embedding?: number[];
  created_at: string;
}

export interface PrdGoal {
  goal: string;
  kpi?: string;
}

export interface PrdScope {
  in_scope: string[];
  out_of_scope: string[];
}

export interface Prd {
  id: string;
  brief_id: string;
  title: string;
  summary: string;
  goals: PrdGoal[];
  scope: PrdScope;
  deliverables: string[];
  assumptions: { text: string; is_question?: boolean }[];
  risks: string[];
  confidence_score: number;
  raw_output: Record<string, unknown>;
  approved_at: string | null;
  created_at: string;
}

export interface UserStory {
  id: string;
  prd_id: string;
  story: string;
  role: string;
  feature: string;
  benefit: string;
  acceptance_criteria: string[];
  priority: StoryPriority;
  source_ref: string;
  source_offset: number | null;
  embedding?: number[];
  created_at: string;
}

export interface Talent {
  id: string;
  name: string;
  email: string;
  role: TalentRole;
  seniority: Seniority;
  skills: string[];
  bio: string | null;
  years_experience: number | null;
  hourly_rate_usd: number | null;
  availability: Availability;
  embedding?: number[];
}

export interface ProjectHistory {
  id: string;
  talent_id: string;
  project_title: string;
  description: string;
  stack: string[];
  outcomes: Record<string, unknown>;
  embedding?: number[];
  completed_at: string | null;
}

export interface ProjectAssignment {
  id: string;
  prd_id: string;
  talent_id: string;
  role_on_project: string;
  match_score: number;
  match_explanation: string;
  rank: number;
  accepted: boolean | null;
  created_at: string;
}

export interface ProjectOutcome {
  id: string;
  assignment_id: string;
  rating: number;
  revision_count: number;
  review_notes: string | null;
  embedding_delta?: number[];
  created_at: string;
}

export interface CorrectionDelta {
  id: string;
  prd_id: string;
  field: string;
  gpt_value: Record<string, unknown>;
  human_value: Record<string, unknown>;
  prompt_version: string;
  created_at: string;
}

export interface EvalCase {
  id: string;
  name: string;
  brief: string;
  expected_prd: Record<string, unknown> | null;
  tags: string[];
  fixture_only: boolean;
  created_at: string;
}

export interface DesignTokenSet {
  colors: Record<string, string>;
  typography: Record<string, unknown>;
  spacing: Record<string, unknown>;
  radii: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DesignTokens {
  id: string;
  prd_id: string;
  figma_file_key: string | null;
  source: "figma" | "manual";
  tokens: DesignTokenSet;
  version: number;
  embedding?: number[];
  created_at: string;
}

export type WorkspaceType = "figma" | "opencode" | "cursor" | "claude_code" | "generic";
export type ContextStatus = "pending" | "delivered" | "failed" | "paused";

export interface ProjectContext {
  id: string;
  prd_id: string;
  workspace_type: WorkspaceType;
  payload: Record<string, unknown>;
  delivered_at: string | null;
  status: ContextStatus;
  retry_count: number;
  paused: boolean;
  created_at: string;
}

export interface ContextVerification {
  id: string;
  project_context_id: string;
  question_bank: { q: string; expected_topic: string }[];
  pass_rate: number;
  failures: unknown[];
  model: string;
  created_at: string;
}

export interface Incident {
  id: string;
  entity_type: string;
  entity_id: string;
  kind: string;
  control_gap: string | null;
  resolved_at: string | null;
  created_at: string;
}

export type PipelineName =
  | "parse_brief"
  | "scope_prd"
  | "match_talent"
  | "extract_tokens"
  | "push_context"
  | "insight_synthesis"
  | "clarify_round"
  | "verify_context"
  | "classify_message"
  | "ingest_whatsapp"
  | "ingest_slack"
  | "ingest_github"
  | "ingest_meeting"
  | "ingest_figma"
  | "ingest_docs"
  | "ingest_discord"
  | "ingest_teams"
  | "ingest_gitlab"
  | "ingest_jira"
  | "ingest_zeplin"
  | "ingest_loom";

export interface PipelineRun {
  id: string;
  pipeline: PipelineName;
  entity_id: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  cost_usd: number | null;
  success: boolean;
  error: string | null;
  created_at: string;
}

// --- Vector RPC result (§5.3) ---
export interface TalentMatch {
  id: string;
  full_name: string;
  role: TalentRole;
  similarity: number;
}

export interface IpsReport {
  pipeline: PipelineName;
  entity_id: string;
  ips: number;
  section_scores: Record<string, number>;
  weights: Record<string, number>;
  run_at: string;
}

// --- Phase 4: Context Streams (§19) ---
export type StreamChannel =
  | "whatsapp"
  | "slack"
  | "github"
  | "meeting"
  | "docs"
  | "figma"
  | "discord"
  | "teams"
  | "gitlab"
  | "jira"
  | "zeplin"
  | "loom";

/** 6-way message taxonomy (§19.3). */
export type StreamKind =
  | "scope_update"
  | "research"
  | "design_feedback"
  | "shipped_work"
  | "automated_noise"
  | "escalation";

/** Route exits (§19.4/19.5). */
export type RouteExit = "brief_revision" | "research_artifact" | "design_drift" | "shipped_work" | "ledger";

export interface ClassificationResult {
  kind: StreamKind;
  confidence: number;
  model: string;
  reason: string;
  brief_ids?: string[];
  /** Ledger enrichment set by the ingest executor when the inbound was a voice note. */
  voice_note?: boolean;
}

export interface IngestedMessage {
  channel: StreamChannel;
  external_message_id: string;
  message_type: "text" | "voice" | "file" | "card" | "thread" | "event";
  raw_payload: Record<string, unknown>;
  normalized_text: string;
  sender: string | null;
  client_id?: string | null;
}

export interface ClientChannelRow {
  id: string;
  client_id: string;
  agency_id: string;
  channel: StreamChannel;
  address: string;
  enabled: boolean;
  /** Per-channel kill switch (§19.6) — receivers ack-and-drop while paused. */
  paused: boolean;
  credentials: Record<string, unknown>;
  created_at: string;
}

export interface AgencyChannelLink {
  id: string;
  agency_id: string;
  channel: StreamChannel;
  address: string;
  verify_token: string | null;
  credentials: Record<string, unknown>;
  enabled: boolean;
  paused: boolean;
  created_at: string;
}

export interface IngestedEventRow {
  id: string;
  client_id: string;
  channel: StreamChannel;
  external_message_id: string;
  direction: "inbound" | "outbound";
  message_type: string;
  raw_payload: Record<string, unknown>;
  normalized_text: string;
  classification: ClassificationResult;
  route: RouteExit;
  status: "processed" | "failed" | "needs_attention";
  created_at: string;
}

// --- M8: Scope intelligence (§20.3 QNT-001 change orders) ---
export type ChangeOrderStatus = "pending" | "approved" | "sent" | "paid" | "applied" | "rejected";

export interface ScopeDetection {
  in_scope: boolean;
  max_similarity: number;
  reason: string;
  matched_story?: string;
}

export interface ChangeOrder {
  id: string;
  brief_id: string;
  client_id: string;
  request_text: string;
  request_snapshot: Record<string, unknown>;
  source_channel: StreamChannel | null;
  classification: ClassificationResult;
  detection: ScopeDetection;
  complexity: number | null;
  estimated_hours: number | null;
  estimated_cost_usd: number | null;
  status: ChangeOrderStatus;
  doc_url: string | null;
  stripe_session_id: string | null;
  stripe_session_url: string | null;
  created_at: string;
  updated_at: string;
}

// --- M8: Shadow PM audits (§20.6 QNT-004) ---
export type PrdAuditStatus = "open" | "asked" | "answered" | "closed";

/** Mirrors ai-core's AuditDimension (DB stays dependency-free). */
export type PrdAuditDimension = "error_handling" | "edge_cases" | "security" | "performance" | "ux";

/** Structural mirror of ai-core's GapAudit (DB stays dependency-free). */
export interface PrdAuditGap {
  dimension: PrdAuditDimension;
  gap: string;
  priority: "critical" | "high" | "medium" | "low";
  evidence: string;
  reason: string;
}

export interface PrdAudit {
  id: string;
  prd_id: string;
  gaps: PrdAuditGap[];
  /** PrdAuditSource snapshot at audit time (§5.2 provenance). */
  source_snapshot: Record<string, unknown>;
  /** "deterministic" or the model name used. */
  model: string;
  status: PrdAuditStatus;
  created_at: string;
}

// --- M9: Client launch kits (§20.10 QNT-008) ---
export type LaunchKitStatus = "draft" | "ready" | "sent";

export interface LaunchKitSection {
  id: string;
  title: string;
  kind: "portal" | "guide" | "roadmap" | "tools" | "welcome_video" | "survey";
  content: string;
}

export interface LaunchKitRoadmapMilestone {
  bucket: "0-30" | "31-60" | "61-90";
  week: number;
  title: string;
  description: string;
  source: "deliverable" | "passport_gate" | "foundation";
  deliverable?: string;
}

export interface LaunchKitRoadmap {
  prd_id: string;
  generated_at: string;
  kickoff_week: number;
  milestones: LaunchKitRoadmapMilestone[];
}

export interface LaunchKit {
  id: string;
  client_id: string;
  prd_id: string;
  sections: LaunchKitSection[];
  roadmap: LaunchKitRoadmap | null;
  survey_url: string | null;
  status: LaunchKitStatus;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- M10: Retention + knowledge (§20.7/§20.8 — QNT-005/QNT-006) ---
export interface ClientScoreRow {
  id: string;
  client_id: string;
  css: number;
  churn_probability: number;
  breakdown: Record<string, unknown>;
  window: string;
  created_at: string;
}

export interface ProjectDnaRow {
  id: string;
  prd_id: string;
  version: number;
  sections: Record<string, unknown>[];
  created_at: string;
}

// --- M11: Sprint demos + QA agent (§20.5/§20.9 — QNT-003/QNT-007) ---
export type SprintDemoStatus = "draft" | "ready" | "sent";

export interface SprintDemoRow {
  id: string;
  prd_id: string;
  sprint_no: number;
  script: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  timeline: Record<string, unknown>[];
  voiceover: Record<string, unknown>[];
  render_job: Record<string, unknown> | null;
  video_url: string | null;
  status: SprintDemoStatus;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type QaTestRunStatus = "open" | "qa_reviewed" | "merged" | "rejected";

/** One QA-agent analysis of a source PR. */
export interface QaTestRunRow {
  id: string;
  prd_id: string;
  source_pr_number: number;
  repo: string;
  base_branch: string;
  diff_surface: Record<string, unknown>[];
  ac_mappings: Record<string, unknown>[];
  generated_tests: Record<string, unknown>[];
  coverage: Record<string, unknown> | null;
  test_pr: Record<string, unknown> | null;
  status: QaTestRunStatus;
  created_at: string;
  updated_at: string;
}

// --- M-SAAS: Agency tenancy (AGENCY_IMP_PLAN.md §3) ---
export type AgencyStatus = "trial" | "active" | "suspended";
export type AgencyMembershipRole = "owner" | "manager" | "operator" | "viewer";
export type AgencyMembershipStatus = "active" | "invited" | "suspended";
export type AgencyKeyPurpose = "server" | "publishable";
export type AgencyKeyStatus = "active" | "revoked" | "expired";
export type AgencyWebhookStatus = "active" | "paused";
export type WebhookDeliveryStatus = "pending" | "delivered" | "failed" | "permanent_failure";
export type AgencyUsageMetric = "briefs" | "prds" | "ai_tokens" | "pipeline_runs" | "storage_mb";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  status: AgencyStatus;
  plan: string;
  created_by: string | null;
  settings: {
    allowed_redirects?: string[];
    form_map?: Record<string, string>;
    branding?: Record<string, unknown>;
  };
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyMembership {
  id: string;
  agency_id: string;
  user_id: string | null;
  invite_email: string | null;
  role: AgencyMembershipRole;
  status: AgencyMembershipStatus;
  permissions: string[];
  created_at: string;
}

export interface AgencyApiKey {
  id: string;
  agency_id: string;
  name: string;
  purpose: AgencyKeyPurpose;
  key_prefix: string;
  key_last4: string;
  key_hash: string;
  status: AgencyKeyStatus;
  rate_limit_per_min: number | null;
  rate_window_start: string | null;
  rate_window_count: number;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  revoked_reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AgencyWebhook {
  id: string;
  agency_id: string;
  event: string;
  url: string;
  signing_secret: string;
  status: AgencyWebhookStatus;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  agency_id: string;
  event: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  attempt: number;
  status: WebhookDeliveryStatus;
  last_status_code: number | null;
  next_retry_at: string | null;
  created_at: string;
  delivered_at: string | null;
}

export interface AgencyUsage {
  id: string;
  agency_id: string;
  period: string;
  metric: AgencyUsageMetric;
  value: number;
  last_updated_at: string;
}

export type AgencySubscriptionGateway = "stripe" | "paystack" | "paypal";
export type AgencySubscriptionPlan = "hobby" | "pro" | "agency";
export type AgencySubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid";
export type AgencyInvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";
export type AgencyInvoiceCurrency = "ZAR" | "NGN" | "GHS" | "KES" | "USD";

export interface AgencySubscription {
  id: string;
  agency_id: string;
  gateway: AgencySubscriptionGateway;
  plan: AgencySubscriptionPlan;
  status: AgencySubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  last_payment_at: string | null;
  gateway_subscription_id: string | null;
  gateway_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyInvoice {
  id: string;
  agency_id: string;
  subscription_id: string | null;
  amount: number;
  currency: AgencyInvoiceCurrency;
  status: AgencyInvoiceStatus;
  gateway: AgencySubscriptionGateway;
  gateway_reference: string | null;
  hosted_url: string | null;
  created_at: string;
  paid_at: string | null;
}