# `src/app/api` - Route Handler Rules

## Scope
Rules here apply to `src/app/api/**/route.ts`.
These are stricter than root rules because API mistakes impact auth/data integrity.

## API Contract Pattern
- Parse input with helpers from `@/lib/api` (`readJsonBody`, `readString`, `readOptionalUrl`).
- Validate before DB work; return stable status codes (`400`, `401/403`, `404`, `429`, `500`).
- Prefer `jsonOk` / `jsonError` for consistent payload shape.
- Keep request-body interfaces local to each route file (`CreateXxxBody`, `UpdateXxxBody`).

## Auth and Access
- Middleware pre-check is not sufficient; enforce auth/authorization inside handlers.
- Use `getAdminSession()` for admin-only routes.
- Use owner-or-admin guards for mutable user content.
- Return safe error messages; never leak secret/internal details.

## DB and Performance
- Always parameterize SQL with `.prepare(...).bind(...)`.
- Never interpolate untrusted input into SQL.
- Use shared helpers for IDs/timestamps (`createId`, `createTimestamp`).
- Clamp limits/pagination for list endpoints.
- Avoid N+1 query patterns for feed/list endpoints.

## Logging and Traceability
- For critical routes, create/use request IDs via `getRequestId`.
- Log server failures with `logApiError` and keep response shape stable in `catch` blocks.

## Must Not Do
- Do not ship routes with unvalidated request bodies.
- Do not add broad `catch` handlers that swallow context without structured logging for critical paths.
- Do not bypass shared API helpers unless behavior requires a documented exception.

## Verification For Changes Here
- Baseline: `pnpm run build`
- Type check: `pnpm exec tsc --noEmit`
- API/auth changes: run targeted Playwright first (`auth.spec.ts` / `api-crud.spec.ts`), then broader suite if needed.
