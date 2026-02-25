import { NextResponse } from 'next/server';
import { createTimestamp, getDb } from '@/lib/db';
import { canManageByOwnerOrAdmin, getAdminSession } from '@/lib/server-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateSoalanBody {
  content?: string;
  bidangId?: string;
  authorToken?: string;
}

interface DeleteSoalanBody {
  authorToken?: string;
}

export async function PUT(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateSoalanBody;
    const content = body.content?.trim() ?? '';
    const bidangId = body.bidangId?.trim() ?? '';
    const actorToken = body.authorToken?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Soalan content is required.' }, { status: 400 });
    }

    if (!bidangId) {
      return NextResponse.json({ error: 'Bidang is required.' }, { status: 400 });
    }

    const db = getDb();
    const adminSession = await getAdminSession();

    const existing = await db
      .prepare(`SELECT id, authorToken FROM "Soalan" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string; authorToken: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Soalan not found.' }, { status: 404 });
    }

    const allowed = canManageByOwnerOrAdmin({
      actorToken,
      ownerToken: existing.authorToken,
      isAdmin: Boolean(adminSession),
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed to update this soalan.' }, { status: 403 });
    }

    const bidang = await db
      .prepare(`SELECT id FROM "Bidang" WHERE id = ? LIMIT 1`)
      .bind(bidangId)
      .first<{ id: string }>();

    if (!bidang) {
      return NextResponse.json({ error: 'Selected bidang does not exist.' }, { status: 400 });
    }

    const updatedAt = createTimestamp();
    await db
      .prepare(`UPDATE "Soalan" SET content = ?, bidangId = ?, updatedAt = ? WHERE id = ?`)
      .bind(content, bidangId, updatedAt, id)
      .run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to update soalan.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as DeleteSoalanBody;
    const actorToken = body.authorToken?.trim() ?? '';

    const db = getDb();
    const adminSession = await getAdminSession();

    const existing = await db
      .prepare(`SELECT id, authorToken FROM "Soalan" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string; authorToken: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Soalan not found.' }, { status: 404 });
    }

    const allowed = canManageByOwnerOrAdmin({
      actorToken,
      ownerToken: existing.authorToken,
      isAdmin: Boolean(adminSession),
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed to delete this soalan.' }, { status: 403 });
    }

    await db.prepare(`DELETE FROM "Soalan" WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete soalan.' }, { status: 500 });
  }
}
