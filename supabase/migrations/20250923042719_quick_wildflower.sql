/*
  # Update Business Rules table to match ServiceNow XML structure

  1. New Fields Added
    - Action fields: `action_delete`, `action_insert`, `action_query`, `action_update`
    - Behavior fields: `abort_action`, `add_message`, `change_fields`, `execute_function`
    - Access control: `access`, `client_callable`, `is_rest`
    - REST fields: `rest_method`, `rest_service`, `rest_variables`
    - Filter and role conditions: `filter_condition`, `role_conditions`
    - Message field for user notifications
    - Template field for reusable scripts

  2. Updated Fields
    - Renamed `table_name` to `collection` to match ServiceNow
    - Added proper constraints and defaults

  3. Indexes
    - Added indexes for performance on commonly queried fields
*/

-- Add new columns to business_rules table
DO $$
BEGIN
  -- Action fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'action_delete') THEN
    ALTER TABLE business_rules ADD COLUMN action_delete boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'action_insert') THEN
    ALTER TABLE business_rules ADD COLUMN action_insert boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'action_query') THEN
    ALTER TABLE business_rules ADD COLUMN action_query boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'action_update') THEN
    ALTER TABLE business_rules ADD COLUMN action_update boolean DEFAULT true;
  END IF;

  -- Behavior fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'abort_action') THEN
    ALTER TABLE business_rules ADD COLUMN abort_action boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'add_message') THEN
    ALTER TABLE business_rules ADD COLUMN add_message boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'change_fields') THEN
    ALTER TABLE business_rules ADD COLUMN change_fields boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'execute_function') THEN
    ALTER TABLE business_rules ADD COLUMN execute_function boolean DEFAULT false;
  END IF;

  -- Access and security fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'access') THEN
    ALTER TABLE business_rules ADD COLUMN access text DEFAULT 'package_private';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'client_callable') THEN
    ALTER TABLE business_rules ADD COLUMN client_callable boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'is_rest') THEN
    ALTER TABLE business_rules ADD COLUMN is_rest boolean DEFAULT false;
  END IF;

  -- REST API fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'rest_method') THEN
    ALTER TABLE business_rules ADD COLUMN rest_method text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'rest_service') THEN
    ALTER TABLE business_rules ADD COLUMN rest_service text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'rest_variables') THEN
    ALTER TABLE business_rules ADD COLUMN rest_variables text DEFAULT '';
  END IF;

  -- Condition and filter fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'filter_condition') THEN
    ALTER TABLE business_rules ADD COLUMN filter_condition text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'role_conditions') THEN
    ALTER TABLE business_rules ADD COLUMN role_conditions text DEFAULT '';
  END IF;

  -- Message and template fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'message') THEN
    ALTER TABLE business_rules ADD COLUMN message text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'template') THEN
    ALTER TABLE business_rules ADD COLUMN template text DEFAULT '';
  END IF;

  -- Rename table_name to collection if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'table_name') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'collection') THEN
      ALTER TABLE business_rules RENAME COLUMN table_name TO collection;
    END IF;
  END IF;
END $$;

-- Add constraints
DO $$
BEGIN
  -- Access level constraint
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'business_rules_access_check') THEN
    ALTER TABLE business_rules ADD CONSTRAINT business_rules_access_check 
    CHECK (access IN ('public', 'package_private'));
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_rules_collection ON business_rules (collection);
CREATE INDEX IF NOT EXISTS idx_business_rules_access ON business_rules (access);
CREATE INDEX IF NOT EXISTS idx_business_rules_actions ON business_rules (action_insert, action_update, action_delete, action_query);
CREATE INDEX IF NOT EXISTS idx_business_rules_rest ON business_rules (is_rest) WHERE is_rest = true;