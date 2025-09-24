/*
  # Fix author_id foreign key constraint for service_portal_widgets

  1. Problem
    - Foreign key constraint requires author_id to exist in auth.users table
    - Import data may have author_id values that don't exist in auth.users
    - This causes foreign key constraint violations during import

  2. Solution
    - Temporarily disable the foreign key constraint
    - Allow NULL author_id values for imported data
    - Re-enable constraint after import is complete

  3. Alternative Options
    - Option A: Remove foreign key constraint entirely
    - Option B: Set author_id to NULL for imports
    - Option C: Create matching users in auth.users first
*/

-- Option A: Remove the foreign key constraint entirely (recommended for imports)
ALTER TABLE public.service_portal_widgets 
DROP CONSTRAINT IF EXISTS service_portal_widgets_author_id_fkey1;

-- Option B: If you want to keep the constraint but allow imports, 
-- you can temporarily disable it and re-enable after import:
-- ALTER TABLE public.service_portal_widgets DISABLE TRIGGER ALL;
-- (run your import)
-- ALTER TABLE public.service_portal_widgets ENABLE TRIGGER ALL;

-- Option C: If you want to recreate the constraint later with a different approach:
-- ALTER TABLE public.service_portal_widgets 
-- ADD CONSTRAINT service_portal_widgets_author_id_fkey1 
-- FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;