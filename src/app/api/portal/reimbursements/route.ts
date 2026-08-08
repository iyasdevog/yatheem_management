import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (studentId) where.studentId = studentId;

    const items = await db.reimbursementRequest.findMany({
      where,
      include: { student: { select: { id: true, name: true, admissionNo: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reimbursement requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, amount, heading, description, documentKeys } = body;

    if (!studentId || !amount || !heading) {
      return NextResponse.json({ error: 'Student ID, Amount, and Heading are required' }, { status: 400 });
    }

    const item = await db.reimbursementRequest.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        heading,
        description: description || '',
        status: 'PENDING',
        documentKeysJson: documentKeys ? JSON.stringify(documentKeys) : null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit reimbursement request' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, reviewNote } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 });
    }

    const updated = await db.reimbursementRequest.update({
      where: { id },
      data: {
        status,
        reviewNote,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reimbursement request status' }, { status: 500 });
  }
}
