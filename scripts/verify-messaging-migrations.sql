-- Messaging migration verification (Supabase SQL Editor — no psql commands)
-- Expected migrations:
--   20240612000028_messaging_schema.sql
--   20240612000029_messaging_workspace_memory.sql
--   20250617000001_messaging_cut_p0.sql
--   20250617000002_messaging_workspace_create_rls.sql
--   20250617000003_messaging_workspace_rls_fix.sql
--   20250617000004_notifications_schema_align.sql
--
-- Run this entire script in Supabase → SQL Editor → New query → Run

-- =============================================================================
-- SUMMARY (read this first)
-- =============================================================================
WITH required_tables AS (
  SELECT unnest(ARRAY[
    'conversations', 'conversation_members', 'messages', 'message_receipts',
    'user_presence', 'messaging_workspaces', 'workspace_members',
    'workspace_channels', 'conversation_memory', 'message_mentions', 'notifications'
  ]) AS table_name
),
present AS (
  SELECT t.table_name
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name IN (SELECT table_name FROM required_tables)
),
missing AS (
  SELECT r.table_name
  FROM required_tables r
  LEFT JOIN present p ON p.table_name = r.table_name
  WHERE p.table_name IS NULL
),
metadata_col AS (
  SELECT 1 AS ok
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'messages'
    AND column_name = 'metadata'
),
triggers AS (
  SELECT count(*)::int AS cnt
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND NOT t.tgisinternal
    AND t.tgname IN (
      'trg_notify_on_new_message',
      'trg_notify_conversation_member',
      'trg_notify_workspace_member'
    )
),
notifications_body AS (
  SELECT 1 AS ok
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'body'
)
SELECT
  (SELECT count(*) FROM present) AS tables_found,
  (SELECT count(*) FROM required_tables) AS tables_required,
  (SELECT count(*) FROM missing) AS tables_missing,
  CASE WHEN (SELECT count(*) FROM missing) = 0 THEN 'PASS' ELSE 'FAIL' END AS tables_status,
  CASE WHEN EXISTS (SELECT 1 FROM metadata_col) THEN 'PASS' ELSE 'FAIL' END AS metadata_column_status,
  (SELECT cnt FROM triggers) AS notification_triggers_found,
  CASE WHEN (SELECT cnt FROM triggers) = 3 THEN 'PASS' ELSE 'FAIL' END AS triggers_status,
  CASE WHEN EXISTS (SELECT 1 FROM notifications_body) THEN 'PASS' ELSE 'FAIL' END AS notifications_body_status,
  COALESCE((SELECT string_agg(table_name, ', ' ORDER BY table_name) FROM missing), '(none)') AS missing_table_list;

-- =============================================================================
-- SECTION: TABLES
-- =============================================================================
SELECT 'TABLES' AS section, table_name, 'OK' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'conversations', 'conversation_members', 'messages', 'message_receipts',
    'user_presence', 'messaging_workspaces', 'workspace_members',
    'workspace_channels', 'conversation_memory', 'message_mentions', 'notifications'
  )
ORDER BY table_name;

-- =============================================================================
-- SECTION: MESSAGES COLUMNS (metadata)
-- =============================================================================
SELECT 'MESSAGES_COLUMNS' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'messages'
  AND column_name IN ('metadata', 'message_type', 'reply_to_id')
ORDER BY column_name;

-- =============================================================================
-- SECTION: INDEXES
-- =============================================================================
SELECT 'INDEXES' AS section, indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('messages', 'conversations', 'conversation_members', 'message_mentions')
ORDER BY tablename, indexname;

-- =============================================================================
-- SECTION: RLS ENABLED
-- =============================================================================
SELECT 'RLS' AS section, relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'conversations', 'conversation_members', 'messages', 'message_mentions',
    'messaging_workspaces', 'workspace_members', 'conversation_memory', 'notifications'
  )
ORDER BY relname;

-- =============================================================================
-- SECTION: REALTIME PUBLICATION
-- =============================================================================
SELECT 'REALTIME' AS section, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN (
    'conversations', 'conversation_members', 'messages', 'message_receipts',
    'user_presence', 'messaging_workspaces', 'workspace_members',
    'workspace_channels', 'conversation_memory'
  )
ORDER BY tablename;

-- =============================================================================
-- SECTION: NOTIFICATION TRIGGERS
-- =============================================================================
SELECT 'TRIGGERS' AS section, t.tgname AS trigger_name, c.relname AS table_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND t.tgname IN (
    'trg_notify_on_new_message',
    'trg_notify_conversation_member',
    'trg_notify_workspace_member'
  )
ORDER BY c.relname;

-- =============================================================================
-- SECTION: NOTIFICATIONS COLUMNS (body required by messaging triggers)
-- =============================================================================
SELECT 'NOTIFICATIONS_COLUMNS' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
  AND column_name IN ('body', 'message', 'link', 'type', 'read')
ORDER BY column_name;

-- =============================================================================
-- SECTION: FOREIGN KEYS (messages)
-- =============================================================================
SELECT 'FOREIGN_KEYS' AS section, conname AS constraint_name, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.messages'::regclass
  AND contype = 'f'
ORDER BY conname;
