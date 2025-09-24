/*
  # Fix conflicting foreign key constraints on service_portal_widgets

  1. Problem
    - Table has two conflicting foreign key constraints on author_id
    - One points to users(id) and another to auth.users(id)
    - This causes import failures

  2. Solution
    - Drop the conflicting constraint that points to users(id)
    - Keep only the constraint that points to auth.users(id)
    - This aligns with Supabase's authentication system
*/

-- Drop the conflicting foreign key constraint that points to users(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_portal_widgets_author_id_fkey' 
    AND table_name = 'service_portal_widgets'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Check if this constraint points to users(id) instead of auth.users(id)
    IF EXISTS (
      SELECT 1 FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
      WHERE rc.constraint_name = 'service_portal_widgets_author_id_fkey'
      AND kcu.table_name = 'service_portal_widgets'
      AND rc.unique_constraint_name IN (
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'users' AND table_schema = 'public'
      )
    ) THEN
      ALTER TABLE service_portal_widgets 
      DROP CONSTRAINT service_portal_widgets_author_id_fkey;
    END IF;
  END IF;
END $$;

-- Ensure we have the correct foreign key constraint to auth.users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
    WHERE kcu.table_name = 'service_portal_widgets'
    AND kcu.column_name = 'author_id'
    AND rc.unique_constraint_name IN (
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'users' AND table_schema = 'auth'
    )
  ) THEN
    ALTER TABLE service_portal_widgets 
    ADD CONSTRAINT service_portal_widgets_author_id_fkey1 
    FOREIGN KEY (author_id) REFERENCES auth.users(id);
  END IF;
END $$;