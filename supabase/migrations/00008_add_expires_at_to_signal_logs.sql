
ALTER TABLE public.signal_logs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 minutes');
