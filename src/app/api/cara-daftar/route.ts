import { NextResponse } from 'next/server';
import { createId, createTimestamp, getDb } from '@/lib/db';
import { getAdminSession } from '@/lib/server-auth';

interface StepRow {
  id: string;
  stepNo: number;
  title: string;
  content: string;
  linkUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateStepBody {
  stepNo?: number;
  title?: string;
  content?: string;
  linkUrl?: string;
}

function mapStep(row: StepRow) {
  return {
    id: row.id,
    stepNo: Number(row.stepNo),
    title: row.title,
    content: row.content,
    linkUrl: row.linkUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .prepare(
        `SELECT id, stepNo, title, content, linkUrl, createdAt, updatedAt
         FROM "CaraDaftarStep"
         ORDER BY stepNo ASC, createdAt ASC`
      )
      .all<StepRow>();

    return NextResponse.json({ items: (rows.results ?? []).map(mapStep) });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch cara daftar steps.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = (await request.json()) as CreateStepBody;
    const stepNo = Number(body.stepNo);
    const title = body.title?.trim() ?? '';
    const content = body.content?.trim() ?? '';
    const linkUrl = body.linkUrl?.trim() ?? '';

    if (!Number.isFinite(stepNo) || stepNo <= 0) {
      return NextResponse.json({ error: 'Valid step number is required.' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Step title is required.' }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: 'Step content is required.' }, { status: 400 });
    }

    const id = createId();
    const timestamp = createTimestamp();
    const db = getDb();

    await db
      .prepare(
        `INSERT INTO "CaraDaftarStep" (id, stepNo, title, content, linkUrl, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, stepNo, title, content, linkUrl || null, timestamp, timestamp)
      .run();

    return NextResponse.json(
      {
        item: {
          id,
          stepNo,
          title,
          content,
          linkUrl: linkUrl || null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create cara daftar step.' }, { status: 500 });
  }
}
