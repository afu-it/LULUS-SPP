import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const startedAt = Date.now();

  try {
    const db = getDb();
    const dbPing = await db.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    const ok = Number(dbPing?.ok ?? 0) === 1;

    return NextResponse.json({
      status: ok ? 'ok' : 'degraded',
      service: 'lulus-spp',
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
      database: ok ? 'ok' : 'unreachable',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        service: 'lulus-spp',
        database: 'unreachable',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}
