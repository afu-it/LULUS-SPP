import { NextResponse } from 'next/server';
import { createTimestamp, getDb } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface LikeBody {
  action?: 'like' | 'unlike';
}

export async function POST(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as LikeBody;
    const action = body.action === 'unlike' ? 'unlike' : 'like';
    const updatedAt = createTimestamp();

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
         SET likes = CASE
            WHEN ? = 'unlike' THEN CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END
            ELSE likes + 1
         END,
         updatedAt = ?
         WHERE id = ?`
      )
      .bind(action, updatedAt, id)
      .run();

    const row = await db
      .prepare(`SELECT likes FROM "Post" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ likes: number }>();

    return NextResponse.json({ likes: Number(row?.likes ?? 0) });
  } catch {
    return NextResponse.json({ error: 'Unable to update like state.' }, { status: 500 });
  }
}
