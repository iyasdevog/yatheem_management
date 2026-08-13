import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const STUDENT_HEADINGS = [
  'Dress exp',
  'Meat exp',
  'Medical exp',
  'Monthly exp',
  'Monthly kit exp',
  'Perunnal kit exp',
  'School & madrasa kit',
  'Academic affairs',
  'Vehicle exp',
];

export const COMMON_HEADINGS = [
  'Salary of section employees',
  'Transportation',
  'TA & DA for trainers',
  'Camp exp',
  'Infrastructure repair',
  'Utility bills & maintenance',
  'Other operational cost',
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const heading = searchParams.get('heading');
    const studentId = searchParams.get('studentId');
    const sponsorId = searchParams.get('sponsorId');
    const familyNo = searchParams.get('familyNo');

    const where: any = {};
    if (type) where.type = type;
    if (heading) where.heading = heading;
    if (studentId) where.studentId = studentId;
    if (sponsorId) where.sponsorId = sponsorId;
    if (familyNo) where.familyNo = familyNo;

    const vouchers = await db.voucher.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            familyNo: true,
            name: true,
            sponsor: { select: { id: true, name: true, isAnonymous: true } },
          },
        },
        sponsor: {
          select: { id: true, name: true, sponsorId: true, isAnonymous: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Vouchers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      voucherNo,
      date,
      amount,
      type, // 'STUDENT_EXPENSE' | 'YATHEEM_COMMON'
      heading,
      paymentMode,
      studentId,
      sponsorId,
      familyNo,
      studentName,
      description,
      createdBy,
    } = body;

    if (!amount || !heading || !paymentMode) {
      return NextResponse.json(
        { error: 'Amount, Heading, and Payment Mode are required' },
        { status: 400 }
      );
    }

    const autoVoucherNo = voucherNo || `VCH-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let activeSponsorName = null;
    let resolvedSponsorId = sponsorId || null;
    let resolvedFamilyNo = familyNo;
    let resolvedStudentName = studentName;

    if (type === 'STUDENT_EXPENSE' && studentId) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: { sponsor: true },
      });
      if (student) {
        resolvedFamilyNo = student.familyNo;
        resolvedStudentName = student.name;
        if (student.sponsor) {
          resolvedSponsorId = student.sponsor.id;
          activeSponsorName = student.sponsor.isAnonymous
            ? 'Well-wisher'
            : student.sponsor.name;
        }
      }
    } else if (resolvedSponsorId) {
      const sp = await db.sponsor.findUnique({ where: { id: resolvedSponsorId } });
      if (sp) {
        activeSponsorName = sp.isAnonymous ? 'Well-wisher' : sp.name;
      }
    }

    const voucher = await db.voucher.create({
      data: {
        voucherNo: autoVoucherNo,
        date: date ? new Date(date) : new Date(),
        amount: parseFloat(amount),
        type: type || 'STUDENT_EXPENSE',
        heading,
        paymentMode,
        studentId: studentId || null,
        sponsorId: resolvedSponsorId,
        familyNo: resolvedFamilyNo,
        studentName: resolvedStudentName,
        sponsorName: activeSponsorName,
        description,
        createdBy: createdBy || 'Admin Officer',
      },
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error: any) {
    console.error('Voucher POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Voucher Number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 });
  }
}
