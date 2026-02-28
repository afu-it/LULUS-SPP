# LULUS SPP - Agent Instructions

## Hierarchical Knowledge Base
- Generated: 2026-02-27 (Asia/Kuala_Lumpur)
- Commit: `69009d5`
- Branch: `master`
- This root file defines global rules. Child `AGENTS.md` files provide directory-specific deltas only.

## Local AGENTS Hierarchy
- `src/app/AGENTS.md` - page, layout, and client navigation conventions.
- `src/app/api/AGENTS.md` - route-handler validation/auth/DB/error patterns.
- `src/lib/AGENTS.md` - shared utility contracts and helper usage boundaries.
- `prisma/AGENTS.md` - migration and seed workflow constraints.

## Where To Look
| Task | Location | Notes |
|------|----------|-------|
| Add or update API endpoint | `src/app/api` | Follow helper-first input parsing and prepared SQL rules |
| Change shared auth/db/api helpers | `src/lib` | Preserve explicit typing and utility contracts |
| Update page UX/navigation | `src/app` | Maintain Mantine + app shell + localStorage namespace patterns |
| Add migration/seed data | `prisma` | Keep migration chain scripts aligned in `package.json` |

## Purpose
Use this guide as the default playbook for coding agents working in this repo.
It documents practical commands, code conventions, and safe change behavior.

## Rule Source Check (Cursor/Copilot)
- `.cursor/rules/`: not found.
- `.cursorrules`: not found.
- `.github/copilot-instructions.md`: not found.
- Hierarchical agent rules are active; check root + subdirectory `AGENTS.md` files together.
- If Cursor/Copilot rule files are added later, merge their guidance here.

## Stack Summary
- Next.js App Router.
- Mantine v8 and `@tabler/icons-react`.
- Cloudflare Workers runtime via OpenNext.
- Cloudflare D1 (SQLite) accessed with prepared SQL.
- TypeScript strict mode (`tsconfig.json`).
- Playwright E2E tests under `tests/e2e`.
- Package manager: `pnpm`.

## Key Paths
- `src/app/`: pages and route handlers.
- `src/app/api/`: backend endpoints.
- `src/components/`: reusable UI components.
- `src/hooks/`: custom client hooks.
- `src/lib/`: shared utilities (`api`, `db`, auth, logging).
- `src/providers/`: app-level providers.
- `src/types/`: shared entity types.
- `prisma/`: schema, migrations, seed SQL.
- `tests/e2e/`: Playwright specs.

## Build/Lint/Test Commands

### Setup and Dev
- Install: `pnpm install`
- Dev server: `pnpm run dev`
- Local app URL: `http://127.0.0.1:3000`
- Regenerate CF env types: `pnpm run cf-typegen`

### Build and Type Check
- Main build check: `pnpm run build`
- Webpack build (used by OpenNext): `pnpm run build:webpack`
- Optional explicit TS check: `pnpm exec tsc --noEmit`

### Lint/Format Status
- No dedicated lint script exists in `package.json`.
- No committed ESLint/Prettier config is present.
- Avoid large formatting-only diffs.
- Preserve the local style of touched files.

### Playwright Tests
- Full suite: `pnpm run test:e2e`
- Headed suite: `pnpm run test:e2e:headed`

Single-test workflows (important):
- Single file: `pnpm run test:e2e -- tests/e2e/auth.spec.ts`
- Single file (headed): `pnpm run test:e2e:headed -- tests/e2e/pages.spec.ts`
- Single test title: `pnpm run test:e2e -- -g "auth login and logout flow works"`

## Database and Deploy Commands

### D1 / Prisma SQL Workflow
- Reset local D1: `pnpm run db:reset:local`
- Local migrations chain: `pnpm run db:migrate:local`
- Remote migrations chain: `pnpm run db:migrate:remote`
- Seed local base+demo: `pnpm run db:seed:local`
- Full local prep: `pnpm run db:prepare:local`
- Remote demo seed: `pnpm run seed:demo:remote`

Notes:
- Migration files are run via manually chained scripts in `package.json`.
- Keep migration scripts in sync when adding migration SQL files.

### Deploy
- Deploy command: `pnpm run deploy`
- Do not use `pnpm deploy` (different pnpm subcommand).
- Production URL: `https://lulus-spp.afuitdev.workers.dev`

## Coding Standards

### Imports and Module Usage
- Prefer `@/` alias imports for internal modules.
- Keep imports grouped: external packages first, internal aliases second.
- Use `import type` for type-only imports where practical.
- Avoid deep relative import chains when alias paths are available.

### Formatting
- Keep semicolons.
- Keep JSX and long calls readable with line breaks.
- Favor early returns over deeply nested conditionals.
- Preserve existing quote style in each file to minimize noisy diffs.
- Do not reformat unrelated code.

### Types and Data Modeling
- Avoid `any`; keep strict, explicit TS types.
- In API routes, define request/body interfaces near handlers.
- Define SQL row interfaces (`*Row`) and map to API shape via mapper functions.
- Put shared entity contracts in `src/types/entities.ts`.
- Keep payload fields explicit; avoid loose passthrough objects.

### Naming Conventions
- Components: PascalCase.
- Hooks: `useXxx`.
- Event/command handlers: `handleXxx`.
- Constants: `UPPER_SNAKE_CASE`.
- Utility parsers/mappers: `parseXxx`, `normalizeXxx`, `mapXxx`.
- API payload interfaces: `CreateXxxBody`, `UpdateXxxBody`, etc.

### React/Mantine Patterns
- Most pages are client components (`'use client'`).
- Prefer Mantine primitives for consistency.
- Keep localStorage keys namespaced with `lulus-spp:`.
- Use `router.push(...)` for route transitions from handlers.
- Follow established app visual language unless explicitly redesigning.

## API and Error-Handling Conventions

### Input Validation and Responses
- Validate input before DB work.
- Prefer helpers from `src/lib/api` (`readJsonBody`, `readString`, `readOptionalUrl`, `jsonError`, `jsonOk`).
- Return safe user-facing errors; do not leak internals.
- Use consistent statuses: `400`, `401/403`, `404`, `429`, `500`.

### Logging and Traceability
- For critical API routes, include a request ID (`getRequestId`).
- Log server failures with `logApiError`.
- Keep catch blocks explicit and return stable API shapes.

## SQL and Performance Rules
- Always parameterize SQL with `.prepare(...).bind(...)`.
- Never interpolate untrusted input into SQL.
- Use `createId()` and `createTimestamp()` for new rows.
- Clamp list limits and use pagination for potentially large collections.
- Avoid N+1 API/query patterns in feed/list screens.
- Prefer aggregate/preview fields in list endpoints over fetching full child lists.

## Cloudflare Worker Constraints
- Repository currently targets Workers Free plan behavior.
- Do not depend on paid-only `limits.cpu_ms` config.
- Prevent CPU/memory spikes by bounding query sizes and payload sizes.
- Avoid buffering large payloads when streaming or pagination is possible.

## Verification Expectations
- Baseline for most changes: run `pnpm run build`.
- For API/auth changes: run targeted E2E specs, then broader suite if needed.
- For navigation/page changes: run at least `tests/e2e/pages.spec.ts`.
- If you skip tests, state exactly what was skipped and why.

## Agent Checklist Before Handoff
- Keep scope tightly aligned to the user request.
- Avoid unrelated refactors in touched files.
- Keep secrets/credentials out of code and commits.
- Update docs/scripts when behavior or command flow changes.
- Prefer reversible changes and mention rollback direction for deploy/DB work.
