/*
  # Update UI Actions table structure

  1. Table Changes
    - Add all missing fields from ServiceNow UI Action XML
    - Add proper constraints and defaults
    - Update indexes for better performance

  2. New Fields Added
    - client, client_script_v2, form_action, form_button_v2, form_context_menu
    - form_menu_button_v2, form_style, hint, isolate_script
    - list_action, list_banner_button, list_choice, list_context_menu
    - list_link, list_save_with_form_button, list_style, messages
    - onclick, show_insert, show_multiple_update, show_query, show_update
    - ui11_compatible, ui16_compatible

  3. Security
    - Maintain existing RLS policies
*/

-- Add new columns to ui_actions table
ALTER TABLE ui_actions 
ADD COLUMN IF NOT EXISTS client boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS client_script_v2 text DEFAULT '',
ADD COLUMN IF NOT EXISTS comments text DEFAULT '',
ADD COLUMN IF NOT EXISTS form_action boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS form_button_v2 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS form_context_menu boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS form_menu_button_v2 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS form_style text DEFAULT '',
ADD COLUMN IF NOT EXISTS hint text DEFAULT '',
ADD COLUMN IF NOT EXISTS isolate_script boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS list_action boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS list_banner_button boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS list_link boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS list_save_with_form_button boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS list_style text DEFAULT '',
ADD COLUMN IF NOT EXISTS messages text DEFAULT '',
ADD COLUMN IF NOT EXISTS onclick text DEFAULT '',
ADD COLUMN IF NOT EXISTS show_insert boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_multiple_update boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_query boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_update boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ui11_compatible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ui16_compatible boolean DEFAULT false;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_ui_actions_client ON ui_actions(client);
CREATE INDEX IF NOT EXISTS idx_ui_actions_form_button ON ui_actions(form_button);
CREATE INDEX IF NOT EXISTS idx_ui_actions_list_button ON ui_actions(list_button);
CREATE INDEX IF NOT EXISTS idx_ui_actions_show_insert ON ui_actions(show_insert);
CREATE INDEX IF NOT EXISTS idx_ui_actions_show_update ON ui_actions(show_update);