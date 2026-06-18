-- Align notifications table with messaging triggers and app services (body, link, type).
-- Remote installs created before core_schema may only have a "message" column.

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Backfill body from legacy message column when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'message'
  ) THEN
    UPDATE public.notifications
    SET body = COALESCE(body, message)
    WHERE body IS NULL AND message IS NOT NULL;
  END IF;
END $$;

-- Keep legacy message column in sync for older readers (optional dual-write)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'message'
  ) THEN
    UPDATE public.notifications
    SET message = COALESCE(message, body)
    WHERE message IS NULL AND body IS NOT NULL;r
  END IF;
END $$;
