/*
  # Extend admin coverage to mail and inbound artifacts

  Ensures platform administrators (detected via public.is_admin) can manage
  mail scripts and inbound actions regardless of authorship.
*/

-- Mail scripts
CREATE POLICY "Admins can view any mail scripts"
  ON mail_scripts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update any mail scripts"
  ON mail_scripts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any mail scripts"
  ON mail_scripts
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Inbound actions
CREATE POLICY "Admins can view any inbound actions"
  ON inbound_actions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update any inbound actions"
  ON inbound_actions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any inbound actions"
  ON inbound_actions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
