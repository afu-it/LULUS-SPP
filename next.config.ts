import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Exclude @vercel/og (OG image generation) from the server bundle.
  // We are not using OG image routes and its resvg.wasm causes wrangler
  // wasm-module resolution failures on Windows in dev/preview mode.
  serverExternalPackages: ["@vercel/og"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
