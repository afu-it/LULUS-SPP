# `src/app` - Page and Navigation Conventions

## Scope
Rules here apply to pages/layouts in `src/app/**`.
Use root `AGENTS.md` for global standards.

## What Lives Here
- App Router pages (`page.tsx`), app layout/error/loading files, and route-level UI flow.
- Client-first page composition with Mantine and provider-backed hooks.

## Where To Look
| Task | Location | Notes |
|------|----------|-------|
| Change shell/navigation flow | `src/app/layout.tsx` | Keep shell/provider wiring stable |
| Modify page UX/state | `src/app/**/page.tsx` | Preserve local patterns before introducing new state layers |
| App-level loading/error UI | `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx` | Keep resilient fallback UX |

## Local Conventions (Delta)
- Most pages are client components; keep `'use client'` where hooks/browser APIs are used.
- Prefer Mantine primitives over ad-hoc markup to preserve visual and behavior consistency.
- Keep route transitions in handlers explicit (`router.push(...)`).
- Keep local storage keys namespaced with `lulus-spp:`.
- Use `@/` imports for internal modules.

## Must Not Do
- Do not bypass app providers (`AuthProvider`, `I18nProvider`, `MantineProvider`) with duplicate top-level state.
- Do not introduce unbounded client fetch loops or repeated polling without limits/backoff.
- Do not add large layout rewrites in feature PRs unless explicitly requested.

## Verification For Changes Here
- Baseline: `pnpm run build`
- Page/navigation updates: run `pnpm run test:e2e -- tests/e2e/pages.spec.ts`
- If auth-sensitive UI changed: include `tests/e2e/auth.spec.ts`
