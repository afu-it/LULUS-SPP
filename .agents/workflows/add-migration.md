---
description: How to add a new database migration
---

# Add a New Database Migration

1. Create a new SQL migration file in `prisma/migrations/` with the next sequence number:
   - Naming convention: `NNNN_description.sql` (e.g., `0005_add_user_profiles.sql`)

2. Write your DDL statements in the file. Use `IF NOT EXISTS` where possible to make migrations idempotent.

3. Add the migration to the `db:migrate:local` and `db:migrate:remote` scripts in `package.json`:
   - Append `&& wrangler d1 execute lulus-spp-db --local --file=prisma/migrations/NNNN_description.sql` to `db:migrate:local`
   - Append `&& wrangler d1 execute lulus-spp-db --remote --file=prisma/migrations/NNNN_description.sql` to `db:migrate:remote`

4. Update `prisma/schema.prisma` if adding/modifying models.

5. Run the migration locally:

```bash
pnpm run db:migrate:local
```

6. Test locally, then apply to remote before deploying:

```bash
pnpm run db:migrate:remote
```
