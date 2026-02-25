import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

// Force webpack build for OpenNext on Windows; Turbopack output currently
// triggers runtime issues in wrangler preview (`middleware-manifest.json`
// dynamic require in worker bundle).
config.buildCommand = "pnpm build:webpack";

export default config;
