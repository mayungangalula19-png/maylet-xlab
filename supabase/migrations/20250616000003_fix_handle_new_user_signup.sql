-- Signup fix: protect_profile_role bootstrap + handle_new_user INSERT path

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
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
