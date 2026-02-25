// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Use in API route handlers (request-time, synchronous context access).
 */
export function getPrisma() {
  const { env } = getCloudflareContext();
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
}

/**
 * Use in SSG / ISR contexts where the Cloudflare context must be awaited.
 */
export async function getPrismaAsync() {
  const { env } = await getCloudflareContext({ async: true });
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
}
