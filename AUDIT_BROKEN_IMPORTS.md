# Broken Imports Audit — automatic findings

Date: 2026-06-17
Repo: Valsiorcom/sukun

Summary:
- I scanned top-level legacy files under src/ and the Vite/Bun configs. I identified imports that are either external packages not present in package.json or non-resolving path aliases under the new tsconfig.

Findings (file -> problematic imports):

1) src/server.ts
   - @tanstack/react-start/server-entry (external)
   - Note: also imports local modules ./lib/error-capture and ./lib/error-page — those are internal and appear present.

2) src/start.ts
   - @tanstack/react-start (external)
   - @/integrations/supabase/auth-attacher (path alias; `@/integrations` is not mapped in tsconfig and resolves only when building the legacy setup)

3) src/router.tsx
   - @tanstack/react-query (external)
   - @tanstack/react-router (external)
   - ./routeTree.gen (local, exists)

4) vite.config.ts
   - @lovable.dev/vite-tanstack-config (external)

5) Other repo-level toolchains
   - bun.lock, bunfig.toml — indicates Bun tooling; may conflict with Vercel/Next setup.

Actions taken in this commit:
- tsconfig.json: excluded `src/` from TypeScript's global checks to prevent legacy code from failing `tsc` during the Next.js migration.
- archive/LEGACY_README.md created explaining the archive and migration guidance.

Recommendations (next steps):
1) Decide whether to keep TanStack Start/Vite-based runtime in this repository. If not required, remove or archive these files:
   - src/server.ts
   - src/start.ts
   - src/router.tsx
   - vite.config.ts
   - bun.lock, bunfig.toml
   - src/routeTree.gen.ts (or keep if you plan to port routes)

2) If you want to maintain both runtimes in the same repo, add conditional type-checking and separate project references (use tsconfig project references) or move legacy files into a separate package.

3) To finish cleanup (I can run these if you approve):
   - Convert or migrate src/routes/* into app/ file-based routes (one route per file). I can create a script that converts simple routes automatically.
   - Update or remove non-resolved imports (replace `@/integrations/*` with relative paths or add tsconfig paths for `@/src/*` if you want to keep src in place).
   - Remove unused packages and lockfiles (bun.lock) if you will not use Bun.

If you want me to proceed and physically move legacy files into an `archive/legacy-src/` directory (so they are out of the repository root, and excluded from builds), I can do that next. This is non-destructive (I will copy files into archive and then remove originals in a separate commit) — say "move legacy" and I'll proceed.
