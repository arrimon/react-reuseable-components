# AGENTS.md

Personal project: a Vite + React 19 + TypeScript app being turned into a library of reusable components. Single package, no monorepo. npm (commit `package-lock.json`, don't introduce yarn/pnpm locks).

## Commands

- Dev server: `npm run dev`
- Lint: `npm run lint` (oxlint — there is **no** eslint/prettier in this repo)
- Typecheck: `npx tsc -b` — there is no `typecheck` script; type checking only runs inside `npm run build` (`tsc -b && vite build`)
- Verify before finishing: `npm run lint && npx tsc -b` (both verified passing)
- **No tests**: no test framework, no `test` script, no CI workflows. Don't add a test command to package.json unless asked.

## Project layout

- `src/main.tsx` — app entry (StrictMode).
- `src/App.tsx` — still the stock Vite template demo page.
- `src/components/shared/` — where reusable components live (e.g. `FloatingLabelInput.tsx`). New shared components go here.
- `src/index.css`, `src/App.css` — plain CSS with custom properties/nesting for the template page; no CSS framework is wired up.

## Traps

- **Tailwind is NOT installed**, yet `FloatingLabelInput.tsx` is written entirely with Tailwind v4 utility classes (plus a comment block explaining Tailwind setup). Those classes currently produce no styles. If you style with Tailwind, first add `tailwindcss` and `@import "tailwindcss"` to the main CSS; otherwise use plain CSS. Don't assume Tailwind classes render.
- **React Compiler is enabled** (babel plugin in `vite.config.ts`). Components are auto-memoized — avoid adding `useMemo`/`useCallback`/manual memo by habit.
- `src/components/shared/FloatingLabelInput.tsx` is not imported anywhere yet.

## TypeScript config (tsconfig.app.json)

Project references (`tsconfig.json` → `app` + `node`), `noEmit`, so `tsc -b` is check-only. Notable flags:

- `verbatimModuleSyntax` → type-only imports must use `import type`.
- `noUnusedLocals` / `noUnusedParameters` → unused vars fail the build.
- `erasableSyntaxOnly` → no TS enums, namespaces, or parameter properties.
- `allowImportingTsExtensions` → relative imports may include `.tsx`/`.ts` (template style: `import App from './App.tsx'`).

## Lint config

`.oxlintrc.json` enables plugins `react`, `typescript`, `oxc` with `react/rules-of-hooks: error` and `react/only-export-components: warn`. Type-aware rules are not enabled (see README for how to add them).

## Notes

- `.opencode/instructions.md` exists but is empty — AGENTS.md is the live source of agent guidance.
- README is mostly stock Vite template prose; trust `package.json` and config files over it.
