/*
  # Create specialized_areas table

  1. Table
    - Adds specialized_areas table for curated ServiceNow snippets
    - Mirrors integrations schema so front-end logic can reuse conventions

  2. Security
    - Enables RLS with same semantics as integrations (public visibility + optional author ownership)

  3. Indexes and Trigger
    - Adds helpful indexes and updated_at trigger for consistency
*/

CREATE TABLE IF NOT EXISTS public.specialized_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  code2 text,
  type text NOT NULL,
  repo_path text,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.specialized_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public specialized areas are viewable by everyone"
  ON public.specialized_areas
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own specialized areas or anonymous"
  ON public.specialized_areas
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id IS NULL OR auth.uid() = author_id);

CREATE POLICY "Users can update their own specialized areas or anonymous"
  ON public.specialized_areas
  FOR UPDATE
  TO authenticated
  USING (author_id IS NULL OR auth.uid() = author_id)
  WITH CHECK (author_id IS NULL OR auth.uid() = author_id);

CREATE POLICY "Users can delete their own specialized areas or anonymous"
  ON public.specialized_areas
  FOR DELETE
  TO authenticated
  USING (author_id IS NULL OR auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_specialized_areas_public ON public.specialized_areas(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_specialized_areas_author ON public.specialized_areas(author_id);
CREATE INDEX IF NOT EXISTS idx_specialized_areas_type ON public.specialized_areas(type);
CREATE INDEX IF NOT EXISTS idx_specialized_areas_created_at ON public.specialized_areas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_specialized_areas_search ON public.specialized_areas
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || code || ' ' || COALESCE(code2, '')));

CREATE TRIGGER update_specialized_areas_updated_at
    BEFORE UPDATE ON public.specialized_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
