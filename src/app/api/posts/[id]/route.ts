import { NextResponse } from 'next/server';
import { asBoolean, createTimestamp, getDb } from '@/lib/db';
import { canManageByOwnerOrAdmin, getAdminSession } from '@/lib/server-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PostRow {
  id: string;
  content: string;
  authorName: string;
  authorToken: string;
  isPinned: number | boolean;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

interface CommentRow {
  id: string;
  content: string;
  authorName: string;
  authorToken: string;
  postId: string;
  createdAt: string;
}

interface DeleteBody {
  authorToken?: string;
}

interface PinBody {
  isPinned?: boolean;
}

function mapPost(row: PostRow) {
  return {
    id: row.id,
    content: row.content,
    authorName: row.authorName,
    authorToken: row.authorToken,
    isPinned: asBoolean(row.isPinned),
    likes: Number(row.likes ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapComment(row: CommentRow) {
  return {
    id: row.id,
    content: row.content,
    authorName: row.authorName,
    authorToken: row.authorToken,
    postId: row.postId,
    createdAt: row.createdAt,
  };
}

export async function GET(_request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const db = getDb();

    const postRow = await db
      .prepare(
        `SELECT id, content, authorName, authorToken, isPinned, likes, createdAt, updatedAt
         FROM "Post"
         WHERE id = ?
         LIMIT 1`
      )
      .bind(id)
      .first<PostRow>();

    if (!postRow) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    const commentsResult = await db
      .prepare(
        `SELECT id, content, authorName, authorToken, postId, createdAt
         FROM "Comment"
         WHERE postId = ?
         ORDER BY createdAt ASC`
      )
      .bind(id)
      .all<CommentRow>();

    return NextResponse.json({
      item: mapPost(postRow),
      comments: (commentsResult.results ?? []).map(mapComment),
    });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch post.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as DeleteBody;
    const actorToken = body.authorToken?.trim() ?? '';
    const adminSession = await getAdminSession();

    const db = getDb();
    const post = await db
      .prepare(`SELECT id, authorToken FROM "Post" WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<{ id: string; authorToken: string }>();

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    const allowed = canManageByOwnerOrAdmin({
      actorToken,
      ownerToken: post.authorToken,
      isAdmin: Boolean(adminSession),
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed to delete this post.' }, { status: 403 });
    }

    await db.prepare(`DELETE FROM "Post" WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete post.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteParams) {
  try {
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as PinBody;
    const isPinned = Boolean(body.isPinned);

    const db = getDb();
    const updatedAt = createTimestamp();

    await db
      .prepare(`UPDATE "Post" SET isPinned = ?, updatedAt = ? WHERE id = ?`)
      .bind(isPinned ? 1 : 0, updatedAt, id)
      .run();

    return NextResponse.json({ success: true, isPinned });
  } catch {
    return NextResponse.json({ error: 'Unable to update post pin state.' }, { status: 500 });
  }
}
