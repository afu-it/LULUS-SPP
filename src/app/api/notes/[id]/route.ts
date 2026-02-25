import { NextResponse } from 'next/server';
import { createTimestamp, getDb } from '@/lib/db';
import { canManageByOwnerOrAdmin, getAdminSession } from '@/lib/server-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateNoteBody {
  title?: string;
  content?: string;
  link?: string;
  authorToken?: string;
}

interface DeleteNoteBody {
  authorToken?: string;
}

export async function PUT(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateNoteBody;

    const title = body.title?.trim() ?? '';
    const content = body.content?.trim() ?? '';
    const link = body.link?.trim() ?? '';
    const actorToken = body.authorToken?.trim() ?? '';

    if (!title) {
      return NextResponse.json({ error: 'Note title is required.' }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: 'Note content is required.' }, { status: 400 });
    }

    const adminSession = await getAdminSession();
    const db = getDb();

    const existing = await db
      .prepare(`SELECT id, authorToken FROM "Note" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string; authorToken: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }

    const allowed = canManageByOwnerOrAdmin({
      actorToken,
      ownerToken: existing.authorToken,
      isAdmin: Boolean(adminSession),
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed to update this note.' }, { status: 403 });
    }

    const updatedAt = createTimestamp();

    await db
      .prepare(`UPDATE "Note" SET title = ?, content = ?, link = ?, updatedAt = ? WHERE id = ?`)
      .bind(title, content, link || null, updatedAt, id)
      .run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to update note.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as DeleteNoteBody;
    const actorToken = body.authorToken?.trim() ?? '';

    const adminSession = await getAdminSession();
    const db = getDb();

    const existing = await db
      .prepare(`SELECT id, authorToken FROM "Note" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string; authorToken: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }

    const allowed = canManageByOwnerOrAdmin({
      actorToken,
      ownerToken: existing.authorToken,
      isAdmin: Boolean(adminSession),
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed to delete this note.' }, { status: 403 });
    }

    await db.prepare(`DELETE FROM "Note" WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete note.' }, { status: 500 });
  }
}
