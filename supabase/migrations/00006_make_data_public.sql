-- Disable RLS for rounds and high_odds to allow public access without auth
ALTER TABLE public.rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.high_odds DISABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write/delete rounds and high_odds
-- (Even with RLS disabled, it's good practice if it ever gets re-enabled)
DROP POLICY IF EXISTS "Users can manage their own rounds" ON public.rounds;
DROP POLICY IF EXISTS "Admins can view all rounds" ON public.rounds;
CREATE POLICY "Public access to rounds" ON public.rounds FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage their own high_odds" ON public.high_odds;
DROP POLICY IF EXISTS "Admins can view all high_odds" ON public.high_odds;
CREATE POLICY "Public access to high_odds" ON public.high_odds FOR ALL USING (true) WITH CHECK (true);

-- Make user_id optional in rounds and high_odds
ALTER TABLE public.rounds ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.high_odds ALTER COLUMN user_id DROP NOT NULL;

-- Remove foreign key constraints to profiles since we don't have users
ALTER TABLE public.rounds DROP CONSTRAINT IF EXISTS rounds_user_id_fkey;
ALTER TABLE public.high_odds DROP CONSTRAINT IF EXISTS high_odds_user_id_fkey;
