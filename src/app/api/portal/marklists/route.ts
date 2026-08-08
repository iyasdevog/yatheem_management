import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StorageFactory } from '@/lib/storage/StorageFactory';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (studentId) where.studentId = studentId;

    const items = await db.markListSubmission.findMany({
      where,
      include: { student: { select: { id: true, name: true, admissionNo: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const storage = StorageFactory.getStorageService();
    const itemsWithUrls = await Promise.all(
      items.map(async (item) => ({
        ...item,
        fileUrl: await storage.getFileUrl(item.fileKey),
      }))
    );

    return NextResponse.json(itemsWithUrls);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch mark lists' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, academicYear, term, fileKey } = body;

    if (!studentId || !fileKey) {
      return NextResponse.json({ error: 'Student ID and File Key are required' }, { status: 400 });
    }

    const item = await db.markListSubmission.create({
      data: {
        studentId,
        academicYear: academicYear || '2025-2026',
        term: term || 'Annual Exam',
        fileKey,
        status: 'PENDING',
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit mark list' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, reviewedBy, reviewNote } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 });
    }

    const updated = await db.markListSubmission.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewedBy || 'Head Admin',
        reviewNote,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to review mark list' }, { status: 500 });
  }
}
