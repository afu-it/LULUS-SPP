import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_AUTH_COOKIE = 'lulus_spp_admin_token';

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

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
