-- Remote schemas may omit profiles.email; add idempotently for apps that expect it
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill from auth.users where possible
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL
  AND u.email IS NOT NULL;
