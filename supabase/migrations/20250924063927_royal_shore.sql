/*
  # Add is_public column to service_portal_widgets table

  1. New Columns
    - `is_public` (boolean, default true) - Controls visibility of widgets

  2. Changes
    - Add is_public column to service_portal_widgets table
    - Set default value to true for public visibility
    - Update existing records to have is_public = true
*/

-- Add is_public column to service_portal_widgets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_portal_widgets' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE service_portal_widgets ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Update any existing records to have is_public = true
UPDATE service_portal_widgets SET is_public = TRUE WHERE is_public IS NULL;