/*
  # Make database fields optional

  1. Changes
    - Remove NOT NULL constraints from all non-essential fields
    - Keep only id, title, code, is_public, author_id, created_at, updated_at as required
    - Make all other fields optional to improve robustness

  2. Tables Updated
    - business_rules: Remove NOT NULL from type, collection, etc.
    - client_scripts: Remove NOT NULL from script_type, table_name, etc.
    - script_includes: Remove NOT NULL from api_name
    - ui_actions: Remove NOT NULL from action_name, table_name
    - scheduled_jobs: Remove NOT NULL from job_name
    - transform_maps: Remove NOT NULL from source_table, target_table
    - background_scripts: Already optional

  3. Security
    - All RLS policies remain unchanged
    - Constraints and indexes remain unchanged
*/

-- Business Rules - make fields optional
ALTER TABLE business_rules ALTER COLUMN type DROP NOT NULL;
ALTER TABLE business_rules ALTER COLUMN collection DROP NOT NULL;

-- Client Scripts - make fields optional  
ALTER TABLE client_scripts ALTER COLUMN script_type DROP NOT NULL;
ALTER TABLE client_scripts ALTER COLUMN table_name DROP NOT NULL;

-- Script Includes - make fields optional
ALTER TABLE script_includes ALTER COLUMN api_name DROP NOT NULL;

-- UI Actions - make fields optional
ALTER TABLE ui_actions ALTER COLUMN action_name DROP NOT NULL;
ALTER TABLE ui_actions ALTER COLUMN table_name DROP NOT NULL;

-- Scheduled Jobs - make fields optional
ALTER TABLE scheduled_jobs ALTER COLUMN job_name DROP NOT NULL;

-- Transform Maps - make fields optional
ALTER TABLE transform_maps ALTER COLUMN source_table DROP NOT NULL;
ALTER TABLE transform_maps ALTER COLUMN target_table DROP NOT NULL;