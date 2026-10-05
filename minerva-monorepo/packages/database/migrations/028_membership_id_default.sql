-- 028: 027 added the surrogate id column but omitted its default, so inserts
-- that rely on auto-generated keys (member invites, invite claiming, agency
-- signup) failed with a not-null violation. Restore the 022-era default.

ALTER TABLE agency_memberships
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
