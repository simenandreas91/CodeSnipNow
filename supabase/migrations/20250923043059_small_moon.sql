/*
  # Update Client Scripts table to match ServiceNow XML structure

  1. New Fields Added
    - `field_name` - Specific field the script applies to (for onChange scripts)
    - `global` - Whether script applies globally
    - `isolate_script` - Whether to isolate script execution
    - `applies_extended` - Whether script applies to extended tables
    - `messages` - Custom messages for the script
    - `order_value` - Execution order
    - `view` - Specific view the script applies to
    - `ui_type_code` - UI type code (10=desktop, 1=mobile, etc.)

  2. Updated Fields
    - Renamed `ui_type` enum values to match ServiceNow
    - Updated `script_type` to match ServiceNow types

  3. Security
    - Maintains existing RLS policies
    - Adds indexes for performance
*/

-- Add new columns to client_scripts table
DO $$
BEGIN
  -- Add field_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_scripts' AND column_name = 'field_name'
  ) THEN
    ALTER TABLE client_scripts ADD COLUMN field_name text;
  END IF;

  -- Add global column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_scripts' AND column_name = 'global'
  ) THEN
    ALTER TABLE client_scripts ADD COLUMN global boolean DEFAULT false;
  END IF;

  -- Add isolate_script column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_scripts' AND column_name = 'isolate_script'
  ) THEN
    ALTER TABLE client_scripts ADD COLUMN isolate_script boolean DEFAULT true;
  END IF;

  -- Add applies_extended column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_scripts' AND column_name = 'applies_extended'
  ) THEN
    ALTER TABLE client_scripts ADD COLUMN applies_extended boolean DEFAULT false;
  END IF;

  -- Add messages column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_scripts' AND column_name = 'messages'
  ) THEN
    ALTER TABLE client_scripts ADD COLUMN messages text DEFAULT '';
  END IF;

  -- Add order_value column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_scripts' AND column_name = 'order_value'
  ) THEN
    ALTER TABLE client_scripts ADD COLUMN order_value integer DEFAULT 100;
  END IF;

  -- Add view column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_scripts' AND column_name = 'view'
  ) THEN
    ALTER TABLE client_scripts ADD COLUMN view text DEFAULT '';
  END IF;

  -- Add ui_type_code column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_scripts' AND column_name = 'ui_type_code'
  ) THEN
    ALTER TABLE client_scripts ADD COLUMN ui_type_code integer DEFAULT 10;
  END IF;
END $$;

-- Update script_type constraint to include more ServiceNow types
ALTER TABLE client_scripts DROP CONSTRAINT IF EXISTS client_scripts_script_type_check;
ALTER TABLE client_scripts ADD CONSTRAINT client_scripts_script_type_check 
  CHECK (script_type = ANY (ARRAY['onLoad'::text, 'onChange'::text, 'onSubmit'::text, 'onCellEdit'::text]));

-- Update ui_type constraint to match ServiceNow values
ALTER TABLE client_scripts DROP CONSTRAINT IF EXISTS client_scripts_ui_type_check;
ALTER TABLE client_scripts ADD CONSTRAINT client_scripts_ui_type_check 
  CHECK (ui_type = ANY (ARRAY['desktop'::text, 'mobile'::text, 'both'::text, 'all'::text]));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_scripts_field ON client_scripts (field_name);
CREATE INDEX IF NOT EXISTS idx_client_scripts_global ON client_scripts (global) WHERE (global = true);
CREATE INDEX IF NOT EXISTS idx_client_scripts_view ON client_scripts (view);
CREATE INDEX IF NOT EXISTS idx_client_scripts_ui_type_code ON client_scripts (ui_type_code);