/*
  # Expand admin detection to include explicit user IDs

  Some privileged accounts are better tracked by UID instead of email.
  This migration updates public.is_admin() so the provided user UUIDs
  (currently Simen's: 99f8bc0d-7a1b-41f0-8836-e0375e4d123e) are always
  treated as admins, in addition to the existing email allow list or
  app_metadata role flag.
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
  user_id text := '';
BEGIN
  BEGIN
    claims := coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb;
  EXCEPTION
    WHEN others THEN
      claims := '{}'::jsonb;
  END;

  email := lower(coalesce(claims->>'email', ''));
  role := lower(coalesce(claims->'app_metadata'->>'role', ''));
  user_id := coalesce(claims->>'sub', '');

  IF role = 'admin' THEN
    RETURN true;
  END IF;

  IF email = ANY (ARRAY[
    'simenstaabyknudsen@gmail.com'
  ]) THEN
    RETURN true;
  END IF;

  IF user_id = ANY (ARRAY[
    '99f8bc0d-7a1b-41f0-8836-e0375e4d123e'
  ]) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
