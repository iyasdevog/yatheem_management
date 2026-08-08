import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const stateId = searchParams.get('stateId');
    const districtId = searchParams.get('districtId');
    const localBodyTypeId = searchParams.get('localBodyTypeId');
    const localBodyId = searchParams.get('localBodyId');
    const postOfficeId = searchParams.get('postOfficeId');

    if (type === 'states') {
      const states = await db.state.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json(states);
    }

    if (type === 'districts') {
      const whereClause = stateId ? { stateId } : {};
      const districts = await db.district.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(districts);
    }

    if (type === 'localBodyTypes') {
      const types = await db.localBodyType.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json(types);
    }

    if (type === 'localBodies') {
      const where: any = {};
      if (districtId) where.districtId = districtId;
      if (localBodyTypeId) where.localBodyTypeId = localBodyTypeId;

      const localBodies = await db.localBody.findMany({
        where,
        include: { localBodyType: true, district: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(localBodies);
    }

    if (type === 'postOffices') {
      const where: any = {};
      if (districtId) where.districtId = districtId;
      if (localBodyId) where.localBodyId = localBodyId;

      const postOffices = await db.postOffice.findMany({
        where,
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(postOffices);
    }

    if (type === 'pinCode' && postOfficeId) {
      const po = await db.postOffice.findUnique({
        where: { id: postOfficeId },
      });
      return NextResponse.json({ pinCode: po ? po.pinCode : '' });
    }

    // Default full summary hierarchy payload
    const states = await db.state.findMany({
      include: {
        districts: {
          include: {
            localBodies: { include: { localBodyType: true } },
            postOffices: true,
          },
        },
      },
    });

    const localBodyTypes = await db.localBodyType.findMany();

    return NextResponse.json({ states, localBodyTypes });
  } catch (error) {
    console.error('Locations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch location data' }, { status: 500 });
  }
}
