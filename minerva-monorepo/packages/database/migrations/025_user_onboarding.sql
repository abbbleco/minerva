-- 025: User registration & role onboarding (/register -> email verify -> /onboarding).
-- profiles gains acquisition attribution ("how did you hear about us") and the
-- onboarding-completion gate consumed by proxy.ts / login routing. Roles stay
-- client|operator|admin: choosing "agency" during onboarding creates an
-- agencies row + owner agency_memberships row and flips the profile to
-- operator; operators claim the email invite row already minted by the
-- members UI (agency_memberships.invite_email + status='invited').

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS acquisition_source text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS acquisition_detail text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- Pre-existing accounts (provisioned before self-registration existed) are
-- grandfathered past the /onboarding gate.
UPDATE profiles SET onboarded_at = COALESCE(onboarded_at, created_at);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
