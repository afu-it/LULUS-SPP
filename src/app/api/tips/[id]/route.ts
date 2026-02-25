import { NextResponse } from 'next/server';
import { createTimestamp, getDb } from '@/lib/db';
import { canManageByOwnerOrAdmin, getAdminSession } from '@/lib/server-auth';
import { normalizeLabelIds, normalizeLabelNames, resolveTipLabels } from '@/lib/tips-data';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateTipBody {
  content?: string;
  authorToken?: string;
  labelIds?: unknown;
  newLabels?: unknown;
}

interface DeleteTipBody {
  authorToken?: string;
}

export async function PUT(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateTipBody;
    const content = body.content?.trim() ?? '';
    const actorToken = body.authorToken?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Tip content is required.' }, { status: 400 });
    }

    const adminSession = await getAdminSession();
    const db = getDb();
    const existing = await db
      .prepare(`SELECT id, authorToken FROM "Tip" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string; authorToken: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Tip not found.' }, { status: 404 });
    }

    const allowed = canManageByOwnerOrAdmin({
      actorToken,
      ownerToken: existing.authorToken,
      isAdmin: Boolean(adminSession),
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed to update this tip.' }, { status: 403 });
    }

    const updatedAt = createTimestamp();

    await db.prepare(`UPDATE "Tip" SET content = ?, updatedAt = ? WHERE id = ?`).bind(content, updatedAt, id).run();

    const hasLabelPayload = body.labelIds !== undefined || body.newLabels !== undefined;

    if (hasLabelPayload) {
      const labelIds = normalizeLabelIds(body.labelIds);
      const newLabels = normalizeLabelNames(body.newLabels);
      const labels = await resolveTipLabels({ db, labelIds, newLabels });

      await db.prepare(`DELETE FROM "TipToLabel" WHERE tipId = ?`).bind(id).run();

      for (const label of labels) {
        await db
          .prepare(`INSERT INTO "TipToLabel" (tipId, labelId) VALUES (?, ?)`)
          .bind(id, label.id)
          .run();
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to update tip.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as DeleteTipBody;
    const actorToken = body.authorToken?.trim() ?? '';

    const adminSession = await getAdminSession();
    const db = getDb();

    const existing = await db
      .prepare(`SELECT id, authorToken FROM "Tip" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string; authorToken: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Tip not found.' }, { status: 404 });
    }

    const allowed = canManageByOwnerOrAdmin({
      actorToken,
      ownerToken: existing.authorToken,
      isAdmin: Boolean(adminSession),
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed to delete this tip.' }, { status: 403 });
    }

    await db.prepare(`DELETE FROM "Tip" WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete tip.' }, { status: 500 });
  }
}
