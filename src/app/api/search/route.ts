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
  const normalizedQuery = query.slice(0, 120);

  if (normalizedQuery.length < 2) {
    return NextResponse.json({
      posts: [],
      notes: [],
      tips: [],
      soalan: [],
      caraDaftar: [],
    });
  }

  const searchCondition = { contains: normalizedQuery };

  try {
    const prisma = getPrisma();
    const take = 6;

    const posts = await prisma.post.findMany({
      where: { content: searchCondition },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const notes = await prisma.note.findMany({
      where: {
        OR: [{ title: searchCondition }, { content: searchCondition }],
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const tips = await prisma.tip.findMany({
      where: { content: searchCondition },
      orderBy: { createdAt: 'desc' },
      take,
      include: { labels: { include: { label: true } } },
    });

    const soalan = await prisma.soalan.findMany({
      where: { content: searchCondition },
      orderBy: { createdAt: 'desc' },
      take,
      include: { bidang: true },
    });

    const caraDaftar = await prisma.caraDaftarStep.findMany({
      where: {
        OR: [{ title: searchCondition }, { content: searchCondition }],
      },
      orderBy: { stepNo: 'asc' },
      take,
    });

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
