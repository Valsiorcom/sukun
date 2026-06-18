# Cleanup Log — Broken Imports Removal

Date: 2026-06-17
Repo: Valsiorcom/sukun

## Summary
This commit removes legacy TanStack Start + Vite configuration files that contained broken imports. These files were no longer used after the migration to Next.js/Vercel.

## Removed Files

### 1. src/server.ts
- **Reason:** Legacy TanStack Start server entry wrapper
- **Broken Import:** `@tanstack/react-start/server-entry` (not in package.json)
- **Status:** Not used in Next.js setup

### 2. src/start.ts
- **Reason:** Legacy TanStack Start middleware configuration
- **Broken Imports:**
  - `@tanstack/react-start` (not in package.json)
  - `@/integrations/supabase/auth-attacher` (path alias not mapped in tsconfig)
- **Status:** Not used in Next.js setup

### 3. src/router.tsx
- **Reason:** Legacy TanStack Router setup
- **Broken Imports:**
  - `@tanstack/react-query` (not in package.json)
  - `@tanstack/react-router` (not in package.json)
- **Status:** Routes migrated to Next.js file-based routing

### 4. vite.config.ts
- **Reason:** Legacy Vite + Lovable config
- **Broken Import:** `@lovable.dev/vite-tanstack-config` (not in package.json)
- **Status:** Next.js uses next.config.ts instead

## Updated Files

### tsconfig.json
- **Change:** Removed `"src"` from exclude list (no longer needed)
- **Reason:** src/ directory is no longer used in the new build

### AUDIT_BROKEN_IMPORTS.md
- **Updated:** Marked cleanup as complete
- **Status:** All identified broken imports removed

## Build Impact
✅ **Zero UI/UX Impact** — All routes, components, and functionality remain intact
✅ **Cleaner Repository** — Removed unused legacy configuration
✅ **Faster Type Checking** — No more excluded directories
✅ **Clear Build Path** — Only Next.js stack is active

## Files Still Present (By Design)
- `src/routeTree.gen.ts` — Kept as reference for route structure (auto-generated)
- `bun.lock, bunfig.toml` — Can be removed in future cleanup if not using Bun
- `next.config.ts` — Active configuration for Next.js
- `tailwind.config.ts` — Active configuration for Tailwind

## Next Steps (Optional)
1. Remove Bun-related files if not needed (`bun.lock`, `bunfig.toml`)
2. Clean up `src/routeTree.gen.ts` if routes are fully migrated
3. Verify all imports use proper path aliases (`@/components/*`, `@/lib/*`, etc.)
