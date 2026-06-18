-- Fix "Database error saving new user" on signup.
-- Root cause: handle_new_user + missing columns OR protect_profile_role blocking role on UPDATE.
-- Run entire file in Supabase Dashboard → SQL Editor, then delete broken auth users and register again.

-- ── 1. Schema prerequisites ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'user', 'innovator', 'mentor', 'investor', 'admin', 'super_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'innovator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD COLUMN role public.user_role NOT NULL DEFAULT 'innovator';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'innovator'::public.user_role;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  user_type TEXT,
  organization_name TEXT,
  is_student BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE TABLE IF NOT EXISTS public.dna_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  scores JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Allow signup to set initial role (do not block NULL → innovator) ──
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    -- Signup bootstrap / first role assignment
    IF OLD.role IS NULL THEN
      RETURN NEW;
    END IF;
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'role_change_forbidden'
        USING HINT = 'Only administrators may change profile roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_role ON public.profiles;
CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ── 3. Signup trigger: INSERT role once; never UPDATE role on conflict ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), '');
  v_user_type TEXT := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'user_type'), ''), 'student');
  v_org TEXT := COALESCE(NEW.raw_user_meta_data->>'organization_name', '');
  v_phone TEXT := COALESCE(NEW.raw_user_meta_data->>'phone', '');
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, user_type, organization_name, phone, role
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type,
    v_org,
    v_phone,
    'innovator'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    user_type = EXCLUDED.user_type,
    organization_name = EXCLUDED.organization_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  INSERT INTO public.users (id, email, full_name, user_type, organization_name, phone, is_student)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full_name,
    v_user_type,
    v_org,
    v_phone,
    COALESCE((NEW.raw_user_meta_data->>'user_type') = 'student', TRUE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    user_type = EXCLUDED.user_type,
    organization_name = EXCLUDED.organization_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  INSERT INTO public.dna_profiles (user_id, strengths, weaknesses)
  VALUES (NEW.id, '[]'::jsonb, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.dna_profiles TO authenticated;

-- ── 4. Verify ─────────────────────────────────────────────────
SELECT
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') AS signup_trigger_ok,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'protect_profile_role') AS role_guard_ok;
