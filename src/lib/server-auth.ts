import { cookies } from 'next/headers';
import { ADMIN_AUTH_COOKIE, verifyAdminToken } from '@/lib/auth';

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminToken(token);
}

export function canManageByOwnerOrAdmin(params: {
  actorToken?: string | null;
  ownerToken: string;
  isAdmin: boolean;
}) {
  if (params.isAdmin) {
    return true;
  }

  const actorToken = params.actorToken?.trim();
  return Boolean(actorToken && actorToken === params.ownerToken);
}
