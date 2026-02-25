import fs from 'fs';
import path from 'path';

const localD1Path = path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1');

if (fs.existsSync(localD1Path)) {
  fs.rmSync(localD1Path, { recursive: true, force: true });
  console.log(`[reset-local-d1] removed ${localD1Path}`);
} else {
  console.log(`[reset-local-d1] skipped (not found): ${localD1Path}`);
}
