-- 033_agency_subscriptions_member_read.sql
--
-- Member self-service reads on subscriptions. Migration 024 declared
-- "agency members read own" but shipped only the operator policy, so a member
-- JWT (e.g. the Minerva dashboard reading its own billing state through RLS)
-- sees zero rows. This adds the missing SELECT policy; writes stay
-- operator-only (checkout/webhooks go through the portal backend with the
-- service-role key, which bypasses RLS by design).
--
-- No new PII surface: plan/status/period-end are already visible to members
-- via the portal UI served from the same rows.

CREATE POLICY agency_subscriptions_member_read ON agency_subscriptions
  FOR SELECT USING (is_operator() OR is_agency_member(agency_id));
