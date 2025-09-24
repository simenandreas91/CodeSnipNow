/*
  # Update Script Includes table to match ServiceNow XML structure

  1. New Fields Added
    - `caller_access` (text) - Caller access level
    - `mobile_callable` (boolean) - Can be called from mobile
    - `sandbox_callable` (boolean) - Can be called from sandbox
    - `sys_policy` (text) - System policy (read, write, etc.)
    
  2. Security
    - All fields have appropriate defaults
    - Maintains existing RLS policies
    
  3. Indexes
    - Added indexes for performance on commonly queried fields
*/

-- Add new fields to script_includes table
DO $$
BEGIN
  -- Add caller_access field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'script_includes' AND column_name = 'caller_access'
  ) THEN
    ALTER TABLE script_includes ADD COLUMN caller_access text DEFAULT '';
  END IF;

  -- Add mobile_callable field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'script_includes' AND column_name = 'mobile_callable'
  ) THEN
    ALTER TABLE script_includes ADD COLUMN mobile_callable boolean DEFAULT false;
  END IF;

  -- Add sandbox_callable field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'script_includes' AND column_name = 'sandbox_callable'
  ) THEN
    ALTER TABLE script_includes ADD COLUMN sandbox_callable boolean DEFAULT false;
  END IF;

  -- Add sys_policy field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'script_includes' AND column_name = 'sys_policy'
  ) THEN
    ALTER TABLE script_includes ADD COLUMN sys_policy text DEFAULT '';
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_script_includes_mobile_callable 
ON script_includes (mobile_callable) WHERE mobile_callable = true;

CREATE INDEX IF NOT EXISTS idx_script_includes_sandbox_callable 
ON script_includes (sandbox_callable) WHERE sandbox_callable = true;

CREATE INDEX IF NOT EXISTS idx_script_includes_policy 
ON script_includes (sys_policy);