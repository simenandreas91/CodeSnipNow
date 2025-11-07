/*
  # Allow admins to read any curated content

  Extends the admin policies so privileged users can SELECT rows regardless of author ownership.
*/

-- Business rules
CREATE POLICY "Admins can view any business rules"
  ON business_rules
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Client scripts
CREATE POLICY "Admins can view any client scripts"
  ON client_scripts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Catalog client scripts
CREATE POLICY "Admins can view any catalog client scripts"
  ON catalog_client_scripts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Script includes
CREATE POLICY "Admins can view any script includes"
  ON script_includes
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- UI actions
CREATE POLICY "Admins can view any ui actions"
  ON ui_actions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Scheduled jobs
CREATE POLICY "Admins can view any scheduled jobs"
  ON scheduled_jobs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Transform maps
CREATE POLICY "Admins can view any transform maps"
  ON transform_maps
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Background scripts
CREATE POLICY "Admins can view any background scripts"
  ON background_scripts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Integrations
CREATE POLICY "Admins can view any integrations"
  ON integrations
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Specialized areas
CREATE POLICY "Admins can view any specialized areas"
  ON specialized_areas
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Service portal widgets
CREATE POLICY "Admins can view any service portal widgets"
  ON service_portal_widgets
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Core ServiceNow APIs
CREATE POLICY "Admins can view any core servicenow apis"
  ON core_servicenow_apis
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
