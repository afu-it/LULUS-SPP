import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const ADMIN_AUTH_COOKIE = 'lulus_spp_admin_token';
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7;

export interface AdminTokenPayload extends JWTPayload {
  role: 'admin';
  username: string;
}

function resolveJwtSecretValue(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  try {
    const { env } = getCloudflareContext();
    const jwtSecret = (env as unknown as { JWT_SECRET?: string }).JWT_SECRET;

    if (typeof jwtSecret === 'string' && jwtSecret.length > 0) {
      return jwtSecret;
    }
  } catch {
    // no-op: getCloudflareContext is request-scoped and can throw if accessed out of request
  }

  throw new Error('Missing JWT secret. Set JWT_SECRET in environment variables.');
}

function resolveJwtSecretKey() {
  return new TextEncoder().encode(resolveJwtSecretValue());
}

export async function createAdminToken(username: string) {
  const secretKey = resolveJwtSecretKey();

  return new SignJWT({ role: 'admin', username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_SECONDS}s`)
    .sign(secretKey);
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const secretKey = resolveJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (payload.role !== 'admin' || typeof payload.username !== 'string') {
      return null;
    }

    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function getAdminAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ADMIN_SESSION_SECONDS,
  };
}
