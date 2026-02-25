// src/types/cloudflare.d.ts
// Cloudflare bindings used by this application.
// Run `pnpm cf-typegen` to regenerate from your wrangler.jsonc.

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET?: string;
}
