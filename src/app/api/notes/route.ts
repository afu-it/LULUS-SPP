import { NextResponse } from 'next/server';
import {
  getRequestId,
  jsonError,
  readJsonBody,
  readOptionalUrl,
  readString,
} from '@/lib/api';
import { createId, createTimestamp, getDb } from '@/lib/db';
import { logApiError } from '@/lib/logging';

interface CreateNoteBody {
  title?: string;
  content?: string;
  link?: string;
  authorName?: string;
  authorToken?: string;
}

interface NoteRow {
  id: string;
  title: string;
  content: string;
  link: string | null;
  authorName: string;
  authorToken: string;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: NoteRow) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    link: row.link,
    authorName: row.authorName,
    authorToken: row.authorToken,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() ?? '';
    const keyword = `%${query}%`;

    const db = getDb();
    const rows = await db
      .prepare(
        `SELECT id, title, content, link, authorName, authorToken, createdAt, updatedAt
         FROM "Note"
         WHERE (? = '' OR title LIKE ? OR content LIKE ?)
         ORDER BY createdAt DESC`
      )
      .bind(query, keyword, keyword)
      .all<NoteRow>();

    return NextResponse.json({ items: (rows.results ?? []).map(mapRow) });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch notes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await readJsonBody<CreateNoteBody>(request);
    if (!body) {
      return jsonError('Invalid JSON body.', 400, { requestId });
    }

    const title = readString(body.title, {
      field: 'title',
      min: 1,
      max: 160,
    });

    if (title.error) {
      return jsonError(title.error, 400, { requestId });
    }

    const content = readString(body.content, {
      field: 'content',
      min: 1,
      max: 5000,
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

    const link = readOptionalUrl(body.link, 'link');
    if (link.error) {
      return jsonError(link.error, 400, { requestId });
    }

    const id = createId();
    const timestamp = createTimestamp();
    const normalizedAuthorName = authorName.value || 'Tetamu';
    const normalizedLink = link.value;

    const db = getDb();
    await db
      .prepare(
        `INSERT INTO "Note" (id, title, content, link, authorName, authorToken, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        title.value,
        content.value,
        normalizedLink,
        normalizedAuthorName,
        authorToken.value,
        timestamp,
        timestamp
      )
      .run();

    return NextResponse.json(
      {
        item: {
          id,
          title: title.value,
          content: content.value,
          link: normalizedLink,
          authorName: normalizedAuthorName,
          authorToken: authorToken.value,
          createdAt: timestamp,
          updatedAt: timestamp,
          requestId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logApiError({
      requestId,
      route: '/api/notes',
      method: 'POST',
      error,
      status: 500,
    });
    return jsonError('Unable to create note.', 500, { requestId });
  }
}
