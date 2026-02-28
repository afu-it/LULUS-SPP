import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_AUTH_COOKIE = 'lulus_spp_admin_token';
const MAX_URL_LENGTH = 2048;
const MAX_QUERY_LENGTH = 1200;
const MAX_BODY_BYTES = 200_000;
const WINDOW_MS = 60_000;
const READ_LIMIT_PER_WINDOW = 120;
const WRITE_LIMIT_PER_WINDOW = 40;
const AUTH_LIMIT_PER_WINDOW = 20;
const SEARCH_LIMIT_PER_WINDOW = 45;
const BLOCK_MS = 5 * 60_000;
const GC_INTERVAL_MS = 30_000;
const SUSPICIOUS_UA_PATTERNS = ['python-requests', 'curl/', 'wget/', 'sqlmap', 'nmap', 'nikto'];

type RateLimitBucket = 'auth' | 'search' | 'read' | 'write';

interface RateLimitState {
  count: number;
  windowStartedAt: number;
  blockedUntil: number;
  lastSeenAt: number;
}

const requestCounters = new Map<string, RateLimitState>();
let lastGcAt = 0;

function getClientIp(request: NextRequest) {
  const directIp = request.headers.get('cf-connecting-ip')?.trim();

  if (directIp) {
    return directIp;
  }

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

function getRateLimitBucket(pathname: string, method: string): RateLimitBucket {
  if (pathname.startsWith('/api/auth')) {
    return 'auth';
  }

  if (pathname.startsWith('/api/search')) {
    return 'search';
  }

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return 'read';
  }

  return 'write';
}

function pruneRateLimitState(now: number) {
  if (now - lastGcAt < GC_INTERVAL_MS) {
    return;
  }

  lastGcAt = now;
  const staleBefore = now - Math.max(BLOCK_MS, WINDOW_MS) * 2;

  for (const [key, value] of requestCounters.entries()) {
    if (value.lastSeenAt < staleBefore && value.blockedUntil <= now) {
      requestCounters.delete(key);
    }
  }
}

function checkRateLimit(request: NextRequest) {
  const now = Date.now();
  pruneRateLimitState(now);

  const method = request.method.toUpperCase();
  const bucket = getRateLimitBucket(request.nextUrl.pathname, method);
  const ip = getClientIp(request).toLowerCase();
  const key = `${bucket}:${ip}`;
  const max =
    bucket === 'auth'
      ? AUTH_LIMIT_PER_WINDOW
      : bucket === 'search'
      ? SEARCH_LIMIT_PER_WINDOW
      : bucket === 'read'
      ? READ_LIMIT_PER_WINDOW
      : WRITE_LIMIT_PER_WINDOW;

  const existing = requestCounters.get(key);

  if (!existing) {
    requestCounters.set(key, {
      count: 1,
      windowStartedAt: now,
      blockedUntil: 0,
      lastSeenAt: now,
    });
    return null;
  }

  existing.lastSeenAt = now;

  if (existing.blockedUntil > now) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.blockedUntil - now) / 1000));
    return retryAfterSeconds;
  }

  if (now - existing.windowStartedAt > WINDOW_MS) {
    existing.windowStartedAt = now;
    existing.count = 1;
    existing.blockedUntil = 0;
    return null;
  }

  existing.count += 1;

  if (existing.count > max) {
    existing.blockedUntil = now + BLOCK_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil(BLOCK_MS / 1000));
    return retryAfterSeconds;
  }

  return null;
}

function isAdminProtectedApi(pathname: string, method: string) {
  if (pathname.startsWith('/api/announcements')) {
    return !(pathname === '/api/announcements' && method === 'GET');
  }

  if (pathname.startsWith('/api/bidang')) {
    return !(pathname === '/api/bidang' && method === 'GET');
  }

  if (pathname.startsWith('/api/cara-daftar')) {
    return !(pathname === '/api/cara-daftar' && method === 'GET');
  }

  if (pathname.startsWith('/api/labels')) {
    // /api/labels GET/POST remains public; /api/labels/[id] DELETE is admin
    return pathname !== '/api/labels';
  }

  return false;
}

function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}

function isSuspiciousUserAgent(userAgent: string, pathname: string, method: string) {
  if (!userAgent && (pathname.startsWith('/api/auth') || method !== 'GET')) {
    return true;
  }

  const normalized = userAgent.toLowerCase();
  return SUSPICIOUS_UA_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const userAgent = request.headers.get('user-agent')?.trim() ?? '';

  if (request.url.length > MAX_URL_LENGTH) {
    return NextResponse.json({ error: 'Request URL is too long.' }, { status: 414 });
  }

  if (request.nextUrl.search.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: 'Query string is too long.' }, { status: 400 });
  }

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    }
  }

  if (isSuspiciousUserAgent(userAgent, pathname, method)) {
    return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  }

  const retryAfterSeconds = checkRateLimit(request);
  if (retryAfterSeconds !== null) {
    return tooManyRequests(retryAfterSeconds);
  }

  if (!isAdminProtectedApi(pathname, method)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return unauthorized('Admin access required.');
  }

  // Full token verification remains in each API route. Middleware only acts as
  // a cheap prefilter for unauthenticated admin calls.
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
