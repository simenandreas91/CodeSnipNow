/*
  # Create ServiceNow Artifact Tables

  1. New Tables
    - `business_rules` (renamed from snippets)
    - `client_scripts`
    - `script_includes`
    - `ui_actions`
    - `scheduled_jobs`
    - `transform_maps`

  2. Each table has specific fields for its artifact type
  3. All tables have consistent base fields (title, description, code, etc.)
  4. Security policies applied to all tables
*/

-- First, rename the existing snippets table to business_rules
ALTER TABLE IF EXISTS snippets RENAME TO business_rules;

-- Update business_rules table with specific fields
DO $$
BEGIN
  -- Add business rule specific fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'table_name') THEN
    ALTER TABLE business_rules ADD COLUMN table_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'when_to_run') THEN
    ALTER TABLE business_rules ADD COLUMN when_to_run text CHECK (when_to_run IN ('before', 'after', 'async', 'display'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'condition') THEN
    ALTER TABLE business_rules ADD COLUMN condition text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'order_value') THEN
    ALTER TABLE business_rules ADD COLUMN order_value integer DEFAULT 100;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'priority') THEN
    ALTER TABLE business_rules ADD COLUMN priority integer DEFAULT 100;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'active') THEN
    ALTER TABLE business_rules ADD COLUMN active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_rules' AND column_name = 'advanced') THEN
    ALTER TABLE business_rules ADD COLUMN advanced boolean DEFAULT false;
  END IF;
END $$;

-- Create client_scripts table
CREATE TABLE IF NOT EXISTS client_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  table_name text,
  ui_type text CHECK (ui_type IN ('desktop', 'mobile', 'both')) DEFAULT 'desktop',
  script_type text CHECK (script_type IN ('onLoad', 'onChange', 'onSubmit', 'onCellEdit')) NOT NULL,
  field_name text,
  condition text,
  active boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create script_includes table
CREATE TABLE IF NOT EXISTS script_includes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  api_name text UNIQUE NOT NULL,
  client_callable boolean DEFAULT false,
  access_level text CHECK (access_level IN ('public', 'package_private')) DEFAULT 'package_private',
  active boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ui_actions table
CREATE TABLE IF NOT EXISTS ui_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  table_name text,
  action_name text NOT NULL,
  form_button boolean DEFAULT false,
  form_link boolean DEFAULT false,
  form_menu_button boolean DEFAULT false,
  list_button boolean DEFAULT false,
  list_choice boolean DEFAULT false,
  list_context_menu boolean DEFAULT false,
  condition text,
  order_value integer DEFAULT 100,
  active boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create scheduled_jobs table
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  job_name text UNIQUE NOT NULL,
  run_as text,
  run_start timestamptz,
  run_period text,
  run_dayofweek text,
  run_dayofmonth text,
  run_time text,
  active boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transform_maps table
CREATE TABLE IF NOT EXISTS transform_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  code text NOT NULL,
  source_table text NOT NULL,
  target_table text NOT NULL,
  run_business_rules boolean DEFAULT true,
  coalesce boolean DEFAULT false,
  active boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_includes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transform_maps ENABLE ROW LEVEL SECURITY;

-- Create policies for business_rules (update existing)
DROP POLICY IF EXISTS "Public snippets are viewable by everyone" ON business_rules;
DROP POLICY IF EXISTS "Users can insert their own snippets" ON business_rules;
DROP POLICY IF EXISTS "Users can update their own snippets" ON business_rules;
DROP POLICY IF EXISTS "Users can delete their own snippets" ON business_rules;

CREATE POLICY "Public business rules are viewable by everyone"
  ON business_rules FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert their own business rules"
  ON business_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own business rules"
  ON business_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own business rules"
  ON business_rules FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create policies for client_scripts
CREATE POLICY "Public client scripts are viewable by everyone"
  ON client_scripts FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert their own client scripts"
  ON client_scripts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own client scripts"
  ON client_scripts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own client scripts"
  ON client_scripts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create policies for script_includes
CREATE POLICY "Public script includes are viewable by everyone"
  ON script_includes FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert their own script includes"
  ON script_includes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own script includes"
  ON script_includes FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own script includes"
  ON script_includes FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create policies for ui_actions
CREATE POLICY "Public UI actions are viewable by everyone"
  ON ui_actions FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert their own UI actions"
  ON ui_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own UI actions"
  ON ui_actions FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own UI actions"
  ON ui_actions FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create policies for scheduled_jobs
CREATE POLICY "Public scheduled jobs are viewable by everyone"
  ON scheduled_jobs FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert their own scheduled jobs"
  ON scheduled_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own scheduled jobs"
  ON scheduled_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own scheduled jobs"
  ON scheduled_jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create policies for transform_maps
CREATE POLICY "Public transform maps are viewable by everyone"
  ON transform_maps FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert their own transform maps"
  ON transform_maps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own transform maps"
  ON transform_maps FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own transform maps"
  ON transform_maps FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_rules_table ON business_rules(table_name);
CREATE INDEX IF NOT EXISTS idx_business_rules_when ON business_rules(when_to_run);
CREATE INDEX IF NOT EXISTS idx_business_rules_active ON business_rules(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_client_scripts_table ON client_scripts(table_name);
CREATE INDEX IF NOT EXISTS idx_client_scripts_type ON client_scripts(script_type);
CREATE INDEX IF NOT EXISTS idx_client_scripts_active ON client_scripts(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_script_includes_api ON script_includes(api_name);
CREATE INDEX IF NOT EXISTS idx_script_includes_callable ON script_includes(client_callable) WHERE client_callable = true;

CREATE INDEX IF NOT EXISTS idx_ui_actions_table ON ui_actions(table_name);
CREATE INDEX IF NOT EXISTS idx_ui_actions_name ON ui_actions(action_name);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_name ON scheduled_jobs(job_name);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_active ON scheduled_jobs(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_transform_maps_source ON transform_maps(source_table);
CREATE INDEX IF NOT EXISTS idx_transform_maps_target ON transform_maps(target_table);

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_rules_updated_at BEFORE UPDATE ON business_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_scripts_updated_at BEFORE UPDATE ON client_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_script_includes_updated_at BEFORE UPDATE ON script_includes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ui_actions_updated_at BEFORE UPDATE ON ui_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_jobs_updated_at BEFORE UPDATE ON scheduled_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transform_maps_updated_at BEFORE UPDATE ON transform_maps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();