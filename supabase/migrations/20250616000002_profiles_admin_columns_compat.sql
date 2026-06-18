-- Admin UI expects profiles.status and profiles.last_active (added in analytics migration).
-- Safe to run on databases that never applied 20240615000016_admin_analytics_rpcs.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
