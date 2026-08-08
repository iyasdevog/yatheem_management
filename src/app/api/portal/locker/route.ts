import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StorageFactory } from '@/lib/storage/StorageFactory';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (studentId) where.studentId = studentId;

    const items = await db.documentLockerItem.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
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
    return NextResponse.json({ error: 'Failed to fetch locker documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, title, category, fileKey } = body;

    if (!studentId || !title || !fileKey) {
      return NextResponse.json({ error: 'Student ID, Title, and File Key are required' }, { status: 400 });
    }

    const item = await db.documentLockerItem.create({
      data: {
        studentId,
        title,
        category: category || 'Other',
        fileKey,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save document to locker' }, { status: 500 });
  }
}
