-- DEADLOCK-SAFE: run ONE statement at a time in Supabase SQL Editor.
-- Before starting:
--   1. Close /admin/mentors in the browser (or stop `npm run dev`)
--   2. Wait ~10 seconds
--   3. Paste and run ONLY the next numbered block, wait for Success, then continue.

-- ── Step 1 (run alone) ──
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── Step 2 (run alone, after step 1 succeeds) ──
UPDATE public.mentors SET updated_at = NOW() WHERE updated_at IS NULL;

-- ── Step 3 (run alone, optional — only if you want NOT NULL) ──
ALTER TABLE public.mentors
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- ── Step 4 (run alone) — other Mentor OS columns, skip any that already exist ──
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ;

-- ── Step 5 (run alone) ──
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';

-- ── Step 6 (run alone) ──
UPDATE public.mentors SET availability_status = 'available' WHERE availability_status IS NULL;

-- ── Step 7 (run alone) ──
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS email TEXT;

-- ── Step 8 (run alone) ──
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── Step 9 (run alone) ──
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS organization TEXT;

-- ── Step 10 (run alone) ──
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS industry TEXT;

-- ── Step 11 (run alone) ──
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS country TEXT;

-- ── Step 12 (run alone, AFTER all alters succeed) ──
NOTIFY pgrst, 'reload schema';

-- Then restart Vite (press `r` in terminal) and hard-refresh the browser.
