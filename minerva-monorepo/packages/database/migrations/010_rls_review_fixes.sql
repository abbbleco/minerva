-- 010: RLS review fixes (M4 error-sweep).
-- 1. profiles_self allowed any user to escalate their own role to
--    operator/admin (WITH CHECK only pinned id, not role). Split into
--    read + update policies and guard role changes with a trigger.
-- 2. validation_passports operator policy used role = 'operator' exactly,
--    locking admins out — rest of the schema uses is_operator() (either).

-- --- 1. profiles self-escalation guard ---
DROP POLICY IF EXISTS profiles_self ON profiles;

CREATE POLICY profiles_self_read ON profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION protect_profile_role()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_admin() THEN
    RAISE EXCEPTION 'profiles: role change requires admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_role_guard ON profiles;
CREATE TRIGGER profiles_role_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_role();

-- --- 2. validation_passports admin consistency ---
DROP POLICY IF EXISTS passports_operator_all ON validation_passports;

CREATE POLICY passports_operator_all ON validation_passports
  FOR ALL USING (is_operator()) WITH CHECK (is_operator());