/*
  # Allow admins to manage shared content

  1. Adds a utility function to detect admin users based on JWT metadata or email.
  2. Grants admin users update/delete access across curated snippet tables.

  ## Security
  - Admins are users whose app_metadata.role equals 'admin' or whose email matches the configured allow list.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(auth.jwt()->'app_metadata'->>'role', '') = 'admin'
    OR COALESCE(auth.jwt()->>'email', '') = ANY (ARRAY[
      'simenstaabyknudsen@gmail.com'
    ]);
$$;

COMMENT ON FUNCTION public.is_admin IS 'Returns true when the current authenticated user should have admin privileges.';

-- Business rules
CREATE POLICY "Admins can update any business rules"
  ON business_rules
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any business rules"
  ON business_rules
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Client scripts
CREATE POLICY "Admins can update any client scripts"
  ON client_scripts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any client scripts"
  ON client_scripts
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Catalog client scripts
CREATE POLICY "Admins can update any catalog client scripts"
  ON catalog_client_scripts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any catalog client scripts"
  ON catalog_client_scripts
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Script includes
CREATE POLICY "Admins can update any script includes"
  ON script_includes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any script includes"
  ON script_includes
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- UI actions
CREATE POLICY "Admins can update any ui actions"
  ON ui_actions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any ui actions"
  ON ui_actions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Scheduled jobs
CREATE POLICY "Admins can update any scheduled jobs"
  ON scheduled_jobs
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any scheduled jobs"
  ON scheduled_jobs
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Transform maps
CREATE POLICY "Admins can update any transform maps"
  ON transform_maps
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any transform maps"
  ON transform_maps
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Background scripts
CREATE POLICY "Admins can update any background scripts"
  ON background_scripts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any background scripts"
  ON background_scripts
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Integrations
CREATE POLICY "Admins can update any integrations"
  ON integrations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any integrations"
  ON integrations
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Specialized areas
CREATE POLICY "Admins can update any specialized areas"
  ON specialized_areas
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any specialized areas"
  ON specialized_areas
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Service portal widgets
CREATE POLICY "Admins can update any service portal widgets"
  ON service_portal_widgets
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any service portal widgets"
  ON service_portal_widgets
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Core ServiceNow APIs
CREATE POLICY "Admins can update any core servicenow apis"
  ON core_servicenow_apis
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any core servicenow apis"
  ON core_servicenow_apis
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
