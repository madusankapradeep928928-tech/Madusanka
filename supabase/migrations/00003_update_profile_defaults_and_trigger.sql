-- Change is_enabled to false for new users
ALTER TABLE public.profiles ALTER COLUMN is_enabled SET DEFAULT false;

-- Ensure email column exists or is handled. Profiles already have username. 
-- In AuthContext I will store real emails.

-- Update the handle_new_user trigger to handle email/display_name properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  user_role_val public.user_role;
  user_name text;
  d_name text;
BEGIN
  -- Check if profile already exists to avoid duplicates
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Try to get username and display_name from metadata
  user_name := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));
  d_name := COALESCE(NEW.raw_user_meta_data->>'display_name', user_name);
  
  -- First user is admin and enabled
  IF user_count = 0 THEN
    INSERT INTO public.profiles (id, username, display_name, role, is_enabled)
    VALUES (NEW.id, user_name, d_name, 'admin'::public.user_role, true);
  ELSE
    INSERT INTO public.profiles (id, username, display_name, role, is_enabled)
    VALUES (NEW.id, user_name, d_name, 'member'::public.user_role, false);
  END IF;
  RETURN NEW;
END;
$$;
