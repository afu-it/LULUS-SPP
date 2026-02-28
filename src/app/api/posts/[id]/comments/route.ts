import { NextResponse } from 'next/server';
import { createId, createTimestamp, getDb } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface CommentRow {
  id: string;
  content: string;
  authorName: string;
  authorToken: string;
  postId: string;
  createdAt: string;
}

interface CreateCommentBody {
  content?: string;
  authorName?: string;
  authorToken?: string;
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

export async function GET(request: Request, context: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get('limit') ?? 50);
    const rawOffset = Number(searchParams.get('offset') ?? 0);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;
    const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

    const { id: postId } = await context.params;
    const db = getDb();

    const rows = await db
      .prepare(
        `SELECT id, content, authorName, authorToken, postId, createdAt
         FROM "Comment"
         WHERE postId = ?
         ORDER BY createdAt ASC
         LIMIT ? OFFSET ?`
      )
      .bind(postId, limit + 1, offset)
      .all<CommentRow>();

    const allItems = (rows.results ?? []).map(mapComment);
    const hasMore = allItems.length > limit;
    const items = hasMore ? allItems.slice(0, limit) : allItems;

    return NextResponse.json({
      items,
      pagination: {
        offset,
        limit,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch comments.' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteParams) {
  try {
    const { id: postId } = await context.params;
    const body = (await request.json()) as CreateCommentBody;

    const content = body.content?.trim() ?? '';
    const authorName = body.authorName?.trim() ?? '';
    const authorToken = body.authorToken?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Comment content is required.' }, { status: 400 });
    }

    if (!authorToken) {
      return NextResponse.json({ error: 'Author token is required.' }, { status: 400 });
    }

    const db = getDb();
    const postExists = await db
      .prepare(`SELECT id FROM "Post" WHERE id = ? LIMIT 1`)
      .bind(postId)
      .first<{ id: string }>();

    if (!postExists) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    const id = createId();
    const createdAt = createTimestamp();
    const normalizedAuthorName = authorName || 'Tetamu';

    await db
      .prepare(
        `INSERT INTO "Comment" (id, content, authorName, authorToken, postId, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, content, normalizedAuthorName, authorToken, postId, createdAt)
      .run();

    return NextResponse.json(
      {
        item: {
          id,
          content,
          authorName: normalizedAuthorName,
          authorToken,
          postId,
          createdAt,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create comment.' }, { status: 500 });
  }
}
