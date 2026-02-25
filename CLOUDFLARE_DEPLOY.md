# Deploy LULUS SPP to Cloudflare

This project deploys with OpenNext (`@opennextjs/cloudflare`) to Cloudflare Workers.

## 1) Prerequisites

- You are logged in to Cloudflare:

```bash
npx wrangler login
```

- D1 database already created and bound as `DB` in `wrangler.jsonc`.

## 2) Install dependencies

```bash
pnpm install
```

## 3) Generate Cloudflare env types

```bash
pnpm cf-typegen
```

## 4) Set production secrets

Set JWT secret (required for admin auth):

```bash
printf "%s" "<YOUR_STRONG_JWT_SECRET>" | npx wrangler secret put JWT_SECRET
```

## 5) Apply DB migrations (remote)

```bash
pnpm db:migrate:remote
```

## 6) Optional seed content

Base seed:

```bash
npx wrangler d1 execute lulus-spp-db --remote --file=prisma/seed.sql
```

Demo content:

```bash
pnpm seed:demo:remote
```

## 7) Build + deploy

```bash
pnpm deploy
```

## 8) Verify deployment

- App root: `https://<your-worker>.workers.dev/`
- Health endpoint: `https://<your-worker>.workers.dev/api/health`

## 9) Useful operational commands

- Live logs:

```bash
npx wrangler tail lulus-spp
```

- List deployments:

```bash
npx wrangler deployments
```

- Rollback:

```bash
npx wrangler rollback <VERSION_ID>
```
