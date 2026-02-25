import { NextResponse } from 'next/server';
import { createId, createTimestamp, getDb } from '@/lib/db';
import {
  normalizeLabelIds,
  normalizeLabelNames,
  parseSerializedLabels,
  resolveTipLabels,
} from '@/lib/tips-data';

interface TipRow {
  id: string;
  content: string;
  authorName: string;
  authorToken: string;
  sourceLink: string | null;
  createdAt: string;
  updatedAt: string;
  labelsSerialized: string | null;
}

interface CreateTipBody {
  content?: string;
  authorName?: string;
  authorToken?: string;
  sourceLink?: string;
  labelIds?: unknown;
  newLabels?: unknown;
}

function mapRow(row: TipRow) {
  return {
    id: row.id,
    content: row.content,
    authorName: row.authorName,
    authorToken: row.authorToken,
    sourceLink: row.sourceLink ?? null,
    labels: parseSerializedLabels(row.labelsSerialized),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const labelId = searchParams.get('labelId')?.trim() ?? '';
    const db = getDb();

    const rows = await db
      .prepare(
        `SELECT
          t.id,
          t.content,
          t.authorName,
          t.authorToken,
          t.sourceLink,
          t.createdAt,
          t.updatedAt,
          GROUP_CONCAT(l.id || '::' || l.name, '||') AS labelsSerialized
         FROM "Tip" t
         LEFT JOIN "TipToLabel" tl ON tl.tipId = t.id
         LEFT JOIN "TipLabel" l ON l.id = tl.labelId
         WHERE (? = '' OR EXISTS (
           SELECT 1 FROM "TipToLabel" filterTl
           WHERE filterTl.tipId = t.id AND filterTl.labelId = ?
         ))
         GROUP BY t.id
         ORDER BY t.createdAt DESC`
      )
      .bind(labelId, labelId)
      .all<TipRow>();

    return NextResponse.json({ items: (rows.results ?? []).map(mapRow) });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch tips.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateTipBody;
    const content = body.content?.trim() ?? '';
    const authorName = body.authorName?.trim() ?? '';
    const authorToken = body.authorToken?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Tip content is required.' }, { status: 400 });
    }

    if (!authorToken) {
      return NextResponse.json({ error: 'Author token is required.' }, { status: 400 });
    }

    const sourceLink = body.sourceLink?.trim() || null;
    const labelIds = normalizeLabelIds(body.labelIds);
    const newLabels = normalizeLabelNames(body.newLabels);
    const id = createId();
    const timestamp = createTimestamp();
    const normalizedAuthorName = authorName || 'Tetamu';
    const db = getDb();

    await db
      .prepare(
        `INSERT INTO "Tip" (id, content, authorName, authorToken, sourceLink, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, content, normalizedAuthorName, authorToken, sourceLink, timestamp, timestamp)
      .run();

    const labels = await resolveTipLabels({ db, labelIds, newLabels });

    for (const label of labels) {
      await db
        .prepare(`INSERT INTO "TipToLabel" (tipId, labelId) VALUES (?, ?)`)
        .bind(id, label.id)
        .run();
    }

    return NextResponse.json(
      {
        item: {
          id,
          content,
          authorName: normalizedAuthorName,
          authorToken,
          sourceLink,
          labels,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create tip.' }, { status: 500 });
  }
}
