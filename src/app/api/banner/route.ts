import { NextResponse } from 'next/server';
import { asBoolean, createId, createTimestamp, getDb } from '@/lib/db';
import { getAdminSession } from '@/lib/server-auth';

interface BannerRow {
  id: string;
  content: string;
  isActive: number | boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateBannerBody {
  content?: string;
}

function mapRow(row: BannerRow) {
  return {
    id: row.id,
    content: row.content,
    isActive: asBoolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// GET — return the latest active banner (one at a time)
export async function GET() {
  try {
    const db = getDb();
    const row = await db
      .prepare(
        `SELECT id, content, isActive, createdAt, updatedAt
         FROM "Banner"
         WHERE isActive = 1
         ORDER BY createdAt DESC
         LIMIT 1`
      )
      .first<BannerRow>();

    return NextResponse.json({ item: row ? mapRow(row) : null });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch banner.' }, { status: 500 });
  }
}

// POST — create a new banner (deactivates old ones)
export async function POST(request: Request) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = (await request.json()) as CreateBannerBody;
    const content = body.content?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Banner content is required.' }, { status: 400 });
    }

    const id = createId();
    const timestamp = createTimestamp();
    const db = getDb();

    // Deactivate previous banners
    await db.prepare(`UPDATE "Banner" SET isActive = 0, updatedAt = ?`).bind(timestamp).run();

    await db
      .prepare(
        `INSERT INTO "Banner" (id, content, isActive, createdAt, updatedAt)
         VALUES (?, ?, 1, ?, ?)`
      )
      .bind(id, content, timestamp, timestamp)
      .run();

    return NextResponse.json(
      { item: { id, content, isActive: true, createdAt: timestamp, updatedAt: timestamp } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create banner.' }, { status: 500 });
  }
}

// DELETE — deactivate a banner
export async function DELETE(request: Request) {
  try {
    const db = getDb();
    const body = (await request.json().catch(() => ({}))) as { id?: string };
    if (body.id) {
      await db.prepare(`UPDATE "Banner" SET isActive = 0 WHERE id = ?`).bind(body.id).run();
    } else {
      await db.prepare(`UPDATE "Banner" SET isActive = 0`).run();
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to dismiss banner.' }, { status: 500 });
  }
}
