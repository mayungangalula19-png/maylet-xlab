-- Robust profile bootstrap for remote schemas (no email/updated_at required)

DROP FUNCTION IF EXISTS public.ensure_profile(TEXT);

CREATE OR REPLACE FUNCTION public.ensure_profile(p_full_name TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_role TEXT := 'innovator';
  v_full_name TEXT := NULLIF(trim(COALESCE(p_full_name, '')), '');
  v_has_full_name BOOLEAN;
  v_has_role BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  INSERT INTO public.profiles (id)
  VALUES (v_uid)
  ON CONFLICT (id) DO NOTHING;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) INTO v_has_full_name;

  IF v_has_full_name AND v_full_name IS NOT NULL THEN
    EXECUTE 'UPDATE public.profiles SET full_name = $1 WHERE id = $2'
    USING v_full_name, v_uid;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) INTO v_has_role;

  IF v_has_role THEN
    EXECUTE 'SELECT role::TEXT FROM public.profiles WHERE id = $1'
    INTO v_role
    USING v_uid;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_uid,
    'role', COALESCE(v_role, 'innovator')
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile(TEXT) TO authenticated;

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
