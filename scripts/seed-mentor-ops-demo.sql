-- Optional demo data for Mentor OS at /admin/mentors
-- Run AFTER create-mentor-ops-tables.sql

INSERT INTO public.mentors (
  full_name, title, expertise, bio, years_experience, rating, total_sessions,
  industry, country, organization, availability_status, email, is_active
)
SELECT * FROM (VALUES
  ('Dr. Amara Okafor', 'HealthTech Innovation Lead', ARRAY['HealthTech','AI / ML','Product Strategy']::text[],
   '15 years building digital health platforms across Africa.', 15, 4.8, 42,
   'HealthTech', 'Nigeria', 'MedInnovate Africa', 'available', 'amara@example.com', TRUE),
  ('James Chen', 'FinTech Mentor', ARRAY['FinTech','Business Review','Go-to-Market']::text[],
   'Former VP Product at a Series B fintech. Passionate about founder coaching.', 12, 4.6, 38,
   'FinTech', 'Singapore', 'Independent', 'busy', 'james@example.com', TRUE),
  ('Sarah Müller', 'AgriTech Advisor', ARRAY['AgriTech','CleanTech','Impact']::text[],
   'Agri supply-chain expert supporting climate-smart innovation.', 10, 4.7, 29,
   'AgriTech', 'Germany', 'GreenFields Lab', 'available', 'sarah@example.com', TRUE)
) AS v(full_name, title, expertise, bio, years_experience, rating, total_sessions, industry, country, organization, availability_status, email, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.mentors WHERE full_name = 'Dr. Amara Okafor');

-- Sample feedback (uses first mentor if exists)
INSERT INTO public.mentor_feedback (mentor_id, rating, comment)
SELECT m.id, 5, 'Excellent strategic guidance on our MVP roadmap.'
FROM public.mentors m
WHERE m.full_name = 'Dr. Amara Okafor'
  AND NOT EXISTS (SELECT 1 FROM public.mentor_feedback LIMIT 1)
LIMIT 1;

NOTIFY pgrst, 'reload schema';
