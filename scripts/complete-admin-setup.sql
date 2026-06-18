-- ONE-SHOT FIX: confirm email + super admin + verify profile
-- Run in Supabase Dashboard → SQL Editor (project: bonglgozhezuwfkyypsg)
-- Change the email below if needed.

BEGIN;

-- ── 0. Replace with your account email ────────────────────────
-- (default matches your signup attempts)

-- ── 1. Admin UI columns (if missing) ──────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ── 2. Confirm email manually (fixes login HTTP 400) ──────────
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE lower(email) = lower('mayungangalula3@gmail.com');

-- ── 3. Ensure profile exists for this auth user ───────────────
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'innovator'::public.user_role
FROM auth.users u
WHERE lower(u.email) = lower('mayungangalula3@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- ── 4. Promote to super admin ─────────────────────────────────
ALTER TABLE public.profiles DISABLE TRIGGER profiles_protect_role;

UPDATE public.profiles p
SET role = 'super_admin'::public.user_role,
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND lower(u.email) = lower('mayungangalula3@gmail.com');

ALTER TABLE public.profiles ENABLE TRIGGER profiles_protect_role;

-- ── 5. Verify everything ──────────────────────────────────────
SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  p.role,
  p.full_name,
  p.status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = lower('mayungangalula3@gmail.com');

COMMIT;
