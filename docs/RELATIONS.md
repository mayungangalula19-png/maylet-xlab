# Maylet XLab — Project Relations Map

This document describes how **projects** connect to the database and the app.

## Hub: `public.projects`

Every innovation record flows through `projects`. The owner is `user_id` → `auth.users`.

```
auth.users
    ├── profiles (id)
    ├── users (id)
    ├── dna_profiles (user_id)
    └── projects (user_id)  ← HUB
            ├── experiments (project_id)
            ├── prototypes (project_id)
            │     ├── prototype_builds (prototype_id)
            │     ├── prototype_test_runs (prototype_id)
            │     └── prototype_files (prototype_id)
            ├── teams (project_id)
            │     ├── team_members (team_id)  — NO project_id on this table
            │     └── team_activities (team_id)
            ├── documents (project_id)
            ├── tasks (project_id)
            ├── activities (project_id)
            ├── funding_pitches (project_id)
            ├── ai_analyses (project_id)
            ├── project_reviews (project_id)
            ├── research_profiles (project_id, UNIQUE)
            ├── research_notes (project_id)
            ├── literature_items (project_id)
            ├── research_findings (project_id)
            ├── research_gate_reviews (project_id)
            ├── innovation_nodes (project_id)
            └── maya_alerts (project_id)
```

## Team link (important)

`team_members` does **not** have `project_id`. Path:

```
projects ← teams.project_id ← team_members.team_id
```

## App create flow (unified)

| Step | Component | Database |
|------|-----------|----------|
| 1 | Dashboard or Projects → `NewProjectModal` | — |
| 2 | `createProject()` in `projects.queries.ts` | `INSERT projects` |
| 3 | `logActivity()` | `INSERT activities` |
| 4 | Optional `metadata.team_id` | `UPDATE teams SET project_id` |
| 5 | Realtime + refetch | Dashboard + Projects list |

Routes:
- `/projects` — full portfolio (`getProjects`)
- `/projects?create=1` — opens create modal
- `/projects/:id` — `ProjectDetail`
- `/projects/create` — redirects to `/projects?create=1`

## App files ↔ database

| File | Tables |
|------|--------|
| `projects.queries.ts` | `projects`, `activities` |
| `dbHelpers.ts` | `activities`, `teams`, `team_members`, `profiles`, delete relations |
| `commandCenter.queries.ts` | `projects`, `experiments`, `documents`, `funding_pitches`, `vault_entries`, `teams` |
| `research.queries.ts` | `research_profiles`, `research_notes`, `literature_items`, `research_findings` |
| `activityService.ts` | `activities`, `projects` |
| `prototypeService.ts` | `prototypes`, `prototype_files`, `projects` |

## Apply database connection on Supabase

Run migrations in order, then the connect repair:

```
supabase/migrations/20240101000001_extensions.sql
supabase/migrations/20240101000002_core_schema.sql
... (all through 008)
supabase/migrations/20240612000009_connect_full_schema.sql  ← run this on live DB
```

Or paste `20240612000009_connect_full_schema.sql` in **Supabase → SQL Editor**.

## Verify foreign keys (SQL)

```sql
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (ccu.table_name = 'projects' OR tc.table_name = 'projects')
ORDER BY child_table, child_column;
```

## Tables used in app but not in core migrations

These may need future migrations:

- `mentors`, `mentorship_requests`, `mentorship_sessions`
- `hackathons`, `hackathon_registrations`
- `messages` / conversations
