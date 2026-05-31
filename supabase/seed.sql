-- Optional seed data (run after migrations with service role)
-- Replace UUIDs with real auth.users ids after creating test users in Supabase Auth

-- Example system settings
INSERT INTO public.system_settings (key, value) VALUES
  ('app_name', '"Maylet XLab"'),
  ('maya_default_model', '"groq"'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;
