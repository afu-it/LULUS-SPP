# `prisma` - Migrations and Seed Workflow

## Scope
Rules here apply to `prisma/schema.prisma`, `prisma/migrations/**`, and seed SQL files.

## Migration Workflow (Project-Specific)
- Migration files are executed through manually chained scripts in `package.json`.
- When adding a new migration SQL file, update both:
  - `db:migrate:local`
  - `db:migrate:remote`
- Keep migration order deterministic and append-only.

## Seed Workflow
- Base seed: `prisma/seed.sql`
- Demo seed: `prisma/seed.demo.sql`
- Local full prep: `pnpm run db:prepare:local`
- Remote demo seed: `pnpm run seed:demo:remote`

## Local Conventions (Delta)
- Prefer reversible, explicit schema evolution.
- Keep SQL idempotency and data-safety in mind for reruns.
- Document any migration assumptions that affect production data.

## Must Not Do
- Do not edit historical migrations in-place after shared usage; add a new migration.
- Do not add migration files without updating migration chain scripts.
- Do not hardcode environment-specific assumptions inside migration SQL.

## Verification For Changes Here
- Local reset + migrate + seed: `pnpm run db:prepare:local`
- Build validation after DB changes: `pnpm run build`
