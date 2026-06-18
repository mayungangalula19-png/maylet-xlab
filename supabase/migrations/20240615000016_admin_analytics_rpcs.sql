-- Admin analytics RPCs — consolidated metrics for dashboard and analytics pages.
-- Callable only by users with admin / super_admin role (is_admin()).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start TIMESTAMPTZ := date_trunc('month', NOW() AT TIME ZONE 'UTC');
  v_thirty_days_ago TIMESTAMPTZ := NOW() - INTERVAL '30 days';
  v_seven_days_ago TIMESTAMPTZ := NOW() - INTERVAL '7 days';
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'total_users', (SELECT COUNT(*)::int FROM public.profiles),
    'total_projects', (SELECT COUNT(*)::int FROM public.projects),
    'total_experiments', (SELECT COUNT(*)::int FROM public.experiments),
    'total_prototypes', (SELECT COUNT(*)::int FROM public.prototypes),
    'total_vault_items', (SELECT COUNT(*)::int FROM public.vault_items),
    'total_funding_pitches', (SELECT COUNT(*)::int FROM public.funding_pitches),
    'total_revenue', COALESCE((
      SELECT SUM(amount)::numeric
      FROM public.payments
      WHERE COALESCE(status, 'completed') NOT IN ('failed', 'cancelled', 'refunded', 'pending')
    ), 0),
    'monthly_revenue', COALESCE((
      SELECT SUM(amount)::numeric
      FROM public.payments
      WHERE created_at >= v_thirty_days_ago
        AND COALESCE(status, 'completed') NOT IN ('failed', 'cancelled', 'refunded', 'pending')
    ), 0),
    'active_users', (
      SELECT COUNT(*)::int
      FROM public.profiles
      WHERE COALESCE(last_active, updated_at) >= v_seven_days_ago
    ),
    'new_users_this_month', (
      SELECT COUNT(*)::int
      FROM public.profiles
      WHERE created_at >= v_month_start
    ),
    'projects_this_month', (
      SELECT COUNT(*)::int
      FROM public.projects
      WHERE created_at >= v_month_start
    ),
    'funding_pitches_this_month', (
      SELECT COUNT(*)::int
      FROM public.funding_pitches
      WHERE created_at >= v_month_start
    ),
    'avg_project_progress', COALESCE((
      SELECT ROUND(AVG(COALESCE(progress, 0)))::int
      FROM public.projects
    ), 0),
    'total_mentors', (SELECT COUNT(*)::int FROM public.profiles WHERE role::text = 'mentor'),
    'total_investors', (SELECT COUNT(*)::int FROM public.profiles WHERE role::text = 'investor'),
    'total_innovators', (SELECT COUNT(*)::int FROM public.profiles WHERE role::text = 'innovator')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_analytics_snapshot(p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INT := GREATEST(7, LEAST(COALESCE(p_days, 30), 90));
  v_range_start TIMESTAMPTZ := (CURRENT_DATE - (v_days - 1))::timestamptz;
  v_month_start TIMESTAMPTZ := date_trunc('month', NOW() AT TIME ZONE 'UTC');
  v_thirty_days_ago TIMESTAMPTZ := NOW() - INTERVAL '30 days';
  v_seven_days_ago TIMESTAMPTZ := NOW() - INTERVAL '7 days';
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'generated_at', NOW(),
    'range_days', v_days,
    'totals', jsonb_build_object(
      'users', (SELECT COUNT(*)::int FROM public.profiles),
      'projects', (SELECT COUNT(*)::int FROM public.projects),
      'experiments', (SELECT COUNT(*)::int FROM public.experiments),
      'prototypes', (SELECT COUNT(*)::int FROM public.prototypes),
      'vault_items', (SELECT COUNT(*)::int FROM public.vault_items),
      'funding_pitches', (SELECT COUNT(*)::int FROM public.funding_pitches),
      'total_revenue', COALESCE((
        SELECT SUM(amount)::numeric
        FROM public.payments
        WHERE COALESCE(status, 'completed') NOT IN ('failed', 'cancelled', 'refunded', 'pending')
      ), 0),
      'revenue_30d', COALESCE((
        SELECT SUM(amount)::numeric
        FROM public.payments
        WHERE created_at >= v_thirty_days_ago
          AND COALESCE(status, 'completed') NOT IN ('failed', 'cancelled', 'refunded', 'pending')
      ), 0),
      'revenue_mtd', COALESCE((
        SELECT SUM(amount)::numeric
        FROM public.payments
        WHERE created_at >= v_month_start
          AND COALESCE(status, 'completed') NOT IN ('failed', 'cancelled', 'refunded', 'pending')
      ), 0),
      'active_users_7d', (
        SELECT COUNT(*)::int
        FROM public.profiles
        WHERE COALESCE(last_active, updated_at) >= v_seven_days_ago
      ),
      'new_users_mtd', (
        SELECT COUNT(*)::int FROM public.profiles WHERE created_at >= v_month_start
      ),
      'new_projects_mtd', (
        SELECT COUNT(*)::int FROM public.projects WHERE created_at >= v_month_start
      ),
      'avg_project_progress', COALESCE((
        SELECT ROUND(AVG(COALESCE(progress, 0)))::int FROM public.projects
      ), 0)
    ),
    'projects_by_status', COALESCE((
      SELECT jsonb_object_agg(status_key, cnt)
      FROM (
        SELECT status::text AS status_key, COUNT(*)::int AS cnt
        FROM public.projects
        GROUP BY status
      ) s
    ), '{}'::jsonb),
    'projects_by_sector', COALESCE((
      SELECT jsonb_object_agg(sector_key, cnt)
      FROM (
        SELECT COALESCE(NULLIF(TRIM(sector), ''), 'Other') AS sector_key, COUNT(*)::int AS cnt
        FROM public.projects
        GROUP BY COALESCE(NULLIF(TRIM(sector), ''), 'Other')
        ORDER BY cnt DESC
        LIMIT 12
      ) s
    ), '{}'::jsonb),
    'users_by_role', COALESCE((
      SELECT jsonb_object_agg(role_key, cnt)
      FROM (
        SELECT role::text AS role_key, COUNT(*)::int AS cnt
        FROM public.profiles
        GROUP BY role
      ) r
    ), '{}'::jsonb),
    'users_by_plan', COALESCE((
      SELECT jsonb_object_agg(plan_key, cnt)
      FROM (
        SELECT COALESCE(NULLIF(TRIM(plan), ''), 'free') AS plan_key, COUNT(*)::int AS cnt
        FROM public.profiles
        GROUP BY COALESCE(NULLIF(TRIM(plan), ''), 'free')
      ) p
    ), '{}'::jsonb),
    'revenue_by_month', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'month', to_char(m.month_start, 'Mon YYYY'),
          'amount', COALESCE(m.amount, 0)
        )
        ORDER BY m.month_start
      )
      FROM (
        SELECT
          date_trunc('month', gs)::date AS month_start,
          (
            SELECT SUM(p.amount)::numeric
            FROM public.payments p
            WHERE date_trunc('month', p.created_at) = date_trunc('month', gs)
              AND COALESCE(p.status, 'completed') NOT IN ('failed', 'cancelled', 'refunded', 'pending')
          ) AS amount
        FROM generate_series(
          date_trunc('month', NOW()) - INTERVAL '5 months',
          date_trunc('month', NOW()),
          INTERVAL '1 month'
        ) AS gs
      ) m
    ), '[]'::jsonb),
    'growth_series', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', d.day::text,
          'signups', COALESCE(su.cnt, 0),
          'projects', COALESCE(pr.cnt, 0)
        )
        ORDER BY d.day
      )
      FROM (
        SELECT generate_series(
          CURRENT_DATE - (v_days - 1),
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS day
      ) d
      LEFT JOIN (
        SELECT created_at::date AS day, COUNT(*)::int AS cnt
        FROM public.profiles
        WHERE created_at >= v_range_start
        GROUP BY created_at::date
      ) su ON su.day = d.day
      LEFT JOIN (
        SELECT created_at::date AS day, COUNT(*)::int AS cnt
        FROM public.projects
        WHERE created_at >= v_range_start
        GROUP BY created_at::date
      ) pr ON pr.day = d.day
    ), '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics_snapshot(INT) TO authenticated;
