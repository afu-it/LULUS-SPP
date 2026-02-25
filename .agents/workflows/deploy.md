---
description: How to deploy the LULUS SPP application to Cloudflare Pages
---

# Deploy to Cloudflare Pages

// turbo-all

1. Build and deploy the application:

```bash
pnpm run deploy
```

2. If there are new database migrations to apply on the remote D1 database:

```bash
pnpm run db:migrate:remote
```

3. If you need to re-seed the remote database (admin user, tip labels, bidang list):

```bash
wrangler d1 execute lulus-spp-db --remote --file=prisma/seed.sql
```

4. If you need to seed demo data on the remote database:

```bash
pnpm run seed:demo:remote
```

## Notes

- The deploy command runs: `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
- D1 database name: `lulus-spp-db` (ID: `6bfbbcfd-3e2a-473d-911d-e52dcb26468f`)
- Production URL: https://lulus-spp.pages.dev/
- Admin credentials: username `admin`, password `admin`
