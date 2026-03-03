-- Remove the insert trigger and keep only the update trigger as per standard instructions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ensure the trigger function handles the user_count correctly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  user_role_val public.user_role;
  user_name text;
BEGIN
  -- Check if profile already exists to avoid duplicates
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Try to get username from metadata
  user_name := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));
  
  -- First user is admin
  IF user_count = 0 THEN
    user_role_val := 'admin'::public.user_role;
  ELSE
    user_role_val := 'member'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (
    NEW.id,
    user_name,
    user_name,
    user_role_val
  );
  RETURN NEW;
END;
$$;
