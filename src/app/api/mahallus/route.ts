import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get('districtId');
    const query = searchParams.get('q');

    const where: any = {};
    if (districtId) where.districtId = districtId;
    if (query) {
      where.name = { contains: query };
    }

    const mahallus = await db.mahallu.findMany({
      where,
      include: { district: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(mahallus);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch mahallus' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, districtId, place } = await req.json();

    if (!name || !districtId) {
      return NextResponse.json({ error: 'Name and districtId are required' }, { status: 400 });
    }

    const mahallu = await db.mahallu.create({
      data: { name, districtId, place },
    });

    return NextResponse.json(mahallu, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create mahallu' }, { status: 500 });
  }
}
