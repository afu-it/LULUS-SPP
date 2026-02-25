import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminSession } from '@/lib/server-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteParams) {
  try {
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const db = getDb();

    const usage = await db
      .prepare(`SELECT COUNT(*) AS count FROM "Soalan" WHERE bidangId = ?`)
      .bind(id)
      .first<{ count: number }>();

    if (Number(usage?.count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Bidang cannot be deleted while it is used by soalan entries.' },
        { status: 400 }
      );
    }

    await db.prepare(`DELETE FROM "Bidang" WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete bidang.' }, { status: 500 });
  }
}
