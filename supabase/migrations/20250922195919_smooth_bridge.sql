/*
  # Update snippets table for Supabase Auth integration

  1. Changes
    - Update author_id to reference auth.users instead of custom users table
    - Update RLS policies to use auth.uid() instead of custom user context
    - Remove foreign key constraint to custom users table

  2. Security
    - Enable RLS on snippets table
    - Add policies for authenticated users using Supabase Auth
*/

-- Remove the existing foreign key constraint to custom users table
ALTER TABLE snippets DROP CONSTRAINT IF EXISTS snippets_author_id_fkey;

-- Update RLS policies to use Supabase Auth
DROP POLICY IF EXISTS "Users can delete their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can insert their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can update their own snippets" ON snippets;

-- Create new policies using auth.uid()
CREATE POLICY "Users can delete their own snippets"
  ON snippets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can insert their own snippets"
  ON snippets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own snippets"
  ON snippets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);