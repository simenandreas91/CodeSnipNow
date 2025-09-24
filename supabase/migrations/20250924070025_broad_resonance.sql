/*
  # Add RLS policies for service_portal_widgets table

  1. Security
    - Enable RLS on `service_portal_widgets` table
    - Add policy for public access to read public widgets
    - Add policies for authenticated users to manage their own widgets

  2. Policies
    - Public users can read public widgets
    - Authenticated users can insert their own widgets
    - Authenticated users can update their own widgets
    - Authenticated users can delete their own widgets
*/

-- Enable Row Level Security
ALTER TABLE service_portal_widgets ENABLE ROW LEVEL SECURITY;

-- Policy: Public service portal widgets are viewable by everyone
CREATE POLICY "Public service portal widgets are viewable by everyone"
  ON service_portal_widgets
  FOR SELECT
  TO public
  USING (is_public = true);

-- Policy: Users can insert their own service portal widgets
CREATE POLICY "Users can insert their own service portal widgets"
  ON service_portal_widgets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Policy: Users can update their own service portal widgets
CREATE POLICY "Users can update their own service portal widgets"
  ON service_portal_widgets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Policy: Users can delete their own service portal widgets
CREATE POLICY "Users can delete their own service portal widgets"
  ON service_portal_widgets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);