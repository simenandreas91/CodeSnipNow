/*
  # Create service_portal_widgets table

  1. Table
    - Adds service_portal_widgets table for modular ServiceNow widgets

  2. Security
    - Enables RLS mirroring integrations/specialized_areas semantics

  3. Indexes and Trigger
    - Adds helpful indexes and updated_at trigger for consistency
*/

CREATE TABLE IF NOT EXISTS public.service_portal_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  html text,
  css text,
  server_script text,
  client_script text,
  controller_as text,
  link text,
  demo_data jsonb DEFAULT '{}'::jsonb,
  option_schema jsonb DEFAULT '{}'::jsonb,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT true,
  repo_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.service_portal_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public widgets are viewable by everyone"
  ON public.service_portal_widgets
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own widgets or anonymous"
  ON public.service_portal_widgets
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id IS NULL OR auth.uid() = author_id);

CREATE POLICY "Users can update their own widgets or anonymous"
  ON public.service_portal_widgets
  FOR UPDATE
  TO authenticated
  USING (author_id IS NULL OR auth.uid() = author_id)
  WITH CHECK (author_id IS NULL OR auth.uid() = author_id);

CREATE POLICY "Users can delete their own widgets or anonymous"
  ON public.service_portal_widgets
  FOR DELETE
  TO authenticated
  USING (author_id IS NULL OR auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_service_portal_widgets_public ON public.service_portal_widgets(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_service_portal_widgets_author ON public.service_portal_widgets(author_id);
CREATE INDEX IF NOT EXISTS idx_service_portal_widgets_created_at ON public.service_portal_widgets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_portal_widgets_search ON public.service_portal_widgets
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(html, '') || ' ' || COALESCE(server_script, '') || ' ' || COALESCE(client_script, '')));

CREATE TRIGGER update_service_portal_widgets_updated_at
    BEFORE UPDATE ON public.service_portal_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
