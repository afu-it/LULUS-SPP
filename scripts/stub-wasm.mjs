/**
 * scripts/stub-wasm.mjs
 *
 * Windows workaround for wrangler's wasm-module-collector plugin.
 *
 * PROBLEM: wrangler's esbuild plugin writes wasm modules to a temp directory
 * using the import specifier as part of the filename, including any query
 * string suffix. On Windows, filenames cannot contain `?`, so a path like
 *   `.wrangler/tmp/dev-xxx/hash-resvg.wasm?module`
 * causes ENOENT. Next.js 16's compiled @vercel/og has these imports:
 *   import resvg_wasm from "./resvg.wasm?module";
 *   import yoga_wasm from "./yoga.wasm?module";
 *
 * FIX (two-part):
 *  1. Patch next/dist/compiled/@vercel/og/index.edge.js to remove ?module
 *     from the wasm import specifiers (plain path works on all platforms).
 *  2. Ensure stub wasm files exist at those paths so the import resolves.
 *
 * Safe: this project has no OG image routes so @vercel/og is never called.
 * Run automatically as part of `pnpm preview` (and `pnpm deploy`).
 */
import fs from 'fs';
import path from 'path';

const cwd = process.cwd();

// Minimal valid wasm binary (8-byte header: magic + version)
const STUB_WASM = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
const WASM_FILES = ['resvg.wasm', 'yoga.wasm'];

const EMPTY_MIDDLEWARE_MANIFEST = `{
                version: 3,
                middleware: {},
                functions: {},
                sortedMiddleware: []
            }`;

// ── Collect all @vercel/og directories ───────────────────────────────────────
function findOgDirs() {
  const results = new Set();
  const nm = path.join(cwd, 'node_modules');

  // hoisted symlink
  const direct = path.join(nm, 'next/dist/compiled/@vercel/og');
  if (fs.existsSync(direct)) results.add(fs.realpathSync(direct));

  // pnpm virtual store entries
  const pnpmStore = path.join(nm, '.pnpm');
  if (fs.existsSync(pnpmStore)) {
    for (const entry of fs.readdirSync(pnpmStore)) {
      if (!entry.startsWith('next@')) continue;
      const d = path.join(pnpmStore, entry, 'node_modules/next/dist/compiled/@vercel/og');
      if (fs.existsSync(d)) results.add(fs.realpathSync(d));
    }
  }
  return [...results];
}

const ogDirs = findOgDirs();

function findNextServerFiles() {
  const results = new Set();
  const nm = path.join(cwd, 'node_modules');

  const direct = path.join(nm, 'next/dist/server/next-server.js');
  if (fs.existsSync(direct)) results.add(fs.realpathSync(direct));

  const pnpmStore = path.join(nm, '.pnpm');
  if (fs.existsSync(pnpmStore)) {
    for (const entry of fs.readdirSync(pnpmStore)) {
      if (!entry.startsWith('next@')) continue;
      const f = path.join(pnpmStore, entry, 'node_modules/next/dist/server/next-server.js');
      if (fs.existsSync(f)) results.add(fs.realpathSync(f));
    }
  }

  return [...results];
}

function patchMiddlewareManifestRequire(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');

  // Already patched
  if (src.includes('fall back to an empty middleware manifest')) {
    return false;
  }

  const pattern = /if \(this\.minimalMode\) \{\s*return null;\s*\} else \{\s*const manifest = require\(this\.middlewareManifestPath\);\s*return manifest;\s*\}/m;

  if (!pattern.test(src)) {
    return false;
  }

  const replacement = `if (this.minimalMode) {
            return ${EMPTY_MIDDLEWARE_MANIFEST};
        } else {
            try {
                const manifest = require(this.middlewareManifestPath);
                return manifest;
            } catch (err) {
                // fall back to an empty middleware manifest
                return ${EMPTY_MIDDLEWARE_MANIFEST};
            }
        }`;

  src = src.replace(pattern, replacement);
  fs.writeFileSync(filePath, src);
  return true;
}

// ── 1. Patch index.edge.js — remove ?module suffix from wasm imports ─────────
for (const dir of ogDirs) {
  const edgeJs = path.join(dir, 'index.edge.js');
  if (!fs.existsSync(edgeJs)) continue;
  let src = fs.readFileSync(edgeJs, 'utf8');
  if (!src.includes('?module')) {
    console.log(`[stub-wasm] already patched: ${edgeJs}`);
    continue;
  }
  src = src.replaceAll('./resvg.wasm?module', './resvg.wasm');
  src = src.replaceAll('./yoga.wasm?module', './yoga.wasm');
  fs.writeFileSync(edgeJs, src);
  console.log(`[stub-wasm] patched  ${edgeJs}`);
}

// ── 3. Patch Next server middleware manifest loader (Windows dev fix) ───────
for (const file of findNextServerFiles()) {
  const changed = patchMiddlewareManifestRequire(file);
  if (changed) {
    console.log(`[stub-wasm] patched  ${file}`);
  }
}

// ── 2. Ensure stub wasm files exist ──────────────────────────────────────────
for (const dir of ogDirs) {
  for (const f of WASM_FILES) {
    const dest = path.join(dir, f);
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, STUB_WASM);
      console.log(`[stub-wasm] created  ${dest}`);
    }
  }
}
