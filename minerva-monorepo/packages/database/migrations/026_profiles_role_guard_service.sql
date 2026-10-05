-- 026: let the platform backend (PostgREST service-role JWT) flip profile
-- roles during trusted server-side flows — registration onboarding (client ->
-- operator when creating an agency or claiming an operator invite) and the
-- add-operator provisioning script against existing users.
--
-- The exemption reads the exact 'role' claim of the request JWT (never string
-- matching, so attacker-controlled claims like emails cannot slip through).
-- User sessions remain admin-only; raw SQL connections keep the previous
-- behaviour (no JWT -> no exemption).

CREATE OR REPLACE FUNCTION protect_profile_role()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  jwt_role text;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    jwt_role := coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::json ->> 'role'
    );
    IF jwt_role IS DISTINCT FROM 'service_role' AND NOT is_admin() THEN
      RAISE EXCEPTION 'profiles: role change requires admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
