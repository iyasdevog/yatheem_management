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
        vouchers: {
          orderBy: { date: 'asc' },
        },
        payments: {
          orderBy: { date: 'desc' },
          select: { id: true, amount: true, date: true, paymentMode: true, reference: true, notes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isAdminOrStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'OFFICE_STAFF';

    const processedSponsors = sponsors.map((sponsor) => {
      // Use SponsorPayment records as the source of truth for totalPaid
      const payments = sponsor.payments || [];
      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

      // Determine effective start date
      const vouchers = sponsor.vouchers || [];
      const firstPaymentDate = vouchers.length > 0 ? vouchers[0].date : sponsor.sponsorshipStartDate;
      const effectiveStartDate = sponsor.commitmentStartDate || firstPaymentDate;

      const annualCommitment = sponsor.annualCommitment || 0;
      const remainingBalance = Math.max(0, annualCommitment - totalPaid);
      const fulfillmentPercentage = annualCommitment > 0 ? Math.min(100, Math.round((totalPaid / annualCommitment) * 100)) : 100;

      const base = {
        ...sponsor,
        annualCommitment,
        commitmentStartDate: effectiveStartDate,
        totalPaid,
        remainingBalance,
        fulfillmentPercentage,
        paymentHistory: payments,
      };

      if (sponsor.isAnonymous && !isAdminOrStaff) {
        return {
          ...base,
          name: 'Well-wisher',
          contact1: 'Hidden (Anonymous)',
          contact2: null,
          whatsapp: null,
          houseName: 'Protected',
          place: 'Protected',
        };
      }
      return base;
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
      annualCommitment,
      commitmentStartDate,
      sponsorshipStartDate,
      studentAllocations,
    } = body;

    if (!name || !contact1) {
      return NextResponse.json({ error: 'Name and Contact 1 are required' }, { status: 400 });
    }

    const nextSponsorId = sponsorId || `SP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const parsedCommitment = annualCommitment ? parseFloat(annualCommitment) : 0;
    const startDate = commitmentStartDate ? new Date(commitmentStartDate) : (sponsorshipStartDate ? new Date(sponsorshipStartDate) : new Date());

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
        annualCommitment: isNaN(parsedCommitment) ? 0 : parsedCommitment,
        commitmentStartDate: startDate,
        sponsorshipStartDate: startDate,
      },
    });

    if (Array.isArray(studentAllocations) && studentAllocations.length > 0) {
      for (const alloc of studentAllocations) {
        if (alloc.studentId) {
          await db.student.update({
            where: { id: alloc.studentId },
            data: {
              sponsorId: sponsor.id,
              sponsorshipStartDate: startDate,
            },
          });

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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Sponsor ID required' }, { status: 400 });

    await db.sponsor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sponsor DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete sponsor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
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
      annualCommitment,
      commitmentStartDate,
    } = body;

    if (!id) return NextResponse.json({ error: 'Sponsor ID is required' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const sponsor = await db.sponsor.update({
      where: { id },
      data: {
        name,
        gender,
        isAnonymous: Boolean(isAnonymous),
        nationalId,
        contact1,
        contact2,
        whatsapp,
        houseName,
        place,
        stateId: stateId || null,
        districtId: districtId || null,
        localBodyTypeId: localBodyTypeId || null,
        localBodyId: localBodyId || null,
        postOfficeId: postOfficeId || null,
        pinCode,
        annualCommitment: annualCommitment ? parseFloat(annualCommitment) : undefined,
        commitmentStartDate: commitmentStartDate ? new Date(commitmentStartDate) : undefined,
      },
    });

    return NextResponse.json(sponsor);
  } catch (error: any) {
    console.error('Sponsor PUT error:', error);
    return NextResponse.json({ error: 'Failed to update sponsor' }, { status: 500 });
  }
}
