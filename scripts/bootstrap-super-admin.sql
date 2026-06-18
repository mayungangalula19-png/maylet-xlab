-- Bootstrap the first super admin by auth email.
-- Run in Supabase Dashboard → SQL Editor (same project as VITE_SUPABASE_URL).

BEGIN;

ALTER TABLE public.profiles DISABLE TRIGGER profiles_protect_role;

UPDATE public.profiles p
SET role = 'super_admin'::public.user_role,
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND lower(u.email) = lower('mayungangalula3@gmail.com');

ALTER TABLE public.profiles ENABLE TRIGGER profiles_protect_role;

-- Optional: also expose get_my_role RPC if migration not applied yet
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::TEXT
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

SELECT p.id, u.email, p.role, p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = lower('mayungangalula3@gmail.com');

COMMIT;
