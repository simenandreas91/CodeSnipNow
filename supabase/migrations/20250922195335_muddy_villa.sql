/*
  # Create snippets table

  1. New Tables
    - `snippets`
      - `id` (uuid, primary key)
      - `title` (text, snippet name)
      - `description` (text, snippet description)
      - `code` (text, the actual script/code)
      - `type` (text, artifact type like 'business_rule', 'client_script')
      - `metadata` (jsonb, stores collection, condition, when, order, priority, etc.)
      - `tags` (text array, for categorization)
      - `is_public` (boolean, visibility flag)
      - `author_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `snippets` table
    - Add policy for public read access to public snippets
    - Add policy for authenticated users to manage their own snippets

  3. Indexes
    - Full-text search on title, description, and code
    - Performance indexes for common queries
*/

-- Create the snippets table
CREATE TABLE IF NOT EXISTS public.snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public snippets are viewable by everyone"
  ON public.snippets
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own snippets"
  ON public.snippets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own snippets"
  ON public.snippets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own snippets"
  ON public.snippets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_snippets_public ON public.snippets(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_snippets_author ON public.snippets(author_id);
CREATE INDEX IF NOT EXISTS idx_snippets_type ON public.snippets(type);
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON public.snippets(created_at DESC);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_snippets_search ON public.snippets 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || code));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_snippets_updated_at
    BEFORE UPDATE ON public.snippets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();