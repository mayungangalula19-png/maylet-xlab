-- TEAMS QUICK SETUP — copy ALL of this file, paste in Supabase SQL Editor, click RUN once.
-- Do NOT run single lines like "auth.uid() = owner_id" alone.

-- 1) Columns the app needs
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS purpose TEXT;

-- 2) Backfill user_id from owner_id
UPDATE public.teams
SET user_id = owner_id
WHERE user_id IS NULL AND owner_id IS NOT NULL;

-- 3) Trigger: keep user_id and owner_id in sync
CREATE OR REPLACE FUNCTION public.sync_team_owner_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    NEW.owner_id := NEW.user_id;
  ELSIF NEW.owner_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id := NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_team_owner_id_trigger ON public.teams;

CREATE TRIGGER sync_team_owner_id_trigger
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_team_owner_id();

-- 4) Fix insert policy (allows Create Team page)
DROP POLICY IF EXISTS "teams_insert_owner" ON public.teams;

CREATE POLICY "teams_insert_owner"
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = owner_id
    OR (SELECT auth.uid()) = user_id
  );

-- 5) API permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
