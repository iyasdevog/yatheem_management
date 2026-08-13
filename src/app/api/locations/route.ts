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

    const cleanParam = (val: string | null) => (val && val !== 'undefined' && val !== 'null' && val.trim() !== '' ? val.trim() : null);

    const validStateId = cleanParam(stateId);
    const validDistrictId = cleanParam(districtId);
    const validLocalBodyTypeId = cleanParam(localBodyTypeId);
    const validLocalBodyId = cleanParam(localBodyId);
    const validPostOfficeId = cleanParam(postOfficeId);

    if (type === 'states') {
      const states = await db.state.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json(states);
    }

    if (type === 'districts') {
      const whereClause = validStateId ? { stateId: validStateId } : {};
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
      if (validDistrictId) {
        where.districtId = validDistrictId;
      } else if (validStateId) {
        where.district = { stateId: validStateId };
      }
      if (validLocalBodyTypeId) {
        where.localBodyTypeId = validLocalBodyTypeId;
      }

      let localBodies = await db.localBody.findMany({
        where,
        include: { localBodyType: true, district: true },
        orderBy: { name: 'asc' },
      });

      // Dynamic Auto-Fetch from India Post if DB has no entries for this district
      if (localBodies.length === 0 && validDistrictId) {
        try {
          const districtObj = await db.district.findUnique({ where: { id: validDistrictId } });
          if (districtObj) {
            const extRes = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(districtObj.name)}`);
            const extData = await extRes.json();
            const resObj = extData?.[0];
            if (resObj && resObj.Status === 'Success' && Array.isArray(resObj.PostOffice)) {
              let defaultType = await db.localBodyType.findFirst({ where: { name: 'Grama Panchayat' } });
              if (!defaultType) defaultType = await db.localBodyType.findFirst();

              const blockNames = Array.from(
                new Set(resObj.PostOffice.map((p: any) => p.Block).filter((b: any) => b && b !== 'NA'))
              ) as string[];

              if (defaultType && blockNames.length > 0) {
                for (const bName of blockNames) {
                  const existing = await db.localBody.findFirst({
                    where: { districtId: validDistrictId, name: `${bName} Panchayat` },
                  });
                  if (!existing) {
                    await db.localBody.create({
                      data: {
                        name: `${bName} Panchayat`,
                        districtId: validDistrictId,
                        localBodyTypeId: defaultType.id,
                      },
                    });
                  }
                }
                localBodies = await db.localBody.findMany({
                  where,
                  include: { localBodyType: true, district: true },
                  orderBy: { name: 'asc' },
                });
              }
            }
          }
        } catch (e) {
          console.error('Dynamic local bodies fetch error:', e);
        }
      }

      return NextResponse.json(localBodies);
    }

    if (type === 'postOffices') {
      const where: any = {};
      if (validDistrictId) {
        where.districtId = validDistrictId;
      } else if (validStateId) {
        where.district = { stateId: validStateId };
      }
      if (validLocalBodyId) {
        where.localBodyId = validLocalBodyId;
      }

      let postOffices = await db.postOffice.findMany({
        where,
        include: { district: true },
        orderBy: { name: 'asc' },
      });

      // Dynamic Auto-Fetch from India Post if DB has no post offices for this district
      if (postOffices.length === 0 && validDistrictId) {
        try {
          const districtObj = await db.district.findUnique({ where: { id: validDistrictId } });
          if (districtObj) {
            const extRes = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(districtObj.name)}`);
            const extData = await extRes.json();
            const resObj = extData?.[0];
            if (resObj && resObj.Status === 'Success' && Array.isArray(resObj.PostOffice)) {
              for (const p of resObj.PostOffice.slice(0, 50)) { // Save up to 50 official POs
                if (p.Name && p.Pincode) {
                  const existing = await db.postOffice.findFirst({
                    where: { districtId: validDistrictId, pinCode: p.Pincode, name: p.Name },
                  });
                  if (!existing) {
                    await db.postOffice.create({
                      data: {
                        name: p.Name,
                        pinCode: p.Pincode,
                        districtId: validDistrictId,
                      },
                    });
                  }
                }
              }
              postOffices = await db.postOffice.findMany({
                where,
                include: { district: true },
                orderBy: { name: 'asc' },
              });
            }
          }
        } catch (e) {
          console.error('Dynamic post office fetch error:', e);
        }
      }

      return NextResponse.json(postOffices);
    }

    if (type === 'pinCode' && validPostOfficeId) {
      const po = await db.postOffice.findUnique({
        where: { id: validPostOfficeId },
      });
      return NextResponse.json({ pinCode: po ? po.pinCode : '' });
    }

    if (type === 'pincodeLookup') {
      const code = searchParams.get('code');
      if (!code || !/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: 'Valid 6-digit PIN code required' }, { status: 400 });
      }

      // 1. Check local DB first
      const dbPostOffices = await db.postOffice.findMany({
        where: { pinCode: code },
        include: { district: { include: { state: true } } },
      });

      if (dbPostOffices.length > 0) {
        const firstPo = dbPostOffices[0];
        return NextResponse.json({
          source: 'database',
          stateId: firstPo.district.stateId,
          stateName: firstPo.district.state.name,
          districtId: firstPo.districtId,
          districtName: firstPo.district.name,
          pinCode: code,
          postOffices: dbPostOffices.map((po) => ({ id: po.id, name: po.name, pinCode: po.pinCode })),
        });
      }

      // 2. Fetch from India Post API (api.postalpincode.in)
      try {
        const externalRes = await fetch(`https://api.postalpincode.in/pincode/${code}`);
        const externalData = await externalRes.json();
        const resObj = externalData?.[0];

        if (resObj && resObj.Status === 'Success' && resObj.PostOffice?.length > 0) {
          const stateName = resObj.PostOffice[0].State;
          const districtName = resObj.PostOffice[0].District;
          const poList = resObj.PostOffice.map((p: any) => ({
            name: p.Name,
            pinCode: p.Pincode,
            branchType: p.BranchType,
          }));

          // Try matching local state & district by name
          const allStates = await db.state.findMany();
          const matchedState = allStates.find(
            (s) => s.name.toLowerCase().includes(stateName.toLowerCase()) || stateName.toLowerCase().includes(s.name.toLowerCase())
          );

          let matchedDistrict: any = null;
          if (matchedState) {
            const stateDistricts = await db.district.findMany({ where: { stateId: matchedState.id } });
            matchedDistrict = stateDistricts.find(
              (d) => d.name.toLowerCase().includes(districtName.toLowerCase()) || districtName.toLowerCase().includes(d.name.toLowerCase())
            );
          }

          return NextResponse.json({
            source: 'api.postalpincode.in',
            stateName,
            stateId: matchedState?.id || '',
            districtName,
            districtId: matchedDistrict?.id || '',
            pinCode: code,
            postOffices: poList,
          });
        }
      } catch (externalErr) {
        console.error('Postal PIN API fetch failed:', externalErr);
      }

      return NextResponse.json({ error: `No postal details found for PIN Code ${code}` }, { status: 404 });
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
