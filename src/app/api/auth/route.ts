import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  getRequestId,
  jsonError,
  jsonOk,
  readJsonBody,
  readString,
} from '@/lib/api';
import {
  ADMIN_AUTH_COOKIE,
  createAdminToken,
  getAdminAuthCookieOptions,
  verifyAdminToken,
} from '@/lib/auth';
import { getDb } from '@/lib/db';
import { logApiError } from '@/lib/logging';

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_FAILURES = 5;
const AUTH_BLOCK_MS = 15 * 60 * 1000;

interface LoginBody {
  username?: string;
  password?: string;
}

interface AdminRow {
  username: string;
  passwordHash: string;
}

interface AuthRateLimitRow {
  key: string;
  failCount: number;
  windowStartedAt: number;
  blockedUntil: number | null;
  updatedAt: number;
}

function getClientIp(request: Request) {
  const directIp = request.headers.get('cf-connecting-ip')?.trim();
  if (directIp) {
    return directIp;
  }

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

function makeRateLimitKey(request: Request, username: string) {
  const ip = getClientIp(request).toLowerCase();
  return `${ip}:${username.toLowerCase()}`;
}

async function findAdminByUsername(username: string) {
  const db = getDb();
  return db
    .prepare('SELECT username, passwordHash FROM Admin WHERE username = ? LIMIT 1')
    .bind(username)
    .first<AdminRow>();
}

function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_AUTH_COOKIE, '', {
    ...getAdminAuthCookieOptions(),
    maxAge: 0,
  });
}

async function getRateLimitRow(rateKey: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT key, failCount, windowStartedAt, blockedUntil, updatedAt
       FROM "AuthRateLimit"
       WHERE key = ?
       LIMIT 1`
    )
    .bind(rateKey)
    .first<AuthRateLimitRow>();
}

async function ensureRateLimitWindow(rateKey: string, now: number, existing: AuthRateLimitRow | null) {
  const db = getDb();

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO "AuthRateLimit" (key, failCount, windowStartedAt, blockedUntil, updatedAt)
         VALUES (?, 0, ?, NULL, ?)`
      )
      .bind(rateKey, now, now)
      .run();

    return {
      key: rateKey,
      failCount: 0,
      windowStartedAt: now,
      blockedUntil: null,
      updatedAt: now,
    } as AuthRateLimitRow;
  }

  if (now - Number(existing.windowStartedAt) <= AUTH_WINDOW_MS) {
    return {
      ...existing,
      failCount: Number(existing.failCount),
      windowStartedAt: Number(existing.windowStartedAt),
      blockedUntil: existing.blockedUntil === null ? null : Number(existing.blockedUntil),
      updatedAt: Number(existing.updatedAt),
    } as AuthRateLimitRow;
  }

  await db
    .prepare(
      `UPDATE "AuthRateLimit"
       SET failCount = 0,
           windowStartedAt = ?,
           blockedUntil = NULL,
           updatedAt = ?
       WHERE key = ?`
    )
    .bind(now, now, rateKey)
    .run();

  return {
    key: rateKey,
    failCount: 0,
    windowStartedAt: now,
    blockedUntil: null,
    updatedAt: now,
  } as AuthRateLimitRow;
}

async function recordFailedLoginAttempt(rateKey: string, row: AuthRateLimitRow, now: number) {
  const db = getDb();
  const nextFailCount = Number(row.failCount) + 1;
  const shouldBlock = nextFailCount >= AUTH_MAX_FAILURES;
  const blockedUntil = shouldBlock ? now + AUTH_BLOCK_MS : null;

  await db
    .prepare(
      `UPDATE "AuthRateLimit"
       SET failCount = ?, blockedUntil = ?, updatedAt = ?
       WHERE key = ?`
    )
    .bind(nextFailCount, blockedUntil, now, rateKey)
    .run();

  return {
    failCount: nextFailCount,
    blockedUntil,
  };
}

async function clearRateLimit(rateKey: string) {
  const db = getDb();
  await db.prepare(`DELETE FROM "AuthRateLimit" WHERE key = ?`).bind(rateKey).run();
}

async function cleanStaleRateLimitRows(now: number) {
  const db = getDb();
  const staleBefore = now - 24 * 60 * 60 * 1000;
  await db.prepare(`DELETE FROM "AuthRateLimit" WHERE updatedAt < ?`).bind(staleBefore).run();
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await readJsonBody<LoginBody>(request);

    if (!body) {
      return jsonError('Invalid JSON body.', 400, { requestId });
    }

    const username = readString(body.username, {
      field: 'username',
      min: 1,
      max: 64,
    });

    if (username.error) {
      return jsonError(username.error, 400, { requestId });
    }

    if (typeof body.password !== 'string' || body.password.length === 0) {
      return jsonError('password is required.', 400, { requestId });
    }

    if (body.password.length > 200) {
      return jsonError('password must be at most 200 characters.', 400, { requestId });
    }

    const now = Date.now();
    const rateKey = makeRateLimitKey(request, username.value);

    const existingRateRow = await getRateLimitRow(rateKey);
    const rateRow = await ensureRateLimitWindow(rateKey, now, existingRateRow);

    if (rateRow.blockedUntil && now < rateRow.blockedUntil) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateRow.blockedUntil - now) / 1000));
      return jsonError('Too many login attempts. Please try again later.', 429, {
        requestId,
        retryAfterSeconds,
      });
    }

    const admin = await findAdminByUsername(username.value);
    const { compareSync } = await import('bcrypt-edge');

    if (!admin || !compareSync(body.password, admin.passwordHash)) {
      const result = await recordFailedLoginAttempt(rateKey, rateRow, now);
      const retryAfterSeconds = result.blockedUntil
        ? Math.max(1, Math.ceil((result.blockedUntil - now) / 1000))
        : undefined;

      return jsonError('Invalid username or password.', 401, {
        requestId,
        retryAfterSeconds,
      });
    }

    await clearRateLimit(rateKey);
    await cleanStaleRateLimitRows(now);

    const token = await createAdminToken(admin.username);

    const response = jsonOk({
      authenticated: true,
      username: admin.username,
      requestId,
    });

    response.cookies.set(ADMIN_AUTH_COOKIE, token, getAdminAuthCookieOptions());

    return response;
  } catch (error) {
    logApiError({
      requestId,
      route: '/api/auth',
      method: 'POST',
      error,
      status: 500,
    });

    return jsonError('Unable to complete login request.', 500, { requestId });
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_AUTH_COOKIE)?.value;

    if (!token) {
      return jsonOk({ authenticated: false, requestId }, 401);
    }

    const payload = await verifyAdminToken(token);

    if (!payload) {
      const response = jsonOk({ authenticated: false, requestId }, 401);
      clearAdminCookie(response);
      return response;
    }

    const admin = await findAdminByUsername(payload.username);

    if (!admin) {
      const response = jsonOk({ authenticated: false, requestId }, 401);
      clearAdminCookie(response);
      return response;
    }

    return jsonOk({ authenticated: true, username: admin.username, requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: '/api/auth',
      method: 'GET',
      error,
      status: 500,
    });

    return jsonError('Unable to verify admin session.', 500, { requestId });
  }
}

export async function DELETE(request: Request) {
  const requestId = getRequestId(request);
  const response = jsonOk({ authenticated: false, requestId });
  clearAdminCookie(response);
  return response;
}
