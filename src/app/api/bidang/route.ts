import { NextResponse } from 'next/server';
import { createId, getDb } from '@/lib/db';
import { getAdminSession } from '@/lib/server-auth';

interface BidangRow {
  id: string;
  name: string;
}

interface CreateBidangBody {
  name?: string;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.prepare(`SELECT id, name FROM "Bidang" ORDER BY name ASC`).all<BidangRow>();

    return NextResponse.json({ items: rows.results ?? [] });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch bidang list.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = (await request.json()) as CreateBidangBody;
    const name = body.name?.trim() ?? '';

    if (!name) {
      return NextResponse.json({ error: 'Bidang name is required.' }, { status: 400 });
    }

    const db = getDb();
    const existing = await db
      .prepare(`SELECT id, name FROM "Bidang" WHERE lower(name) = lower(?) LIMIT 1`)
      .bind(name)
      .first<BidangRow>();

    if (existing) {
      return NextResponse.json({ item: existing });
    }

    const id = createId();
    await db.prepare(`INSERT INTO "Bidang" (id, name) VALUES (?, ?)`).bind(id, name).run();

    return NextResponse.json({ item: { id, name } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to create bidang.' }, { status: 500 });
  }
}
