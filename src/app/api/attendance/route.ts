import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const studentId = searchParams.get('studentId');
    const familyNo = searchParams.get('familyNo');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (familyNo) where.familyNo = familyNo;

    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const attendances = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            familyNo: true,
            photoKey: true,
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, admissionNo, familyNo, date, status, leaveReason, mode } = body;

    let targetStudent = null;

    if (studentId) {
      targetStudent = await db.student.findUnique({ where: { id: studentId } });
    } else if (admissionNo) {
      targetStudent = await db.student.findUnique({ where: { admissionNo } });
    }

    if (!targetStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (status === 'LEAVE' && !leaveReason) {
      return NextResponse.json({ error: 'Leave reason is mandatory when status is LEAVE' }, { status: 400 });
    }

    const attendanceDate = date ? new Date(date) : new Date();

    const attendance = await db.attendance.create({
      data: {
        studentId: targetStudent.id,
        familyNo: targetStudent.familyNo,
        admissionNo: targetStudent.admissionNo,
        date: attendanceDate,
        status: status || 'PRESENT',
        leaveReason: status === 'LEAVE' ? leaveReason : null,
        mode: mode || 'MANUAL',
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: 'Failed to log attendance' }, { status: 500 });
  }
}
