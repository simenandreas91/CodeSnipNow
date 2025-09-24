/*
  # Fix user creation trigger function

  1. Updates
    - Fix the handle_new_user trigger function to properly handle user creation
    - Ensure proper error handling and data insertion
    - Update RLS policies to allow the trigger to insert users

  2. Security
    - Maintain RLS on users table
    - Allow service role to insert new users via trigger
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, new.created_at);
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update RLS policy to allow the trigger function to insert users
CREATE POLICY "Allow service role to insert users" ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);