-- One-shot repair: run AFTER fix-signup-trigger.sql if signup still fails.
-- Removes orphaned auth users that have no profile (failed signup attempts).

-- List broken signups (auth user exists, profile missing)
SELECT u.id, u.email, u.created_at, p.id AS profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- Delete orphaned profiles rows without auth (rare)
-- DELETE FROM public.profiles p
-- WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

-- To delete a specific failed signup, run in SQL editor (service role):
-- DELETE FROM auth.users WHERE lower(email) = lower('mayungangalula3@gmail.com');

-- Or delete from Dashboard: Authentication → Users → select user → Delete
