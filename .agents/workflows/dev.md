---
description: How to set up and run the local development environment
---

# Local Development Setup

// turbo-all

1. Reset, migrate, and seed the local D1 database:

```bash
pnpm run db:prepare:local
```

2. Start the Next.js dev server:

```bash
pnpm run dev
```

## Individual DB Commands

- **Reset local DB only:** `pnpm run db:reset:local`
- **Run migrations only:** `pnpm run db:migrate:local`
- **Seed only:** `pnpm run db:seed:local`
- **Seed demo data only:** `pnpm run seed:demo:local`

## Notes

- The app uses Cloudflare D1 (SQLite) via Prisma with the `@prisma/adapter-d1` adapter.
- Local D1 data is stored in `.wrangler/state/v3/d1/`.
- The dev server runs at `http://localhost:3000`.
