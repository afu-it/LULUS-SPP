import { NextResponse } from 'next/server';
import { createTimestamp, getDb } from '@/lib/db';
import { getAdminSession } from '@/lib/server-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateAnnouncementBody {
  content?: string;
  isActive?: boolean;
}

export async function PUT(request: Request, context: RouteParams) {
  try {
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as UpdateAnnouncementBody;
    const content = body.content?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Announcement content is required.' }, { status: 400 });
    }

    const isActive = body.isActive !== false;
    const updatedAt = createTimestamp();
    const db = getDb();

    const existing = await db
      .prepare(`SELECT id FROM "Announcement" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found.' }, { status: 404 });
    }

    if (isActive) {
      await db.prepare(`UPDATE "Announcement" SET isActive = 0, updatedAt = ?`).bind(updatedAt).run();
    }

    await db
      .prepare(`UPDATE "Announcement" SET content = ?, isActive = ?, updatedAt = ? WHERE id = ?`)
      .bind(content, isActive ? 1 : 0, updatedAt, id)
      .run();

    return NextResponse.json({
      item: {
        id,
        content,
        isActive,
        updatedAt,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unable to update announcement.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  try {
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const db = getDb();
    await db.prepare(`DELETE FROM "Announcement" WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete announcement.' }, { status: 500 });
  }
}
