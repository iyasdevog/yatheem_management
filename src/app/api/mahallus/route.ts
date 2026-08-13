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
    const { name, districtId, place, isVerified } = await req.json();

    if (!name || !districtId) {
      return NextResponse.json({ error: 'Name and districtId are required' }, { status: 400 });
    }

    const mahallu = await db.mahallu.create({
      data: { 
        name: name.trim(), 
        districtId, 
        place: place ? place.trim() : null,
        isVerified: isVerified !== undefined ? Boolean(isVerified) : false, // custom added starts as unverified pending admin review
      },
    });

    return NextResponse.json(mahallu, { status: 201 });
  } catch (error) {
    console.error('Mahallu POST error:', error);
    return NextResponse.json({ error: 'Failed to create mahallu' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, districtId, place, isVerified } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Mahallu ID required' }, { status: 400 });
    }

    const data: any = {};
    if (name) data.name = name.trim();
    if (districtId) data.districtId = districtId;
    if (place !== undefined) data.place = place ? place.trim() : null;
    if (isVerified !== undefined) data.isVerified = Boolean(isVerified);

    const updated = await db.mahallu.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Mahallu PUT error:', error);
    return NextResponse.json({ error: 'Failed to update mahallu' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Mahallu ID required' }, { status: 400 });
    }

    await db.mahallu.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mahallu DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete mahallu' }, { status: 500 });
  }
}
