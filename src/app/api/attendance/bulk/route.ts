import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/attendance/bulk
// Body: { date: string, records: [{ studentId, status, leaveReason?, mode? }] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No attendance records provided' }, { status: 400 });
    }

    const attendanceDate = date ? new Date(date) : new Date();

    // Validate all leave records have a reason
    const missingReason = records.find((r) => r.status === 'LEAVE' && !r.leaveReason);
    if (missingReason) {
      return NextResponse.json(
        { error: `Leave reason is required for student ${missingReason.studentId}` },
        { status: 400 }
      );
    }

    // Fetch all referenced students in one query
    const studentIds = records.map((r) => r.studentId);
    const students = await db.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, admissionNo: true, familyNo: true },
    });

    const studentMap = new Map(students.map((s) => [s.id, s]));

    // Delete existing records for this date + students to prevent duplicates
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    await db.attendance.deleteMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    // Bulk insert all attendance records using createMany
    const dataToInsert = records
      .filter((r) => studentMap.has(r.studentId))
      .map((r) => {
        const student = studentMap.get(r.studentId)!;
        return {
          studentId: student.id,
          admissionNo: student.admissionNo,
          familyNo: student.familyNo,
          date: attendanceDate,
          status: r.status || 'PRESENT',
          leaveReason: r.status === 'LEAVE' ? (r.leaveReason || null) : null,
          mode: r.mode || 'MANUAL',
        };
      });

    const result = await db.attendance.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      saved: result.count,
      total: records.length,
      date: attendanceDate.toISOString().split('T')[0],
    }, { status: 201 });

  } catch (error: any) {
    console.error('Bulk Attendance POST error:', error);
    return NextResponse.json({
      error: 'Failed to save bulk attendance',
      details: error?.message,
    }, { status: 500 });
  }
}
