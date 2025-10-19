/*
  # Add preview image metadata to artifact tables

  1. Adds `preview_image_path` and `preview_image_url` columns (text, nullable)
     to supported snippet tables if they do not already exist.
  2. Keeps migration idempotent so it can run safely in multiple environments.
*/

DO $$
DECLARE
  target_table text;
BEGIN
  FOR target_table IN
    SELECT unnest(ARRAY[
      'business_rules',
      'client_scripts',
      'script_includes',
      'ui_actions',
      'scheduled_jobs',
      'transform_maps',
      'background_scripts',
      'service_portal_widgets',
      'mail_scripts',
      'inbound_actions',
      'integrations',
      'specialized_areas',
      'core_servicenow_apis'
    ])
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = target_table
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = target_table
          AND column_name = 'preview_image_path'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN preview_image_path text', target_table);
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = target_table
          AND column_name = 'preview_image_url'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN preview_image_url text', target_table);
      END IF;
    END IF;
  END LOOP;
END
$$;
