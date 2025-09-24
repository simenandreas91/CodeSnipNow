/*
  # Create catalog_client_scripts table

  1. New Tables
    - `catalog_client_scripts`
      - `id` (uuid, primary key)
      - `title` (text, required) - Maps to 'name' field
      - `description` (text, optional)
      - `code` (text, required) - Maps to 'script' field
      - `applies_to` (text, optional) - What the script applies to
      - `ui_type` (text, optional) - UI type (desktop, mobile, both)
      - `sys_scope` (text, optional) - System scope
      - `type` (text, optional) - Script type
      - `cat_item` (text, optional) - Catalog item reference
      - `tags` (text[], default empty array)
      - `is_public` (boolean, default true)
      - `author_id` (uuid, foreign key to auth.users)
      - `active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `catalog_client_scripts` table
    - Add policy for public read access to public scripts
    - Add policies for authenticated users to manage their own scripts

  3. Indexes
    - Index on applies_to for filtering
    - Index on ui_type for filtering
    - Index on type for filtering
    - Index on cat_item for filtering
    - Index on active status
    - Index on author_id for user filtering
    - Index on created_at for sorting
    - Full-text search index
*/

CREATE TABLE IF NOT EXISTS catalog_client_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  applies_to text,
  ui_type text DEFAULT 'desktop',
  sys_scope text,
  type text,
  cat_item text,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE catalog_client_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public catalog client scripts are viewable by everyone"
  ON catalog_client_scripts
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert their own catalog client scripts"
  ON catalog_client_scripts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own catalog client scripts"
  ON catalog_client_scripts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own catalog client scripts"
  ON catalog_client_scripts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_catalog_client_scripts_applies_to ON catalog_client_scripts USING btree (applies_to);
CREATE INDEX IF NOT EXISTS idx_catalog_client_scripts_ui_type ON catalog_client_scripts USING btree (ui_type);
CREATE INDEX IF NOT EXISTS idx_catalog_client_scripts_type ON catalog_client_scripts USING btree (type);
CREATE INDEX IF NOT EXISTS idx_catalog_client_scripts_cat_item ON catalog_client_scripts USING btree (cat_item);
CREATE INDEX IF NOT EXISTS idx_catalog_client_scripts_active ON catalog_client_scripts USING btree (active) WHERE (active = true);
CREATE INDEX IF NOT EXISTS idx_catalog_client_scripts_author ON catalog_client_scripts USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_catalog_client_scripts_created_at ON catalog_client_scripts USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_client_scripts_public ON catalog_client_scripts USING btree (is_public) WHERE (is_public = true);
CREATE INDEX IF NOT EXISTS idx_catalog_client_scripts_search ON catalog_client_scripts USING gin (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || code));

-- Create trigger for updated_at
CREATE TRIGGER update_catalog_client_scripts_updated_at
  BEFORE UPDATE ON catalog_client_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();