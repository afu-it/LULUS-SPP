import { NextResponse } from 'next/server';
import { createId, createTimestamp, getDb } from '@/lib/db';

interface SoalanRow {
  id: string;
  content: string;
  bidangId: string;
  authorName: string;
  authorToken: string;
  sourceLink: string | null;
  createdAt: string;
  updatedAt: string;
  bidangName: string;
}

interface CreateSoalanBody {
  content?: string;
  bidangId?: string;
  authorName?: string;
  authorToken?: string;
  sourceLink?: string;
}

function mapRow(row: SoalanRow) {
  return {
    id: row.id,
    content: row.content,
    bidangId: row.bidangId,
    bidangName: row.bidangName,
    authorName: row.authorName,
    authorToken: row.authorToken,
    sourceLink: row.sourceLink ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bidangId = searchParams.get('bidangId')?.trim() ?? '';
    const db = getDb();

    const rows = await db
      .prepare(
        `SELECT
          s.id,
          s.content,
          s.bidangId,
          s.authorName,
          s.authorToken,
          s.sourceLink,
          s.createdAt,
          s.updatedAt,
          b.name AS bidangName
         FROM "Soalan" s
         JOIN "Bidang" b ON b.id = s.bidangId
         WHERE (? = '' OR s.bidangId = ?)
         ORDER BY s.createdAt DESC`
      )
      .bind(bidangId, bidangId)
      .all<SoalanRow>();

    return NextResponse.json({ items: (rows.results ?? []).map(mapRow) });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch soalan.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSoalanBody;
    const content = body.content?.trim() ?? '';
    const bidangId = body.bidangId?.trim() ?? '';
    const authorName = body.authorName?.trim() ?? '';
    const authorToken = body.authorToken?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Soalan content is required.' }, { status: 400 });
    }

    if (!bidangId) {
      return NextResponse.json({ error: 'Bidang is required.' }, { status: 400 });
    }

    if (!authorToken) {
      return NextResponse.json({ error: 'Author token is required.' }, { status: 400 });
    }

    const db = getDb();
    const bidang = await db
      .prepare(`SELECT id, name FROM "Bidang" WHERE id = ? LIMIT 1`)
      .bind(bidangId)
      .first<{ id: string; name: string }>();

    if (!bidang) {
      return NextResponse.json({ error: 'Selected bidang does not exist.' }, { status: 400 });
    }

    const sourceLink = body.sourceLink?.trim() || null;
    const id = createId();
    const timestamp = createTimestamp();
    const normalizedAuthorName = authorName || 'Tetamu';

    await db
      .prepare(
        `INSERT INTO "Soalan" (id, content, bidangId, authorName, authorToken, sourceLink, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, content, bidangId, normalizedAuthorName, authorToken, sourceLink, timestamp, timestamp)
      .run();

    return NextResponse.json(
      {
        item: {
          id,
          content,
          bidangId,
          bidangName: bidang.name,
          authorName: normalizedAuthorName,
          authorToken,
          sourceLink,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create soalan.' }, { status: 500 });
  }
}
