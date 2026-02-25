import { NextResponse } from 'next/server';
import { createId, getDb } from '@/lib/db';

interface LabelRow {
  id: string;
  name: string;
}

interface CreateLabelBody {
  name?: string;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .prepare(`SELECT id, name FROM "TipLabel" ORDER BY name ASC`)
      .all<LabelRow>();

    return NextResponse.json({ items: rows.results ?? [] });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch labels.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateLabelBody;
    const name = body.name?.trim() ?? '';

    if (!name) {
      return NextResponse.json({ error: 'Label name is required.' }, { status: 400 });
    }

    const db = getDb();
    const existing = await db
      .prepare(`SELECT id, name FROM "TipLabel" WHERE lower(name) = lower(?) LIMIT 1`)
      .bind(name)
      .first<LabelRow>();

    if (existing) {
      return NextResponse.json({ item: existing });
    }

    const id = createId();

    await db.prepare(`INSERT INTO "TipLabel" (id, name) VALUES (?, ?)`).bind(id, name).run();

    return NextResponse.json(
      {
        item: { id, name },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create label.' }, { status: 500 });
  }
}
