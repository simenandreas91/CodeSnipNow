/*
  # Create integrations table

  1. New Tables
    - `integrations`
      - `id` (uuid, primary key)
      - `title` (text, integration name)
      - `description` (text, integration description)
      - `code` (text, primary code snippet)
      - `code2` (text, secondary code snippet)
      - `type` (text, integration type)
      - `repo_path` (text, repository path reference)
      - `author_id` (uuid, foreign key to users.id)
      - `is_public` (boolean, visibility flag)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `integrations` table
    - Add policy for public read access to public integrations
    - Add policies for authenticated users to manage their own integrations

  3. Indexes
    - Indexes for common queries (author, type, public, created_at)
    - Full-text search on title, description, code, and code2
*/

-- Create the integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  code2 text,
  type text NOT NULL,
  repo_path text,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can insert their own integrations"
  ON public.integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own integrations"
  ON public.integrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.integrations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

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
