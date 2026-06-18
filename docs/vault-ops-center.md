# Innovation Vault Command Center

Admin route: `/admin/vault`

## Architecture

Unified asset aggregation from `vault_entries`, `vault_items`, `documents`, `prototype_files`, `prototypes`, `experiments`, `funding_pitches`, `validations`, and `ai_innovation_vault`.

## Migration

Apply `supabase/migrations/20260617000003_vault_ops_admin.sql` for governance tables, RLS, and `get_admin_vault_ops_stats()` RPC.

## Module

`src/modules/admin/vault/` — types, utils, service, hook, components.

## Enterprise Readiness

| Capability | Status |
|------------|--------|
| 10 executive KPIs | ✅ |
| Vault explorer (folders/collections/domains) | ✅ |
| Unified asset registry | ✅ |
| Global search + filters | ✅ |
| Classification system (7 levels) | ✅ |
| Maya AI knowledge engine | ✅ |
| Knowledge graph visualization | ✅ |
| Document preview center | ✅ |
| Version control panel | ✅ |
| Approval workflow | ✅ |
| Audit center | ✅ |
| Analytics dashboard | ✅ |
| RBAC (manage_projects) | ✅ |
| Real DB data | ✅ |
