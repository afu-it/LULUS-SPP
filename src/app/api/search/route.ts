import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');

  if (!q || q.trim() === '') {
    return NextResponse.json({
      posts: [],
      notes: [],
      tips: [],
      soalan: [],
      caraDaftar: [],
    });
  }

  const query = q.trim();
  const searchCondition = { contains: query };

  try {
    const prisma = getPrisma();
    const [posts, notes, tips, soalan, caraDaftar] = await Promise.all([
      prisma.post.findMany({
        where: { content: searchCondition },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.note.findMany({
        where: {
          OR: [{ title: searchCondition }, { content: searchCondition }],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.tip.findMany({
        where: { content: searchCondition },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { labels: { include: { label: true } } },
      }),
      prisma.soalan.findMany({
        where: { content: searchCondition },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { bidang: true },
      }),
      prisma.caraDaftarStep.findMany({
        where: {
          OR: [{ title: searchCondition }, { content: searchCondition }],
        },
        orderBy: { stepNo: 'asc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      posts,
      notes,
      tips,
      soalan,
      caraDaftar,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
