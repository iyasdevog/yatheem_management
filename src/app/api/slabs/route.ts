import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const slabs = await db.sponsorshipSlab.findMany({
      include: {
        _count: { select: { allocations: true } },
      },
      orderBy: { amount: 'desc' },
    });
    return NextResponse.json(slabs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch slabs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, amount, description } = await req.json();

    if (!name || amount === undefined) {
      return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 });
    }

    const slab = await db.sponsorshipSlab.create({
      data: {
        name,
        amount: parseFloat(amount),
        description,
      },
    });

    return NextResponse.json(slab, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create slab' }, { status: 500 });
  }
}
