# `src/lib` - Shared Utility Contracts

## Scope
Rules here apply to shared utilities under `src/lib/**`.
Changes here are high impact because many routes/pages depend on these functions.

## Ownership Boundaries
- `api.ts`: request parsing, response helpers, request ID extraction.
- `db.ts`: D1 access + id/timestamp/primitive normalization helpers.
- `auth.ts` and `server-auth.ts`: token/cookie/session behavior.
- `logging.ts`: structured API/server error logging.
- `prisma.ts`: Prisma + D1 adapter bridge.

## Local Conventions (Delta)
- Keep function signatures explicit and typed; no `any`-style widening.
- Preserve helper contracts to avoid downstream route breakage.
- Use deterministic return shapes for helper APIs (especially error/response helpers).
- Keep utility names semantic (`parseXxx`, `normalizeXxx`, `mapXxx`, `createXxx`).

## DB/Auth Safety Rules
- Maintain parameterized SQL expectations for callers.
- Keep cookie/security options aligned with env/runtime constraints.
- Avoid introducing hidden side effects in helpers used across request boundaries.

## Must Not Do
- Do not change helper return shape without updating all callers.
- Do not mix UI-specific behavior into `src/lib` utilities.
- Do not duplicate existing helper behavior in new files; extend existing contracts when possible.

## Verification For Changes Here
- Baseline: `pnpm run build`
- Required: `pnpm exec tsc --noEmit`
- For auth/db helper changes, run relevant e2e specs (`auth.spec.ts`, `api-crud.spec.ts`).
