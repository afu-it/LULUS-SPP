import { NextResponse } from 'next/server';
import { createTimestamp, getDb } from '@/lib/db';
import { getAdminSession } from '@/lib/server-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateStepBody {
  stepNo?: number;
  title?: string;
  content?: string;
  linkUrl?: string;
}

export async function PUT(request: Request, context: RouteParams) {
  try {
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as UpdateStepBody;
    const stepNo = Number(body.stepNo);
    const title = body.title?.trim() ?? '';
    const content = body.content?.trim() ?? '';
    const linkUrl = body.linkUrl?.trim() ?? '';

    if (!Number.isFinite(stepNo) || stepNo <= 0) {
      return NextResponse.json({ error: 'Valid step number is required.' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Step title is required.' }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: 'Step content is required.' }, { status: 400 });
    }

    const db = getDb();
    const existing = await db
      .prepare(`SELECT id FROM "CaraDaftarStep" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Step not found.' }, { status: 404 });
    }

    const updatedAt = createTimestamp();

    await db
      .prepare(
        `UPDATE "CaraDaftarStep"
         SET stepNo = ?, title = ?, content = ?, linkUrl = ?, updatedAt = ?
         WHERE id = ?`
      )
      .bind(stepNo, title, content, linkUrl || null, updatedAt, id)
      .run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to update step.' }, { status: 500 });
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
    await db.prepare(`DELETE FROM "CaraDaftarStep" WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete step.' }, { status: 500 });
  }
}
