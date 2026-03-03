
CREATE TABLE IF NOT EXISTS public.signal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    signal_type TEXT NOT NULL,
    predicted_odds NUMERIC DEFAULT 2.0,
    result TEXT DEFAULT NULL, -- 'win', 'lose', or NULL
    user_id UUID DEFAULT NULL
);

-- Disable RLS for now to allow easy access as per other tables
ALTER TABLE public.signal_logs DISABLE ROW LEVEL SECURITY;

-- Create policy anyway for safety
DROP POLICY IF EXISTS "Public access to signal_logs" ON public.signal_logs;
CREATE POLICY "Public access to signal_logs" ON public.signal_logs FOR ALL USING (true) WITH CHECK (true);
