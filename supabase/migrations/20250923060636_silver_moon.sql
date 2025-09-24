/*
  # Create background_scripts table

  1. New Tables
    - `background_scripts`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `code` (text, required)
      - `tags` (text array)
      - `is_public` (boolean, default true)
      - `author_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `active` (boolean, default true)

  2. Security
    - Enable RLS on `background_scripts` table
    - Add policies for authenticated users to manage their own scripts
    - Add policy for public scripts to be viewable by everyone

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create background_scripts table
CREATE TABLE IF NOT EXISTS background_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE background_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public background scripts are viewable by everyone"
  ON background_scripts
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert their own background scripts"
  ON background_scripts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own background scripts"
  ON background_scripts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own background scripts"
  ON background_scripts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_background_scripts_author ON background_scripts(author_id);
CREATE INDEX IF NOT EXISTS idx_background_scripts_created_at ON background_scripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_background_scripts_public ON background_scripts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_background_scripts_active ON background_scripts(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_background_scripts_search ON background_scripts USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || code));

-- Create trigger for updated_at
CREATE TRIGGER update_background_scripts_updated_at
  BEFORE UPDATE ON background_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();