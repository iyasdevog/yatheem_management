import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const isAnonymous = searchParams.get('isAnonymous');
    const currentUser = await getCurrentUser();

    const where: any = {};
    if (isAnonymous !== null && isAnonymous !== undefined && isAnonymous !== '') {
      where.isAnonymous = isAnonymous === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sponsorId: { contains: search } },
        { contact1: { contains: search } },
      ];
    }

    const sponsors = await db.sponsor.findMany({
      where,
      include: {
        students: {
          select: {
            id: true,
            admissionNo: true,
            familyNo: true,
            name: true,
            status: true,
          },
        },
        slabAllocations: {
          include: { slab: true, student: { select: { id: true, name: true, admissionNo: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check if requester is Admin or Staff vs Student Family/Public
    const isAdminOrStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'OFFICE_STAFF';

    const processedSponsors = sponsors.map((sponsor) => {
      if (sponsor.isAnonymous && !isAdminOrStaff) {
        return {
          ...sponsor,
          name: 'Well-wisher',
          contact1: 'Hidden (Anonymous)',
          contact2: null,
          whatsapp: null,
          houseName: 'Protected',
          place: 'Protected',
        };
      }
      return sponsor;
    });

    return NextResponse.json(processedSponsors);
  } catch (error) {
    console.error('Sponsors GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch sponsors' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sponsorId,
      name,
      gender,
      isAnonymous,
      nationalId,
      contact1,
      contact2,
      whatsapp,
      houseName,
      place,
      stateId,
      districtId,
      localBodyTypeId,
      localBodyId,
      postOfficeId,
      pinCode,
      sponsorshipStartDate,
      studentAllocations, // Array of { studentId, slabId, customAmount }
    } = body;

    if (!name || !contact1) {
      return NextResponse.json({ error: 'Name and Contact 1 are required' }, { status: 400 });
    }

    const nextSponsorId = sponsorId || `SP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const sponsor = await db.sponsor.create({
      data: {
        sponsorId: nextSponsorId,
        name,
        gender,
        isAnonymous: Boolean(isAnonymous),
        nationalId,
        contact1,
        contact2,
        whatsapp,
        houseName,
        place,
        stateId,
        districtId,
        localBodyTypeId,
        localBodyId,
        postOfficeId,
        pinCode,
        sponsorshipStartDate: sponsorshipStartDate ? new Date(sponsorshipStartDate) : new Date(),
      },
    });

    // Map Sponsor to Students via Slabs
    if (Array.isArray(studentAllocations) && studentAllocations.length > 0) {
      for (const alloc of studentAllocations) {
        if (alloc.studentId) {
          // Link student to sponsor
          await db.student.update({
            where: { id: alloc.studentId },
            data: {
              sponsorId: sponsor.id,
              sponsorshipStartDate: sponsorshipStartDate ? new Date(sponsorshipStartDate) : new Date(),
            },
          });

          // Create slab allocation record
          await db.sponsorSlabAllocation.create({
            data: {
              sponsorId: sponsor.id,
              studentId: alloc.studentId,
              slabId: alloc.slabId || null,
              customAmount: alloc.customAmount ? parseFloat(alloc.customAmount) : null,
            },
          });
        }
      }
    }

    return NextResponse.json(sponsor, { status: 201 });
  } catch (error: any) {
    console.error('Sponsor POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Sponsor ID already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create sponsor' }, { status: 500 });
  }
}
