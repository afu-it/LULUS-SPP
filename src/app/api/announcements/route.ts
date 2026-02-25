import { NextResponse } from 'next/server';
import { asBoolean, createId, createTimestamp, getDb } from '@/lib/db';
import { getAdminSession } from '@/lib/server-auth';

interface AnnouncementRow {
  id: string;
  content: string;
  isActive: number | boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateAnnouncementBody {
  content?: string;
  isActive?: boolean;
}

function mapRow(row: AnnouncementRow) {
  return {
    id: row.id,
    content: row.content,
    isActive: asBoolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// GET — return all active announcements (newest first), plus legacy `item` for backwards compat
export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .prepare(
        `SELECT id, content, isActive, createdAt, updatedAt
         FROM "Announcement"
         WHERE isActive = 1
         ORDER BY createdAt DESC`
      )
      .all<AnnouncementRow>();

    const items = (rows.results ?? []).map(mapRow);
    return NextResponse.json({ items, item: items[0] ?? null });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch announcements.' }, { status: 500 });
  }
}

// POST — create a new announcement (does NOT deactivate old ones anymore)
export async function POST(request: Request) {
  try {
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = (await request.json()) as CreateAnnouncementBody;
    const content = body.content?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Announcement content is required.' }, { status: 400 });
    }

    const isActive = body.isActive !== false;
    const id = createId();
    const timestamp = createTimestamp();
    const db = getDb();

    await db
      .prepare(
        `INSERT INTO "Announcement" (id, content, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(id, content, isActive ? 1 : 0, timestamp, timestamp)
      .run();

    return NextResponse.json(
      {
        item: {
          id,
          content,
          isActive,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create announcement.' }, { status: 500 });
  }
}
