/*
  # Add description column to service_portal_widgets

  1. Changes
    - Add `description` column to `service_portal_widgets` table to store markdown content with images
    - Set default value to empty string for existing records
    - Allow NULL values for flexibility

  2. Purpose
    - Enable storing markdown descriptions with embedded images for Service Portal Widgets
    - Maintain consistency with other artifact tables that have description fields
*/

-- Add description column to service_portal_widgets table
ALTER TABLE service_portal_widgets 
ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- Add comment to document the column purpose
COMMENT ON COLUMN service_portal_widgets.description IS 'Markdown description that can contain embedded images and formatting';