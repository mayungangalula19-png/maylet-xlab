-- MINIMUM FIX — copy ONLY the line below, run it alone, nothing else selected.
-- Close /admin/mentors first (or stop npm run dev), wait 10s, then run:

ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- After success, run this second query alone:

NOTIFY pgrst, 'reload schema';
