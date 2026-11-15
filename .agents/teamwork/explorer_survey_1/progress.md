# Progress Log - Explorer 1 (Codebase & Type Integrity)

- **Status**: Deep static analysis and type check underway
- **Last visited**: 2026-11-10T08:32:00Z
- **Current Task**: Auditing module structure, routes, Supabase tables, and TypeScript integrity
- **Key findings so far**:
  1. Route asymmetry: `/aulas` has no TanStack route definition (`src/routes/aulas.tsx`), relying on splat `/$` -> `AppRoutes.tsx`, while `/admin-aulas-interativas` has a dedicated `src/routes/admin-aulas-interativas.tsx`.
  2. Persistence duality: `PlayerAulaNativo.tsx` saves progress to `aprender_progresso_aula` (and IndexedDB via `aprenderProgressoStorage.ts`), while `AdminAulasInterativas.tsx` / `aulasSyncService.ts` operates on `aulas_trilhas_progresso` and `localStorage` (`aulas_interativas_progresso_v1`).
  3. Supabase types mismatch: `aulas_trilhas_progresso` and `aulas_trilhas_favoritos` exist in SQL migration `20261101153000_...sql` but are absent from `src/integrations/supabase/types.ts`, requiring `(supabase as any)` casts.
  4. UUID formatting hazard: `getEffectiveUserId()` in `aulasSyncService.ts` generates non-UUID string fallback `'anon-...'` which will cause PostgreSQL error `invalid input syntax for type uuid` against UUID column `user_id`.
  5. Dynamic code evaluation: `parseAulaHtml` in `src/utils/aulaDataLoader.ts` uses `new Function(...)` to evaluate HTML substrings.
