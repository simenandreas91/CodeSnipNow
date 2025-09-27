/*
  # Recreate integrations table with nullable author_id

  1. Table Recreation
    - Drop existing table if it exists
    - Create `integrations` with updated schema
      - `author_id` now nullable (uuid REFERENCES users(id) ON DELETE CASCADE)

  2. Security
    - Enable RLS on `integrations` table
    - Policies adjusted to allow operations when author_id IS NULL (for guest/anonymous) or matches user

  3. Indexes and Trigger
    - Same as before: performance indexes, full-text search, updated_at trigger
*/

-- Drop table if exists to recreate
DROP TABLE IF EXISTS public.integrations CASCADE;

-- Create the integrations table
CREATE TABLE public.integrations (
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

-- Enable Row Level Security
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public integrations are viewable by everyone"
  ON public.integrations
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own integrations or anonymous"
  ON public.integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id IS NULL OR auth.uid() = author_id);

CREATE POLICY "Users can update their own integrations or anonymous"
  ON public.integrations
  FOR UPDATE
  TO authenticated
  USING (author_id IS NULL OR auth.uid() = author_id)
  WITH CHECK (author_id IS NULL OR auth.uid() = author_id);

CREATE POLICY "Users can delete their own integrations or anonymous"
  ON public.integrations
  FOR DELETE
  TO authenticated
  USING (author_id IS NULL OR auth.uid() = author_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_integrations_public ON public.integrations(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_integrations_author ON public.integrations(author_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON public.integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_created_at ON public.integrations(created_at DESC);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_integrations_search ON public.integrations 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || code || ' ' || COALESCE(code2, '')));

-- Create trigger to automatically update updated_at (function already exists from previous migrations)
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
