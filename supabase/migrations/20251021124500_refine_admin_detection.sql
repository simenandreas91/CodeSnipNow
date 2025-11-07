/*
  # Harden admin detection

  Replaces the helper to rely on JWT claims via current_setting and ensures case-insensitive email checks.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  claims jsonb := '{}'::jsonb;
  email text := '';
  role text := '';
BEGIN
  BEGIN
    claims := coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb;
  EXCEPTION
    WHEN others THEN
      claims := '{}'::jsonb;
  END;

  email := lower(coalesce(claims->>'email', ''));
  role := coalesce(claims->'app_metadata'->>'role', '');

  IF role = 'admin' THEN
    RETURN true;
  END IF;

  IF email = ANY (ARRAY[
    'simenstaabyknudsen@gmail.com'
  ]) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
