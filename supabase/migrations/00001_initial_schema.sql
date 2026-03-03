-- Create role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'member');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  role public.user_role DEFAULT 'member',
  is_enabled boolean DEFAULT true,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Rounds history
CREATE TABLE public.rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  odd_value numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

-- High odds history
CREATE TABLE public.high_odds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  odd_value numeric NOT NULL,
  occurred_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.high_odds ENABLE ROW LEVEL SECURITY;

-- Helper function for admin check
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'::public.user_role
  );
$$;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Rounds policies
CREATE POLICY "Admins can view all rounds" ON public.rounds
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own rounds" ON public.rounds
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- High odds policies
CREATE POLICY "Admins can view all high_odds" ON public.high_odds
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own high_odds" ON public.high_odds
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- View for public profiles (needed for sharing info if any)
CREATE VIEW public.public_profiles AS
  SELECT id, username, display_name, role, is_enabled, expires_at FROM public.profiles;

-- Auth trigger to sync user to profiles
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
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Use username from metadata or email
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

-- Trigger on auth.users confirmed
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Trigger on auth.users insert (for cases where confirmation is disabled)
-- Since we will disable verification, users might be confirmed immediately.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
