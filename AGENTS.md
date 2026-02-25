# LULUS SPP — Agent Instructions

## Project Overview

LULUS SPP is a Next.js community web app for SPP scholarship candidates. It uses Mantine UI, Cloudflare Pages, and Cloudflare D1 (SQLite) via Prisma.

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI:** Mantine v8 + `@tabler/icons-react`
- **Database:** Cloudflare D1 (SQLite) via `@prisma/adapter-d1`
- **Auth:** Cookie-based admin auth with `bcrypt-edge`
- **Deployment:** Cloudflare Pages via `opennextjs-cloudflare`
- **Package Manager:** pnpm

## Key Directories

- `src/app/` — Next.js pages and API routes
- `src/components/` — Reusable UI components
- `src/hooks/` — Custom React hooks (`useAuth`, `useGuestName`)
- `src/lib/` — Utility functions (Prisma client, date formatting)
- `src/providers/` — Context providers (`AuthProvider`, `AppProvider`)
- `src/types/` — TypeScript type definitions
- `prisma/` — Schema, migrations, and seed files

## Common Commands

- `pnpm run dev` — Start local dev server
- `pnpm run build` — Build for production
- `pnpm run deploy` — Build and deploy to Cloudflare Pages
- `pnpm run db:prepare:local` — Reset, migrate, and seed local D1
- `pnpm run db:migrate:remote` — Apply all migrations to remote D1
- `wrangler d1 execute lulus-spp-db --remote --file=prisma/seed.sql` — Seed remote DB

## Database

- **D1 Database Name:** `lulus-spp-db`
- **D1 Database ID:** `6bfbbcfd-3e2a-473d-911d-e52dcb26468f`
- Migrations are in `prisma/migrations/` and manually chained in `package.json` scripts.
- Seed data is in `prisma/seed.sql` (admin + defaults) and `prisma/seed.demo.sql` (demo posts).
- Use `ON CONFLICT` / `INSERT OR IGNORE` in seeds to keep them idempotent.

## Conventions

- All pages use the `'use client'` directive.
- Guest users are identified by a `localStorage` author token (no login required).
- Admin login uses username/password stored in the `Admin` table.
- Dark theme: backgrounds use `#0a0a0a` (page) and `#181818` (cards/headers).
- UI language is Malay (Bahasa Melayu).
- Use `pnpm run deploy` (not `pnpm deploy`) to avoid pnpm's built-in deploy subcommand.
