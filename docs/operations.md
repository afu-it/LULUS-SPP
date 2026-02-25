# LULUS SPP Operations Runbook

## 1) Pre-deploy checks

```bash
pnpm build
npx tsc --noEmit
pnpm preview
```

## 2) Deploy

```bash
pnpm deploy
```

## 3) Live logs

```bash
npx wrangler tail lulus-spp
```

## 4) Rollback

List deployments:

```bash
npx wrangler deployments
```

Rollback to a previous version ID:

```bash
npx wrangler rollback <VERSION_ID>
```

## 5) Secret rotation

Rotate JWT secret:

```bash
printf "%s" "<NEW_SECRET>" | npx wrangler secret put JWT_SECRET
```

## 6) D1 backup and restore options

Create SQL backup:

```bash
npx wrangler d1 export lulus-spp-db --remote --output backups/lulus-spp-db-$(date +%Y%m%d-%H%M%S).sql
```

Restore from SQL backup:

```bash
npx wrangler d1 execute lulus-spp-db --remote --file backups/<backup-file>.sql
```

Time-travel restore/fork tools:

```bash
npx wrangler d1 time-travel --help
```

## 7) Seed commands

Base seed:

```bash
npx wrangler d1 execute lulus-spp-db --local --file=prisma/seed.sql
npx wrangler d1 execute lulus-spp-db --remote --file=prisma/seed.sql
```

Demo seed:

```bash
pnpm seed:demo:local
pnpm seed:demo:remote
```

## 8) Health check endpoint

```bash
curl -i https://lulus-spp.afuitdev.workers.dev/api/health
```
