import { NextResponse } from 'next/server';
import { getRequestId, jsonError, readJsonBody, readString } from '@/lib/api';
import { asBoolean, createId, createTimestamp, getDb } from '@/lib/db';
import { logApiError } from '@/lib/logging';

interface CreatePostBody {
  content?: string;
  authorName?: string;
  authorToken?: string;
  sourceLink?: string;
  isAdminPost?: boolean;
}

interface PostRow {
  id: string;
  content: string;
  authorName: string;
  authorToken: string;
  isPinned: number | boolean;
  likes: number;
  reposts: number;
  sourceLink: string | null;
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
  topCommentId: string | null;
  topCommentContent: string | null;
  topCommentAuthorName: string | null;
  topCommentAuthorToken: string | null;
  topCommentCreatedAt: string | null;
}

function mapPostRow(row: PostRow) {
  const topComment = row.topCommentId
    ? {
        id: row.topCommentId,
        content: row.topCommentContent ?? '',
        authorName: row.topCommentAuthorName ?? 'Tetamu',
        authorToken: row.topCommentAuthorToken ?? '',
        postId: row.id,
        createdAt: row.topCommentCreatedAt ?? row.createdAt,
      }
    : null;

  return {
    id: row.id,
    content: row.content,
    authorName: row.authorName,
    authorToken: row.authorToken,
    isPinned: asBoolean(row.isPinned),
    likes: Number(row.likes ?? 0),
    reposts: Number(row.reposts ?? 0),
    commentsCount: Number(row.commentsCount ?? 0),
    topComment,
    sourceLink: row.sourceLink ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get('limit') ?? 10);
    const rawOffset = Number(searchParams.get('offset') ?? 0);

    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 30) : 10;
    const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

    const db = getDb();
    const rows = await db
      .prepare(
        `SELECT
          p.id,
          p.content,
          p.authorName,
          p.authorToken,
          p.isPinned,
          p.likes,
          p.reposts,
          p.sourceLink,
          p.createdAt,
          p.updatedAt,
          c_first.id AS topCommentId,
          c_first.content AS topCommentContent,
          c_first.authorName AS topCommentAuthorName,
          c_first.authorToken AS topCommentAuthorToken,
          c_first.createdAt AS topCommentCreatedAt,
          (
            SELECT COUNT(1)
            FROM "Comment" c_count
            WHERE c_count.postId = p.id
          ) AS topCommentCreatedAt
         FROM "Post" p
         LEFT JOIN "Comment" c_first ON c_first.id = (
           SELECT c_top.id
           FROM "Comment" c_top
           WHERE c_top.postId = p.id
           ORDER BY c_top.createdAt ASC
           LIMIT 1
         )
         ORDER BY p.isPinned DESC, p.createdAt DESC
         LIMIT ? OFFSET ?`
      )
      .bind(limit + 1, offset)
      .all<PostRow>();

    const allItems = (rows.results ?? []).map(mapPostRow);
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
    return NextResponse.json({ error: 'Unable to fetch posts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await readJsonBody<CreatePostBody>(request);

    if (!body) {
      return jsonError('Invalid JSON body.', 400, { requestId });
    }

    const content = readString(body.content, {
      field: 'content',
      min: 1,
      max: 1500,
    });

    if (content.error) {
      return jsonError(content.error, 400, { requestId });
    }

    const authorName = readString(body.authorName ?? 'Tetamu', {
      field: 'authorName',
      max: 80,
      allowEmpty: true,
    });

    if (authorName.error) {
      return jsonError(authorName.error, 400, { requestId });
    }

    const authorToken = readString(body.authorToken, {
      field: 'authorToken',
      min: 8,
      max: 128,
    });

    if (authorToken.error) {
      return jsonError(authorToken.error, 400, { requestId });
    }

    const sourceLink = (body.sourceLink ?? '').trim() || null;
    const id = createId();
    const createdAt = createTimestamp();
    const normalizedAuthorName = authorName.value || 'Tetamu';

    const db = getDb();
    await db
      .prepare(
        `INSERT INTO "Post" (id, content, authorName, authorToken, isPinned, likes, reposts, sourceLink, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, ?)`
      )
      .bind(id, content.value, normalizedAuthorName, authorToken.value, sourceLink, createdAt, createdAt)
      .run();

    return NextResponse.json(
      {
        item: {
          id,
          content: content.value,
          authorName: normalizedAuthorName,
          authorToken: authorToken.value,
          isPinned: false,
          likes: 0,
          reposts: 0,
          commentsCount: 0,
          sourceLink,
          createdAt,
          updatedAt: createdAt,
          requestId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logApiError({
      requestId,
      route: '/api/posts',
      method: 'POST',
      error,
      status: 500,
    });
    return jsonError('Unable to create post.', 500, { requestId });
  }
}
