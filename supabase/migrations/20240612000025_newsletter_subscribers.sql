-- Newsletter growth engine: subscribers, analytics events, rate limits, automation queue
-- Safe to re-run; use 20240612000026_newsletter_schema_compat.sql if migration 25 failed partway.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'landing_page',
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.newsletter_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.newsletter_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.newsletter_automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID,
  email TEXT NOT NULL,
  pipeline TEXT NOT NULL DEFAULT 'welcome_sequence',
  status TEXT NOT NULL DEFAULT 'pending',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'landing_page';
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

ALTER TABLE public.newsletter_events ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE public.newsletter_events ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';
ALTER TABLE public.newsletter_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.newsletter_rate_limits ADD COLUMN IF NOT EXISTS identifier TEXT;
ALTER TABLE public.newsletter_rate_limits ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.newsletter_rate_limits ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.newsletter_automation_queue ADD COLUMN IF NOT EXISTS subscriber_id UUID;
ALTER TABLE public.newsletter_automation_queue ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.newsletter_automation_queue ADD COLUMN IF NOT EXISTS pipeline TEXT DEFAULT 'welcome_sequence';
ALTER TABLE public.newsletter_automation_queue ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.newsletter_automation_queue ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.newsletter_automation_queue ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.newsletter_automation_queue ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

UPDATE public.newsletter_subscribers SET status = 'active' WHERE status IS NULL;
UPDATE public.newsletter_automation_queue SET status = 'pending' WHERE status IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'newsletter_subscribers'
      AND c.conname = 'newsletter_subscribers_status_check'
  ) THEN
    ALTER TABLE public.newsletter_subscribers
      ADD CONSTRAINT newsletter_subscribers_status_check
      CHECK (status IN ('active', 'unsubscribed', 'bounced'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'newsletter_automation_queue'
      AND c.conname = 'newsletter_automation_queue_status_check'
  ) THEN
    ALTER TABLE public.newsletter_automation_queue
      ADD CONSTRAINT newsletter_automation_queue_status_check
      CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'newsletter_subscribers'
      AND c.conname = 'newsletter_subscribers_email_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class i
    JOIN pg_namespace n ON i.relnamespace = n.oid
    WHERE n.nspname = 'public' AND i.relname = 'newsletter_subscribers_email_key'
  ) THEN
    ALTER TABLE public.newsletter_subscribers
      ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'newsletter_automation_queue'
      AND c.conname = 'newsletter_automation_queue_subscriber_fkey'
  ) THEN
    ALTER TABLE public.newsletter_automation_queue
      ADD CONSTRAINT newsletter_automation_queue_subscriber_fkey
      FOREIGN KEY (subscriber_id) REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source ON public.newsletter_subscribers(source);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_events_name ON public.newsletter_events(event_name);
CREATE INDEX IF NOT EXISTS idx_newsletter_rate_limits_identifier ON public.newsletter_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_newsletter_automation_status ON public.newsletter_automation_queue(status);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_automation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_events_insert_anon" ON public.newsletter_events;
CREATE POLICY "newsletter_events_insert_anon" ON public.newsletter_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_events_select_admin" ON public.newsletter_events;
CREATE POLICY "newsletter_events_select_admin" ON public.newsletter_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "newsletter_subscribers_admin" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_admin" ON public.newsletter_subscribers
  FOR ALL TO authenticated
  USING (public.is_admin());

GRANT INSERT ON public.newsletter_events TO anon, authenticated;
GRANT SELECT ON public.newsletter_events TO authenticated;
