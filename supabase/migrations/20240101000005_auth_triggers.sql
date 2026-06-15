-- Auto-create profile + users row on signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type, organization_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'organization_name', ''),
    'innovator'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, email, full_name, user_type, organization_name, is_student)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'organization_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'user_type') = 'student', TRUE)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.dna_profiles (user_id, strengths, weaknesses)
  VALUES (NEW.id, '[]'::jsonb, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage buckets: see migration 20240612000022_storage_buckets.sql
