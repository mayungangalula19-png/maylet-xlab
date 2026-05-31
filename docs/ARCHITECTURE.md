# Maylet XLab Architecture

## Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime, Edge Functions)
- **AI:** MAYA (`src/lib/maya/`) — multi-agent orchestrator with memory layers

## Key paths

| Path | Purpose |
|------|---------|
| `src/lib/maya/` | InnoOS brain: memory, agents, scoring, orchestrator |
| `src/services/` | Supabase data access |
| `src/components/maya/` | 3-panel AI Assistant UI |
| `supabase/migrations/` | Database schema + RLS |
| `supabase/functions/` | Secure AI proxy, embeddings, alerts |

## Innovation lifecycle

`idea → experiment → prototype → project → funding → business`

Centered on `innovation_nodes` with scores and `ai_memories` for context.

## Setup

1. Copy `.env.example` → `.env`
2. Run migrations: `supabase db push` or apply SQL in Dashboard
3. `npm run dev`
