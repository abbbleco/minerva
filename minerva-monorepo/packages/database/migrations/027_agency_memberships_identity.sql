-- 027: finish the agency_memberships identity repair that 022's DO-block
-- skipped on installs where the legacy composite PK kept the default name
-- (guard checked constraint_name != 'agency_memberships_pkey', which was
-- false here). Adds the surrogate id column the app code selects everywhere,
-- moves the PK onto it, and re-allows nullable user_id for pending email
-- invites (a composite PK had implicitly forced NOT NULL).

ALTER TABLE agency_memberships ADD COLUMN IF NOT EXISTS id uuid;
UPDATE agency_memberships SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE agency_memberships ALTER COLUMN id SET NOT NULL;

ALTER TABLE agency_memberships DROP CONSTRAINT IF EXISTS agency_memberships_pkey;
ALTER TABLE agency_memberships ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE agency_memberships
  ADD CONSTRAINT agency_memberships_pkey PRIMARY KEY (id);

-- Business uniqueness for real members (pending invites stay multi-row).
CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_user
  ON agency_memberships (agency_id, user_id) WHERE user_id IS NOT NULL;
