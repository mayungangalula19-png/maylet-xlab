-- Fix role lookup functions to work with TEXT role column
-- The profiles.role column is TEXT, not the enum type, so we need to handle it as TEXT

DROP FUNCTION IF EXISTS public.get_my_role();

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(role, 'innovator')::TEXT
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Also fix ensure_profile to work with TEXT
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
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  INSERT INTO public.profiles (id)
  VALUES (v_uid)
  ON CONFLICT (id) DO NOTHING;

  -- Update full_name if provided
  IF v_full_name IS NOT NULL THEN
    UPDATE public.profiles SET full_name = v_full_name WHERE id = v_uid;
  END IF;

  -- Get the current role (as TEXT since column is TEXT)
  SELECT COALESCE(role, 'innovator')::TEXT INTO v_role
  FROM public.profiles
  WHERE id = v_uid;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_uid,
    'role', v_role
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile(TEXT) TO authenticated;
