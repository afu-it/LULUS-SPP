import { NextResponse } from 'next/server';
import { createTimestamp, getDb } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RepostBody {
  action?: 'repost' | 'unrepost';
}

export async function POST(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const updatedAt = createTimestamp();
    const body = (await request.json().catch(() => ({}))) as RepostBody;
    const action = body.action === 'unrepost' ? 'unrepost' : 'repost';

    const db = getDb();

    const existing = await db
      .prepare(`SELECT id FROM "Post" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    await db
      .prepare(
        `UPDATE "Post"
         SET reposts = CASE
            WHEN ? = 'unrepost' THEN CASE WHEN reposts > 0 THEN reposts - 1 ELSE 0 END
            ELSE reposts + 1
         END,
         updatedAt = ?
         WHERE id = ?`
      )
      .bind(action, updatedAt, id)
      .run();

    const row = await db
      .prepare(`SELECT reposts FROM "Post" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ reposts: number }>();

    return NextResponse.json({ reposts: Number(row?.reposts ?? 0) });
  } catch {
    return NextResponse.json({ error: 'Unable to update repost state.' }, { status: 500 });
  }
}
