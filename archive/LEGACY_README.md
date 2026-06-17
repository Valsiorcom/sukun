# LEGACY SOURCE ARCHIVE

This folder documents legacy source files left in src/ that are incompatible with the new Next.js App Router setup.

Why archived:
- Many files under `src/` depend on custom runtimes and tooling (TanStack Start, custom Vite config, Bun, etc.).
- To avoid breaking the Next.js App Router build and TypeScript checks, `src/` is excluded from tsconfig.

What to do next:
- Gradually migrate routes and components from `src/` into `app/` or `components/` while preserving the UI.
- If you want to restore a file for migration, move it out of `src/` and update imports or adjust tsconfig accordingly.

Important files in `src/` to inspect first:
- src/routeTree.gen.ts — large generated TanStack router file.
- src/server.ts, src/start.ts, vite.config.ts — custom server/runtime and Vite presets.
- src/router.tsx — uses @tanstack/react-router and react-query.

If you want, I can create a migration plan to convert specific routes in `src/routes/` into Next.js `app/` routes.
