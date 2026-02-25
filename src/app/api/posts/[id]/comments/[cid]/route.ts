import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { canManageByOwnerOrAdmin, getAdminSession } from '@/lib/server-auth';

interface RouteParams {
  params: Promise<{ id: string; cid: string }>;
}

interface DeleteCommentBody {
  authorToken?: string;
}

export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id: postId, cid } = await context.params;
    const body = (await request.json().catch(() => ({}))) as DeleteCommentBody;
    const actorToken = body.authorToken?.trim() ?? '';
    const adminSession = await getAdminSession();
    const db = getDb();

    const comment = await db
      .prepare(
        `SELECT id, postId, authorToken
         FROM "Comment"
         WHERE id = ? AND postId = ?
         LIMIT 1`
      )
      .bind(cid, postId)
      .first<{ id: string; postId: string; authorToken: string }>();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    }

    const allowed = canManageByOwnerOrAdmin({
      actorToken,
      ownerToken: comment.authorToken,
      isAdmin: Boolean(adminSession),
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed to delete this comment.' }, { status: 403 });
    }

    await db.prepare(`DELETE FROM "Comment" WHERE id = ?`).bind(cid).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete comment.' }, { status: 500 });
  }
}
